import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// This endpoint syncs data for all active integrations
// Can be called by cron job or manually
export async function POST(request: NextRequest) {
  try {
    // Simple auth check - you can add a secret key for cron jobs
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-change-in-production'
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔄 Starting automatic sync for all users...')

    // Get all active integrations
    const integrations = await prisma.integration.findMany({
      where: {
        isActive: true,
        OR: [
          { platform: 'meta' },
          { platform: 'google-ads' },
          { platform: 'ga4' }
        ]
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    })

    console.log(`📊 Found ${integrations.length} active integrations`)

    const results = {
      total: integrations.length,
      success: 0,
      failed: 0,
      details: [] as any[]
    }

    // Sync each integration
    for (const integration of integrations) {
      try {
        console.log(`🔄 Syncing ${integration.platform} for user ${integration.user.email}...`)

        if (integration.platform === 'meta') {
          await syncMetaIntegration(integration)
        } else if (integration.platform === 'google-ads') {
          await syncGoogleAdsIntegration(integration)
        } else if (integration.platform === 'ga4') {
          await syncGa4Integration(integration)
        }

        results.success++
        results.details.push({
          userId: integration.userId,
          userEmail: integration.user.email,
          platform: integration.platform,
          status: 'success'
        })

        console.log(`✅ Successfully synced ${integration.platform} for ${integration.user.email}`)
      } catch (error) {
        results.failed++
        results.details.push({
          userId: integration.userId,
          userEmail: integration.user.email,
          platform: integration.platform,
          status: 'failed',
          error: String(error)
        })

        console.error(`❌ Failed to sync ${integration.platform} for ${integration.user.email}:`, error)
      }
    }

    console.log(`✅ Sync completed: ${results.success} success, ${results.failed} failed`)

    return NextResponse.json({
      success: true,
      message: 'Sync completed',
      results
    })

  } catch (error) {
    console.error('Cron sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

// Helper function to sync Meta integration
async function syncMetaIntegration(integration: any) {
  const accountsResponse = await fetch(
    `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${integration.accessToken}`,
    { method: 'GET' }
  )

  if (!accountsResponse.ok) {
    throw new Error('Failed to fetch Meta ad accounts')
  }

  const accountsData = await accountsResponse.json()
  const adAccounts = accountsData.data || []

  let totalCampaigns = 0

  for (const adAccount of adAccounts) {
    const accountId = adAccount.id

    const campaignsResponse = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/campaigns?` +
      `fields=id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time&` +
      `access_token=${integration.accessToken}`,
      { method: 'GET' }
    )

    if (!campaignsResponse.ok) continue

    const campaignsData = await campaignsResponse.json()
    const campaigns = campaignsData.data || []

    for (const campaign of campaigns) {
      const insightsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${campaign.id}/insights?` +
        `fields=spend,impressions,clicks,ctr,cpc,reach,frequency,actions&` +
        `date_preset=last_30d&` +
        `access_token=${integration.accessToken}`,
        { method: 'GET' }
      )

      if (!insightsResponse.ok) continue

      const insightsData = await insightsResponse.json()
      const insights = insightsData.data?.[0] || {}

      const actions = insights.actions || []
      const conversions = actions.find((a: any) => 
        a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
      )?.value || 0

      // Calculate metrics
      const conversionsNum = parseFloat(conversions)
      const revenue = conversionsNum * 50
      const spend = parseFloat(insights.spend || 0)
      const impressions = parseInt(insights.impressions || 0)
      const clicks = parseInt(insights.clicks || 0)
      const ctr = parseFloat(insights.ctr || 0)
      const cpc = parseFloat(insights.cpc || 0)
      const roas = spend > 0 ? revenue / spend : 0
      const cpa = conversionsNum > 0 ? spend / conversionsNum : 0

      // Step 1: Upsert Campaign (master data)
      const dbCampaign = await prisma.campaign.upsert({
        where: {
          platform_name_userId: {
            platform: 'meta',
            name: campaign.name,
            userId: integration.userId
          }
        },
        update: {
          platformCampaignId: campaign.id,
          status: campaign.status,
          integrationId: integration.id,
        },
        create: {
          userId: integration.userId,
          integrationId: integration.id,
          platform: 'meta',
          platformCampaignId: campaign.id,
          name: campaign.name,
          status: campaign.status,
        }
      })

      // Step 2: Create daily snapshot
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await prisma.campaignMetric.upsert({
        where: {
          campaignId_date: {
            campaignId: dbCampaign.id,
            date: today
          }
        },
        update: { spend, impressions, clicks, conversions: conversionsNum, revenue, ctr, cpc, roas, cpa },
        create: {
          campaignId: dbCampaign.id,
          date: today,
          spend,
          impressions,
          clicks,
          conversions: conversionsNum,
          revenue,
          ctr,
          cpc,
          roas,
          cpa,
        }
      })

      totalCampaigns++
    }
  }

  return { campaigns: totalCampaigns }
}

// Helper function to sync Google Ads integration
async function syncGoogleAdsIntegration(integration: any) {
  let accessToken = integration.accessToken

  // Refresh token if needed
  if (integration.refreshToken && integration.expiresAt && new Date() > integration.expiresAt) {
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
        refresh_token: integration.refreshToken,
        grant_type: 'refresh_token'
      })
    })

    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json()
      accessToken = refreshData.access_token
      
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          accessToken: refreshData.access_token,
          expiresAt: new Date(Date.now() + refreshData.expires_in * 1000)
        }
      })
    }
  }

  // Fetch accessible customers
  const accountsResponse = await fetch(
    'https://googleads.googleapis.com/v16/customers:listAccessibleCustomers',
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
        'Content-Type': 'application/json'
      }
    }
  )

  if (!accountsResponse.ok) {
    throw new Error('Failed to fetch Google Ads accounts')
  }

  const accountsData = await accountsResponse.json()
  const customerIds = accountsData.resourceNames?.map((rn: string) => 
    rn.replace('customers/', '')
  ) || []

  let totalCampaigns = 0

  for (const customerId of customerIds) {
    const query = `
      SELECT 
        campaign.id,
        campaign.name,
        campaign.status,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions,
        metrics.conversions_value,
        metrics.ctr,
        metrics.average_cpc
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
    `

    const searchResponse = await fetch(
      `https://googleads.googleapis.com/v16/customers/${customerId}/googleAds:search`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ query })
      }
    )

    if (!searchResponse.ok) continue

    const searchData = await searchResponse.json()
    const campaigns = searchData.results || []

    const campaignMap = new Map()
    
    for (const result of campaigns) {
      const campaignId = result.campaign.id
      const campaignName = result.campaign.name
      const metrics = result.metrics

      if (!campaignMap.has(campaignId)) {
        campaignMap.set(campaignId, {
          id: campaignId,
          name: campaignName,
          status: result.campaign.status,
          impressions: 0,
          clicks: 0,
          cost: 0,
          conversions: 0,
          conversionValue: 0
        })
      }

      const campaign = campaignMap.get(campaignId)
      campaign.impressions += parseInt(metrics.impressions || 0)
      campaign.clicks += parseInt(metrics.clicks || 0)
      campaign.cost += parseInt(metrics.costMicros || 0) / 1000000
      campaign.conversions += parseFloat(metrics.conversions || 0)
      campaign.conversionValue += parseFloat(metrics.conversionsValue || 0)
    }

    for (const [campaignId, campaign] of campaignMap) {
      const spend = campaign.cost
      const revenue = campaign.conversionValue
      const conversions = campaign.conversions
      const impressions = campaign.impressions
      const clicks = campaign.clicks
      
      // Calculate metrics
      const roas = spend > 0 ? revenue / spend : 0
      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
      const cpc = clicks > 0 ? spend / clicks : 0
      const cpa = conversions > 0 ? spend / conversions : 0

      // Step 1: Upsert Campaign (master data)
      const dbCampaign = await prisma.campaign.upsert({
        where: {
          platform_name_userId: {
            platform: 'google-ads',
            name: campaign.name,
            userId: integration.userId
          }
        },
        update: {
          platformCampaignId: campaignId,
          status: campaign.status,
          integrationId: integration.id,
        },
        create: {
          userId: integration.userId,
          integrationId: integration.id,
          platform: 'google-ads',
          platformCampaignId: campaignId,
          name: campaign.name,
          status: campaign.status,
        }
      })

      // Step 2: Create daily snapshot
      const today = new Date()
      today.setHours(0, 0, 0, 0)

      await prisma.campaignMetric.upsert({
        where: {
          campaignId_date: {
            campaignId: dbCampaign.id,
            date: today
          }
        },
        update: { spend, impressions, clicks, conversions, revenue, ctr, cpc, roas, cpa },
        create: {
          campaignId: dbCampaign.id,
          date: today,
          spend,
          impressions,
          clicks,
          conversions,
          revenue,
          ctr,
          cpc,
          roas,
          cpa,
        }
      })

      totalCampaigns++
    }
  }

  return { campaigns: totalCampaigns }
}

