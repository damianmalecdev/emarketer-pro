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

    // Get active Meta integration
    const integration = await prisma.integration.findFirst({
      where: {
        userId: session.user.id,
        platform: 'meta',
        isActive: true
      }
    })

    if (!integration) {
      return NextResponse.json({ error: 'No active Meta integration found' }, { status: 404 })
    }

    // Fetch ad accounts
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${integration.accessToken}`,
      { method: 'GET' }
    )

    if (!accountsResponse.ok) {
      const error = await accountsResponse.json()
      console.error('Meta API error (accounts):', error)
      
      return NextResponse.json({ 
        error: 'Failed to fetch ad accounts. Your Meta app needs "ads_read" permission from Facebook App Review.', 
        details: error,
        helpUrl: 'https://developers.facebook.com/docs/app-review'
      }, { status: accountsResponse.status })
    }

    const accountsData = await accountsResponse.json()
    const adAccounts = accountsData.data || []

    let totalCampaigns = 0
    let totalInsights = 0

    // For each ad account, fetch campaigns
    for (const adAccount of adAccounts) {
      const accountId = adAccount.id

      // Fetch campaigns for this account
      const campaignsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${accountId}/campaigns?` +
        `fields=id,name,status,objective,daily_budget,lifetime_budget,created_time,updated_time&` +
        `access_token=${integration.accessToken}`,
        { method: 'GET' }
      )

      if (!campaignsResponse.ok) {
        console.error(`Failed to fetch campaigns for account ${accountId}`)
        continue
      }

      const campaignsData = await campaignsResponse.json()
      const campaigns = campaignsData.data || []

      totalCampaigns += campaigns.length

      // For each campaign, fetch insights
      for (const campaign of campaigns) {
        // Fetch campaign insights (last 30 days)
        const insightsResponse = await fetch(
          `https://graph.facebook.com/v18.0/${campaign.id}/insights?` +
          `fields=spend,impressions,clicks,ctr,cpc,reach,frequency,actions&` +
          `date_preset=last_30d&` +
          `access_token=${integration.accessToken}`,
          { method: 'GET' }
        )

        if (!insightsResponse.ok) {
          console.error(`Failed to fetch insights for campaign ${campaign.id}`)
          continue
        }

        const insightsData = await insightsResponse.json()
        const insights = insightsData.data?.[0] || {}

        // Calculate conversions and revenue from actions
        const actions = insights.actions || []
        const conversions = actions.find((a: any) => 
          a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
        )?.value || 0

        // Estimate revenue (you'll need to adjust this based on your business)
        const revenue = parseFloat(conversions) * 50 // Assume $50 per conversion
        const spend = parseFloat(insights.spend || 0)
        const roas = spend > 0 ? revenue / spend : 0

        // Save to database
        await prisma.campaign.upsert({
          where: {
            platform_name_userId: {
              platform: 'meta',
              name: campaign.name,
              userId: session.user.id
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
            userId: session.user.id,
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

        totalInsights++
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Meta data synced successfully',
      adAccounts: adAccounts.length,
      campaigns: totalCampaigns,
      insights: totalInsights
    })

  } catch (error) {
    console.error('Meta sync error:', error)
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

    // Get last sync info
    const lastCampaign = await prisma.campaign.findFirst({
      where: {
        userId: session.user.id,
        platform: 'meta'
      },
      orderBy: {
        date: 'desc'
      }
    })

    const campaignCount = await prisma.campaign.count({
      where: {
        userId: session.user.id,
        platform: 'meta'
      }
    })

    return NextResponse.json({
      success: true,
      lastSync: lastCampaign?.date || null,
      campaignCount
    })

  } catch (error) {
    console.error('Meta sync status error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

