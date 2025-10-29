// API Route: /api/google-ads/customers/[customerId]
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { validateCompanyAccess } from '@/lib/permissions'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ customerId: string }> }
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

    const { customerId } = await params
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

    // Fetch customer with detailed information
    const customer = await prisma.googleAdsCustomer.findFirst({
      where: {
        id: customerId,
        companyId,
      },
      include: {
        campaigns: {
          where: {
            status: { not: 'REMOVED' },
          },
          include: {
            budget: true,
            _count: {
              select: {
                adGroups: true,
                keywords: true,
              },
            },
          },
          orderBy: {
            updatedAt: 'desc',
          },
          take: 10,
        },
        budgets: {
          where: {
            status: { not: 'REMOVED' },
          },
          take: 10,
        },
        biddingStrategies: {
          where: {
            status: { not: 'REMOVED' },
          },
          take: 10,
        },
        syncLogs: {
          orderBy: {
            startedAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            campaigns: true,
            budgets: true,
            biddingStrategies: true,
          },
        },
      },
    })

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      )
    }

    // Get summary metrics for last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const metrics = await prisma.googleAdsMetricsDaily.findMany({
      where: {
        customerId: customer.id,
        entityType: 'CAMPAIGN',
        date: {
          gte: thirtyDaysAgo,
        },
      },
    })

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

    // Calculate derived metrics
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
        ...customer,
        metrics: {
          ...aggregated,
          ctr,
          cpc,
          conversionRate,
          roas,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching Google Ads customer details:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customer details' },
      { status: 500 }
    )
  }
}

