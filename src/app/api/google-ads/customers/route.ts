// API Route: /api/google-ads/customers
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

    // Fetch customers with campaign counts and metrics
    const customers = await prisma.googleAdsCustomer.findMany({
      where: {
        companyId,
        isActive: true,
      },
      include: {
        _count: {
          select: {
            campaigns: true,
          },
        },
        campaigns: {
          where: {
            status: { not: 'REMOVED' },
          },
          select: {
            status: true,
          },
        },
        syncLogs: {
          orderBy: {
            startedAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Transform data with summary metrics
    const customersWithSummary = await Promise.all(
      customers.map(async (customer) => {
        // Get aggregated metrics for last 30 days
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
          }),
          {
            totalSpend: 0,
            totalImpressions: 0,
            totalClicks: 0,
            totalConversions: 0,
          }
        )

        const activeCampaignCount = customer.campaigns.filter(
          (c) => c.status === 'ENABLED'
        ).length

        return {
          id: customer.id,
          customerId: customer.customerId,
          name: customer.name,
          descriptiveName: customer.descriptiveName,
          currency: customer.currency,
          timezone: customer.timezone,
          accountType: customer.accountType,
          status: customer.status,
          isActive: customer.isActive,
          canManageClients: customer.canManageClients,
          testAccount: customer.testAccount,
          lastSyncAt: customer.lastSyncAt,
          createdAt: customer.createdAt,
          updatedAt: customer.updatedAt,
          campaignCount: customer._count.campaigns,
          activeCampaignCount,
          ...aggregated,
          lastSync: customer.syncLogs[0] || null,
        }
      })
    )

    return NextResponse.json({
      data: customersWithSummary,
      total: customersWithSummary.length,
    })
  } catch (error) {
    console.error('Error fetching Google Ads customers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    )
  }
}





