import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextAuthOptions'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get active Google Ads integration
    const integration = await prisma.integration.findFirst({
      where: {
        userId: session.user.id,
        platform: 'google-ads',
        isActive: true
      }
    })

    if (!integration) {
      return NextResponse.json({ error: 'No active Google Ads integration found' }, { status: 404 })
    }

    if (!integration.accessToken) {
      return NextResponse.json({ error: 'No access token found' }, { status: 400 })
    }

    // Refresh token if needed
    let accessToken = integration.accessToken
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
        
        // Update token in database
        await prisma.integration.update({
          where: { id: integration.id },
          data: {
            accessToken: refreshData.access_token,
            expiresAt: new Date(Date.now() + refreshData.expires_in * 1000)
          }
        })
      }
    }

    // Fetch accessible Google Ads accounts
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
      const error = await accountsResponse.text()
      console.error('Google Ads API error (accounts):', error)
      
      return NextResponse.json({ 
        error: 'Failed to fetch Google Ads accounts. Make sure your developer token is approved and the account has access to Google Ads.', 
        details: error
      }, { status: accountsResponse.status })
    }

    const accountsData = await accountsResponse.json()
    const customerIds = accountsData.resourceNames?.map((rn: string) => 
      rn.replace('customers/', '')
    ) || []

    if (customerIds.length === 0) {
      return NextResponse.json({ 
        error: 'No Google Ads accounts found',
        message: 'This Google account does not have access to any Google Ads accounts.'
      }, { status: 404 })
    }

    let totalCampaigns = 0
    let totalMetrics = 0

    // For each customer account, fetch campaigns
    for (const customerId of customerIds) {
      // Google Ads Query Language (GAQL) query for campaigns
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

      if (!searchResponse.ok) {
        console.error(`Failed to fetch campaigns for customer ${customerId}`)
        continue
      }

      const searchData = await searchResponse.json()
      const campaigns = searchData.results || []

      // Group by campaign (aggregate metrics)
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
        campaign.cost += parseInt(metrics.costMicros || 0) / 1000000 // Convert micros to currency
        campaign.conversions += parseFloat(metrics.conversions || 0)
        campaign.conversionValue += parseFloat(metrics.conversionsValue || 0)
      }

      totalCampaigns += campaignMap.size

      // Save to database
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

        // Step 1: Find or create Campaign
        let dbCampaign = await prisma.campaign.findFirst({
          where: {
            platform: 'google-ads',
            name: campaign.name,
            userId: session.user.id
          }
        })

        if (!dbCampaign) {
          dbCampaign = await prisma.campaign.create({
            data: {
              userId: session.user.id,
              integrationId: integration.id,
              platform: 'google-ads',
              platformCampaignId: campaignId,
              name: campaign.name,
              status: campaign.status,
            }
          })
        } else {
          dbCampaign = await prisma.campaign.update({
            where: { id: dbCampaign.id },
            data: {
              platformCampaignId: campaignId,
              status: campaign.status,
              integrationId: integration.id,
            }
          })
        }

        // Step 2: Create daily snapshot in CampaignMetric
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Normalize to midnight

        await prisma.campaignMetric.upsert({
          where: {
            campaignId_date: {
              campaignId: dbCampaign.id,
              date: today
            }
          },
          update: {
            spend,
            impressions,
            clicks,
            conversions,
            revenue,
            ctr,
            cpc,
            roas,
            cpa,
          },
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

        totalMetrics++
      }

      // Update integration with account info
      await prisma.integration.update({
        where: { id: integration.id },
        data: {
          accountId: customerId,
          accountName: `Google Ads Account ${customerId}`
        }
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Google Ads data synced successfully',
      accounts: customerIds.length,
      campaigns: totalCampaigns,
      metrics: totalMetrics
    })

  } catch (error) {
    console.error('Google Ads sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get campaign count
    const campaignCount = await prisma.campaign.count({
      where: {
        userId: session.user.id,
        platform: 'google-ads'
      }
    })

    // Get last metric sync date
    const lastMetric = await prisma.campaignMetric.findFirst({
      where: {
        campaign: {
          userId: session.user.id,
          platform: 'google-ads'
        }
      },
      orderBy: {
        date: 'desc'
      },
      select: {
        date: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      lastSync: lastMetric?.createdAt || null,
      lastMetricDate: lastMetric?.date || null,
      campaignCount
    })

  } catch (error) {
    console.error('Google Ads sync status error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