// Helper function to sync GA4 integration (stores events)
async function syncGa4Integration(integration: any) {
  let accessToken = integration.accessToken

  if (integration.refreshToken && integration.expiresAt && new Date() > integration.expiresAt) {
    const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        refresh_token: integration.refreshToken,
        grant_type: 'refresh_token'
      })
    })

    if (refreshResponse.ok) {
      const refreshData = await refreshResponse.json()
      accessToken = refreshData.access_token

      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          accessToken: refreshData.access_token,
          expiresAt: refreshData.expires_in 
            ? new Date(Date.now() + refreshData.expires_in * 1000)
            : null
        }
      })
    }
  }

  const propertyId = integration.accountId || 'default'

  const reportResponse = await fetch(
    `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
        dimensions: [
          { name: 'date' },
          { name: 'eventName' },
          { name: 'sessionSource' },
          { name: 'sessionMedium' },
          { name: 'sessionCampaignName' }
        ],
        metrics: [
          { name: 'eventCount' },
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'eventValue' }
        ],
        limit: 1000
      })
    }
  )

  if (!reportResponse.ok) {
    const error = await reportResponse.text()
    throw new Error(`GA4 Data API error: ${error}`)
  }

  const reportData = await reportResponse.json()
  const rows = reportData.rows || []

  for (const row of rows) {
    const dimensions = row.dimensionValues || []
    const metrics = row.metricValues || []

    const eventDate = dimensions[0]?.value || new Date().toISOString().split('T')[0]
    const eventName = dimensions[1]?.value || 'unknown'
    const source = dimensions[2]?.value || '(direct)'
    const medium = dimensions[3]?.value || '(none)'
    const campaignName = dimensions[4]?.value || '(not set)'

    const eventCount = parseInt(metrics[0]?.value || '0', 10)
    const sessions = parseInt(metrics[1]?.value || '0', 10)
    const users = parseInt(metrics[2]?.value || '0', 10)
    const eventValue = parseFloat(metrics[3]?.value || '0')

    const eventTime = new Date(eventDate)

    await prisma.event.create({
      data: {
        userId: integration.userId,
        eventName,
        eventValue,
        eventTime,
        source: 'ga4',
        eventParams: { source, medium, campaignName, eventCount, sessions, users }
      }
    })
  }
}

