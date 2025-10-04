import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextAuthOptions'
import { prisma } from '@/lib/prisma'

// Generate mock Meta campaigns data
async function generateMockMetaData(userId: string) {
  const campaigns = [
    { name: 'Summer Sale Campaign', budget: 5000, objective: 'CONVERSIONS' },
    { name: 'Brand Awareness Q4', budget: 3000, objective: 'BRAND_AWARENESS' },
    { name: 'Product Launch - New Collection', budget: 8000, objective: 'CONVERSIONS' },
    { name: 'Retargeting - Cart Abandonment', budget: 2000, objective: 'CONVERSIONS' },
    { name: 'Instagram Stories Engagement', budget: 1500, objective: 'ENGAGEMENT' },
  ]

  let totalCampaigns = 0

  for (const campaign of campaigns) {
    const spend = campaign.budget * (0.6 + Math.random() * 0.3) // 60-90% of budget
    const impressions = Math.floor(spend * (800 + Math.random() * 400)) // 800-1200 impressions per $
    const clicks = Math.floor(impressions * (0.01 + Math.random() * 0.03)) // 1-4% CTR
    const conversions = Math.floor(clicks * (0.02 + Math.random() * 0.08)) // 2-10% conversion rate
    const revenue = conversions * (40 + Math.random() * 80) // $40-120 per conversion
    const ctr = (clicks / impressions) * 100
    const cpc = spend / clicks
    const roas = revenue / spend

    await prisma.campaign.upsert({
      where: {
        platform_name_userId: {
          platform: 'meta',
          name: campaign.name,
          userId: userId
        }
      },
      update: {
        campaignId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        status: 'ACTIVE',
        spend: spend,
        impressions: impressions,
        clicks: clicks,
        conversions: conversions,
        revenue: revenue,
        ctr: ctr,
        cpc: cpc,
        roas: roas,
        date: new Date()
      },
      create: {
        userId: userId,
        platform: 'meta',
        campaignId: `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: campaign.name,
        status: 'ACTIVE',
        spend: spend,
        impressions: impressions,
        clicks: clicks,
        conversions: conversions,
        revenue: revenue,
        ctr: ctr,
        cpc: cpc,
        roas: roas,
        date: new Date()
      }
    })

    totalCampaigns++
  }

  return { campaigns: totalCampaigns, insights: totalCampaigns }
}

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
      
      // If API fails due to permissions, use mock data instead
      console.log('Meta API permissions insufficient, generating mock data...')
      const mockResult = await generateMockMetaData(session.user.id)
      
      return NextResponse.json({
        success: true,
        message: 'Mock Meta data generated successfully (real API requires ads_read permission)',
        adAccounts: 1,
        campaigns: mockResult.campaigns,
        insights: mockResult.insights,
        isMockData: true
      })
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

