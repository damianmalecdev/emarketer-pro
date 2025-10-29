// src/app/api/metrics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { validateCompanyAccess } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get('companyId')
    const campaignId = searchParams.get('campaignId')
    const platform = searchParams.get('platform')
    const since = searchParams.get('since') // ISO date string
    const until = searchParams.get('until') // ISO date string
    const granularity = searchParams.get('granularity') || 'daily' // daily, weekly, monthly

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    // Validate user has access to this company
    const hasAccess = await validateCompanyAccess(user.id, companyId)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      )
    }

    // Build date filters
    const dateFilter: any = {}
    if (since) {
      dateFilter.gte = new Date(since)
    }
    if (until) {
      dateFilter.lte = new Date(until)
    }

    // Build query filters
    const where: any = {
      campaign: {
        companyId: companyId
      }
    }

    if (campaignId) {
      where.campaignId = campaignId
    }

    if (platform) {
      where.campaign = {
        ...where.campaign,
        platform: platform
      }
    }

    if (Object.keys(dateFilter).length > 0) {
      where.date = dateFilter
    }

    // Fetch metrics
    const metrics = await prisma.campaignMetric.findMany({
      where,
      orderBy: {
        date: 'asc'
      },
      include: {
        campaign: {
          select: {
            id: true,
            name: true,
            platform: true,
            platformCampaignId: true
          }
        }
      }
    })

    // Aggregate metrics by granularity if needed
    let aggregatedMetrics = metrics

    if (granularity === 'weekly') {
      aggregatedMetrics = aggregateMetricsByWeek(metrics)
    } else if (granularity === 'monthly') {
      aggregatedMetrics = aggregateMetricsByMonth(metrics)
    }

    // Transform data for frontend
    const transformedMetrics = aggregatedMetrics.map(metric => ({
      id: metric.id,
      campaignId: metric.campaignId,
      campaignName: metric.campaign.name,
      platform: metric.campaign.platform,
      accountName: metric.campaign.platformCampaignId,
      date: metric.date,
      clicks: metric.clicks,
      impressions: metric.impressions,
      cost: metric.spend, // spend is the field name in schema
      conversions: metric.conversions,
      revenue: metric.revenue,
      cpc: metric.cpc,
      cpm: metric.impressions > 0 ? (metric.spend / metric.impressions) * 1000 : 0, // Calculate CPM
      ctr: metric.ctr,
      conversionRate: metric.clicks > 0 ? (metric.conversions / metric.clicks) * 100 : 0, // Calculate conversion rate
      roas: metric.roas
    }))

    return NextResponse.json({
      metrics: transformedMetrics,
      total: transformedMetrics.length,
      granularity,
      dateRange: {
        since: since || null,
        until: until || null
      }
    })
  } catch (error) {
    console.error('Error fetching metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}

// Helper function to aggregate metrics by week
function aggregateMetricsByWeek(metrics: any[]) {
  const weeklyMap = new Map<string, any>()

  metrics.forEach(metric => {
    const date = new Date(metric.date)
    const weekStart = new Date(date)
    weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0)
    
    const weekKey = weekStart.toISOString().split('T')[0]

    if (!weeklyMap.has(weekKey)) {
      weeklyMap.set(weekKey, {
        ...metric,
        date: weekStart,
        clicks: 0,
        impressions: 0,
        spend: 0, // Use spend instead of cost
        conversions: 0,
        revenue: 0
      })
    }

    const weekMetric = weeklyMap.get(weekKey)
    weekMetric.clicks += metric.clicks
    weekMetric.impressions += metric.impressions
    weekMetric.spend += metric.spend // Use spend instead of cost
    weekMetric.conversions += metric.conversions
    weekMetric.revenue += metric.revenue
  })

  return Array.from(weeklyMap.values()).map(metric => ({
    ...metric,
    cpc: metric.clicks > 0 ? metric.spend / metric.clicks : 0,
    cpm: metric.impressions > 0 ? (metric.spend / metric.impressions) * 1000 : 0,
    ctr: metric.impressions > 0 ? (metric.clicks / metric.impressions) * 100 : 0,
    conversionRate: metric.clicks > 0 ? (metric.conversions / metric.clicks) * 100 : 0,
    roas: metric.spend > 0 ? metric.revenue / metric.spend : 0
  }))
}

// Helper function to aggregate metrics by month
function aggregateMetricsByMonth(metrics: any[]) {
  const monthlyMap = new Map<string, any>()

  metrics.forEach(metric => {
    const date = new Date(metric.date)
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1)
    
    const monthKey = monthStart.toISOString().split('T')[0]

    if (!monthlyMap.has(monthKey)) {
      monthlyMap.set(monthKey, {
        ...metric,
        date: monthStart,
        clicks: 0,
        impressions: 0,
        spend: 0, // Use spend instead of cost
        conversions: 0,
        revenue: 0
      })
    }

    const monthMetric = monthlyMap.get(monthKey)
    monthMetric.clicks += metric.clicks
    monthMetric.impressions += metric.impressions
    monthMetric.spend += metric.spend // Use spend instead of cost
    monthMetric.conversions += metric.conversions
    monthMetric.revenue += metric.revenue
  })

  return Array.from(monthlyMap.values()).map(metric => ({
    ...metric,
    cpc: metric.clicks > 0 ? metric.spend / metric.clicks : 0,
    cpm: metric.impressions > 0 ? (metric.spend / metric.impressions) * 1000 : 0,
    ctr: metric.impressions > 0 ? (metric.clicks / metric.impressions) * 100 : 0,
    conversionRate: metric.clicks > 0 ? (metric.conversions / metric.clicks) * 100 : 0,
    roas: metric.spend > 0 ? metric.revenue / metric.spend : 0
  }))
}
