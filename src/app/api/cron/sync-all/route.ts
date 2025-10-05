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
          { platform: 'google-ads' }
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

      const revenue = parseFloat(conversions) * 50
      const spend = parseFloat(insights.spend || 0)
      const roas = spend > 0 ? revenue / spend : 0

      await prisma.campaign.upsert({
        where: {
          platform_name_userId: {
            platform: 'meta',
            name: campaign.name,
            userId: integration.userId
          }
        },
        update: {
          campaignId: campaign.id,
          status: campaign.status,
          spend: spend,
          impressions: parseInt(insights.impressions || 0),
          clicks: parseInt(insights.clicks || 0),
          conversions: parseFloat(conversions),
          revenue: revenue,
          ctr: parseFloat(insights.ctr || 0),
          cpc: parseFloat(insights.cpc || 0),
          roas: roas,
          date: new Date()
        },
        create: {
          userId: integration.userId,
          platform: 'meta',
          campaignId: campaign.id,
          name: campaign.name,
          status: campaign.status,
          spend: spend,
          impressions: parseInt(insights.impressions || 0),
          clicks: parseInt(insights.clicks || 0),
          conversions: parseFloat(conversions),
          revenue: revenue,
          ctr: parseFloat(insights.ctr || 0),
          cpc: parseFloat(insights.cpc || 0),
          roas: roas,
          date: new Date()
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
      const roas = spend > 0 ? revenue / spend : 0
      const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0
      const cpc = campaign.clicks > 0 ? spend / campaign.clicks : 0

      await prisma.campaign.upsert({
        where: {
          platform_name_userId: {
            platform: 'google-ads',
            name: campaign.name,
            userId: integration.userId
          }
        },
        update: {
          campaignId: campaignId,
          status: campaign.status,
          spend: spend,
          impressions: campaign.impressions,
          clicks: campaign.clicks,
          conversions: campaign.conversions,
          revenue: revenue,
          ctr: ctr,
          cpc: cpc,
          roas: roas,
          date: new Date(),
          integrationId: integration.id
        },
        create: {
          userId: integration.userId,
          integrationId: integration.id,
          platform: 'google-ads',
          campaignId: campaignId,
          name: campaign.name,
          status: campaign.status,
          spend: spend,
          impressions: campaign.impressions,
          clicks: campaign.clicks,
          conversions: campaign.conversions,
          revenue: revenue,
          ctr: ctr,
          cpc: cpc,
          roas: roas,
          date: new Date()
        }
      })

      totalCampaigns++
    }
  }

  return { campaigns: totalCampaigns }
}

