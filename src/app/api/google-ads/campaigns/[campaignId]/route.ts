// API Route: /api/google-ads/campaigns/[campaignId]
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { validateCompanyAccess } from '@/lib/permissions'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaignId: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { campaignId } = await params
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get('companyId')

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

    // Fetch campaign with detailed information
    const campaign = await prisma.googleAdsCampaign.findFirst({
      where: {
        id: campaignId,
        customer: {
          companyId,
        },
      },
      include: {
        budget: true,
        biddingStrategy: true,
        customer: {
          select: {
            id: true,
            customerId: true,
            name: true,
            currency: true,
            timezone: true,
          },
        },
        adGroups: {
          where: {
            status: { not: 'REMOVED' },
          },
          include: {
            _count: {
              select: {
                ads: true,
                keywords: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        },
        geoTargets: true,
        languageTargets: true,
        deviceTargets: true,
        _count: {
          select: {
            adGroups: true,
            keywords: true,
            negativeKeywords: true,
          },
        },
      },
    })

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found' },
        { status: 404 }
      )
    }

    // Get metrics for last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const metrics = await prisma.googleAdsMetricsDaily.findMany({
      where: {
        entityType: 'CAMPAIGN',
        campaignId: campaign.id,
        date: {
          gte: thirtyDaysAgo,
        },
      },
      orderBy: {
        date: 'asc',
      },
    })

    // Calculate aggregated metrics
    const aggregated = metrics.reduce(
      (acc, metric) => ({
        totalSpend: acc.totalSpend + Number(metric.cost),
        totalImpressions: acc.totalImpressions + Number(metric.impressions),
        totalClicks: acc.totalClicks + Number(metric.clicks),
        totalConversions: acc.totalConversions + Number(metric.conversions),
        totalConversionValue: acc.totalConversionValue + Number(metric.conversionValue),
      }),
      {
        totalSpend: 0,
        totalImpressions: 0,
        totalClicks: 0,
        totalConversions: 0,
        totalConversionValue: 0,
      }
    )

    const ctr = aggregated.totalImpressions > 0 
      ? (aggregated.totalClicks / aggregated.totalImpressions) * 100 
      : 0
    const cpc = aggregated.totalClicks > 0 
      ? aggregated.totalSpend / aggregated.totalClicks 
      : 0
    const conversionRate = aggregated.totalClicks > 0 
      ? (aggregated.totalConversions / aggregated.totalClicks) * 100 
      : 0
    const roas = aggregated.totalSpend > 0 
      ? aggregated.totalConversionValue / aggregated.totalSpend 
      : 0

    return NextResponse.json({
      data: {
        ...campaign,
        metrics: {
          ...aggregated,
          ctr,
          cpc,
          conversionRate,
          roas,
          timeSeries: metrics.map(m => ({
            date: m.date,
            impressions: Number(m.impressions),
            clicks: Number(m.clicks),
            cost: Number(m.cost),
            conversions: Number(m.conversions),
            conversionValue: Number(m.conversionValue),
            ctr: Number(m.ctr),
            cpc: Number(m.cpc),
            cpm: Number(m.cpm),
            conversionRate: Number(m.conversionRate),
            roas: Number(m.roas),
          })),
        },
      },
    })
  } catch (error) {
    console.error('Error fetching Google Ads campaign details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaign details' },
      { status: 500 }
    )
  }
}

