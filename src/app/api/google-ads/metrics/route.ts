// API Route: /api/google-ads/metrics
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
    const entityType = searchParams.get('entityType') || 'CAMPAIGN'
    const entityId = searchParams.get('entityId')
    const customerId = searchParams.get('customerId')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const granularity = searchParams.get('granularity') || 'daily'

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

    // Set default date range if not provided (last 30 days)
    const end = endDate ? new Date(endDate) : new Date()
    const start = startDate 
      ? new Date(startDate) 
      : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Build where clause
    const where: any = {
      entityType,
      date: {
        gte: start,
        lte: end,
      },
    }

    if (customerId) {
      where.customerId = customerId
    }

    // Add entity-specific filters
    if (entityId) {
      switch (entityType) {
        case 'CAMPAIGN':
          where.campaignId = entityId
          break
        case 'AD_GROUP':
          where.adGroupId = entityId
          break
        case 'AD':
          where.adId = entityId
          break
        case 'KEYWORD':
          where.keywordId = entityId
          break
      }
    }

    // Fetch metrics based on granularity
    let metrics: any[] = []

    if (granularity === 'hourly') {
      metrics = await prisma.googleAdsMetricsHourly.findMany({
        where: {
          ...where,
          timestamp: where.date,
        },
        orderBy: {
          timestamp: 'asc',
        },
      })
    } else if (granularity === 'monthly') {
      const startYear = start.getFullYear()
      const startMonth = start.getMonth() + 1
      const endYear = end.getFullYear()
      const endMonth = end.getMonth() + 1

      metrics = await prisma.googleAdsMetricsMonthly.findMany({
        where: {
          entityType,
          ...(customerId && { customerId }),
          ...(entityId && entityType === 'CAMPAIGN' && { campaignId: entityId }),
          ...(entityId && entityType === 'AD_GROUP' && { adGroupId: entityId }),
          ...(entityId && entityType === 'AD' && { adId: entityId }),
          ...(entityId && entityType === 'KEYWORD' && { keywordId: entityId }),
          year: {
            gte: startYear,
            lte: endYear,
          },
        },
        orderBy: [
          { year: 'asc' },
          { month: 'asc' },
        ],
      })
    } else {
      // Default: daily
      metrics = await prisma.googleAdsMetrics.findMany({
        where,
        orderBy: {
          date: 'asc',
        },
      })
    }

    // Transform metrics
    const transformedMetrics = metrics.map(m => ({
      date: granularity === 'hourly' ? (m as any).timestamp : 
            granularity === 'monthly' ? new Date(m.year, m.month - 1, 1) : 
            m.date,
      impressions: Number(m.impressions),
      clicks: Number(m.clicks),
      cost: Number(m.cost),
      conversions: Number(m.conversions),
      conversionValue: Number(m.conversionValue),
      ctr: Number(m.ctr || 0),
      cpc: Number(m.cpc || 0),
      cpm: Number(m.cpm || 0),
      conversionRate: Number(m.conversionRate || 0),
      roas: Number(m.roas || 0),
      ...(m.qualityScore && { qualityScore: m.qualityScore }),
    }))

    // Calculate aggregated metrics
    const aggregated = transformedMetrics.reduce(
      (acc, metric) => ({
        totalSpend: acc.totalSpend + metric.cost,
        totalImpressions: acc.totalImpressions + metric.impressions,
        totalClicks: acc.totalClicks + metric.clicks,
        totalConversions: acc.totalConversions + metric.conversions,
        totalRevenue: acc.totalRevenue + metric.conversionValue,
      }),
      {
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalRevenue: 0,
      }
    )

    const avgCpc = aggregated.totalClicks > 0 
      ? aggregated.totalSpend / aggregated.totalClicks 
      : 0
    const avgCpm = aggregated.totalImpressions > 0 
      ? (aggregated.totalSpend / aggregated.totalImpressions) * 1000 
      : 0
    const avgCtr = aggregated.totalImpressions > 0 
      ? (aggregated.totalClicks / aggregated.totalImpressions) * 100 
      : 0
    const avgConversionRate = aggregated.totalClicks > 0 
      ? (aggregated.totalConversions / aggregated.totalClicks) * 100 
      : 0
    const avgRoas = aggregated.totalSpend > 0 
      ? aggregated.totalRevenue / aggregated.totalSpend 
      : 0

    return NextResponse.json({
      metrics: transformedMetrics,
      aggregated: {
        ...aggregated,
        avgCpc,
        avgCpm,
        avgCtr,
        avgConversionRate,
        avgRoas,
      },
      entityType,
      entityId,
      dateRange: {
        startDate: start,
        endDate: end,
      },
      granularity,
    })
  } catch (error) {
    console.error('Error fetching Google Ads metrics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    )
  }
}





