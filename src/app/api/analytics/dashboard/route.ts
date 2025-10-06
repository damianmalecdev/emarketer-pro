import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextAuthOptions'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '30')

    // Optional explicit date range
    const startDateParam = searchParams.get('startDate')
    const endDateParam = searchParams.get('endDate')
    const startDate = startDateParam ? new Date(startDateParam) : new Date()
    const endDate = endDateParam ? new Date(endDateParam) : new Date()

    if (!startDateParam) {
      startDate.setDate(startDate.getDate() - days)
    }
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    // Optional account filters per platform
    const googleAccountId = searchParams.get('googleAccountId') || undefined
    const metaAccountId = searchParams.get('metaAccountId') || undefined
    const ga4AccountId = searchParams.get('ga4AccountId') || undefined
    const platformParam = searchParams.get('platform') || undefined

    // Get all metrics for the period
    const metrics = await prisma.campaignMetric.findMany({
      where: {
        campaign: {
          userId: session.user.id,
          ...(platformParam ? { platform: platformParam } : {}),
          ...(googleAccountId || metaAccountId || ga4AccountId
            ? {
                integration: {
                  OR: [
                    ...(googleAccountId
                      ? [{ platform: 'google', accountId: googleAccountId }]
                      : []),
                    ...(metaAccountId
                      ? [{ platform: 'meta', accountId: metaAccountId }]
                      : []),
                    ...(ga4AccountId
                      ? [{ platform: 'ga4', accountId: ga4AccountId }]
                      : []),
                  ],
                },
              }
            : {}),
        },
        date: {
          gte: startDate,
          lte: endDate,
        }
      },
      include: {
        campaign: {
          select: {
            name: true,
            platform: true,
            status: true
          }
        }
      },
      orderBy: {
        date: 'asc'
      }
    })

    if (metrics.length === 0) {
      return NextResponse.json({
        kpis: {
          totalSpend: 0,
          totalRevenue: 0,
          totalClicks: 0,
          totalConversions: 0,
          totalImpressions: 0,
          avgCTR: 0,
          avgCPC: 0,
          avgROAS: 0,
          avgCPA: 0
        },
        chartData: [],
        topCampaigns: [],
        platformBreakdown: {}
      })
    }

    // Calculate KPIs
    const kpis = {
      totalSpend: metrics.reduce((sum, m) => sum + m.spend, 0),
      totalRevenue: metrics.reduce((sum, m) => sum + m.revenue, 0),
      totalClicks: metrics.reduce((sum, m) => sum + m.clicks, 0),
      totalConversions: metrics.reduce((sum, m) => sum + m.conversions, 0),
      totalImpressions: metrics.reduce((sum, m) => sum + m.impressions, 0),
      avgCTR: metrics.reduce((sum, m) => sum + m.ctr, 0) / metrics.length,
      avgCPC: metrics.reduce((sum, m) => sum + m.cpc, 0) / metrics.length,
      avgROAS: metrics.reduce((sum, m) => sum + m.roas, 0) / metrics.length,
      avgCPA: metrics.reduce((sum, m) => sum + m.cpa, 0) / metrics.length
    }

    // Group by date for chart data
    const metricsByDate = metrics.reduce((acc, m) => {
      const dateKey = m.date.toISOString().split('T')[0]
      if (!acc[dateKey]) {
        acc[dateKey] = { date: dateKey, spend: 0, revenue: 0, clicks: 0, impressions: 0 }
      }
      acc[dateKey].spend += m.spend
      acc[dateKey].revenue += m.revenue
      acc[dateKey].clicks += m.clicks
      acc[dateKey].impressions += m.impressions
      return acc
    }, {} as Record<string, any>)

    const chartData = Object.values(metricsByDate)

    // Calculate top campaigns (aggregate by campaign name)
    const campaignTotals = metrics.reduce((acc, m) => {
      const key = `${m.campaign.name}|${m.campaign.platform}`
      if (!acc[key]) {
        acc[key] = {
          name: m.campaign.name,
          platform: m.campaign.platform,
          spend: 0,
          revenue: 0,
          clicks: 0,
          impressions: 0,
          conversions: 0,
          metricsCount: 0
        }
      }
      acc[key].spend += m.spend
      acc[key].revenue += m.revenue
      acc[key].clicks += m.clicks
      acc[key].impressions += m.impressions
      acc[key].conversions += m.conversions
      acc[key].metricsCount++
      return acc
    }, {} as Record<string, any>)

    const topCampaigns = Object.values(campaignTotals)
      .map((c: any) => ({
        name: c.name,
        platform: c.platform,
        spend: c.spend,
        revenue: c.revenue,
        roas: c.spend > 0 ? c.revenue / c.spend : 0,
        clicks: c.clicks,
        impressions: c.impressions,
        conversions: c.conversions,
        ctr: c.impressions > 0 ? (c.clicks / c.impressions) * 100 : 0,
        cpc: c.clicks > 0 ? c.spend / c.clicks : 0,
        daysActive: c.metricsCount
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10)

    // Platform breakdown
    const platformBreakdown = metrics.reduce((acc, m) => {
      const platform = m.campaign.platform
      if (!acc[platform]) {
        acc[platform] = {
          spend: 0,
          revenue: 0,
          clicks: 0,
          impressions: 0,
          conversions: 0,
          campaigns: new Set()
        }
      }
      acc[platform].spend += m.spend
      acc[platform].revenue += m.revenue
      acc[platform].clicks += m.clicks
      acc[platform].impressions += m.impressions
      acc[platform].conversions += m.conversions
      acc[platform].campaigns.add(m.campaign.name)
      return acc
    }, {} as Record<string, any>)

    // Convert Sets to counts
    Object.keys(platformBreakdown).forEach(key => {
      platformBreakdown[key].campaignCount = platformBreakdown[key].campaigns.size
      delete platformBreakdown[key].campaigns
      platformBreakdown[key].roas = platformBreakdown[key].spend > 0 
        ? platformBreakdown[key].revenue / platformBreakdown[key].spend 
        : 0
    })

    return NextResponse.json({
      kpis,
      chartData,
      topCampaigns,
      platformBreakdown
    })

  } catch (error) {
    console.error('Dashboard analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

