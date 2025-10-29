// API Route: /api/google-ads/campaigns
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
    const customerId = searchParams.get('customerId')
    const status = searchParams.get('status')
    const type = searchParams.get('type')

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

    // Build where clause
    const where: any = {
      customer: {
        companyId,
      },
    }

    if (customerId) {
      where.customerId = customerId
    }

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    // Fetch campaigns with related data
    const campaigns = await prisma.googleAdsCampaign.findMany({
      where,
      include: {
        budget: true,
        biddingStrategy: true,
        customer: {
          select: {
            id: true,
            customerId: true,
            name: true,
            currency: true,
          },
        },
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
    })

    // Get latest metrics for each campaign
    const campaignsWithMetrics = await Promise.all(
      campaigns.map(async (campaign) => {
        const latestMetrics = await prisma.googleAdsMetricsDaily.findFirst({
          where: {
            entityType: 'CAMPAIGN',
            campaignId: campaign.id,
          },
          orderBy: {
            date: 'desc',
          },
        })

        return {
          id: campaign.id,
          customerId: campaign.customerId,
          customerName: campaign.customer.name,
          campaignId: campaign.campaignId,
          name: campaign.name,
          type: campaign.type,
          status: campaign.status,
          budgetId: campaign.budgetId,
          budget: campaign.budget,
          biddingStrategyType: campaign.biddingStrategyType,
          biddingStrategy: campaign.biddingStrategy,
          targetCpa: campaign.targetCpa,
          targetRoas: campaign.targetRoas,
          startDate: campaign.startDate,
          endDate: campaign.endDate,
          advertisingChannelType: campaign.advertisingChannelType,
          adGroupCount: campaign._count.adGroups,
          keywordCount: campaign._count.keywords,
          createdAt: campaign.createdAt,
          updatedAt: campaign.updatedAt,
          lastSyncAt: campaign.lastSyncAt,
          metrics: latestMetrics ? {
            impressions: Number(latestMetrics.impressions),
            clicks: Number(latestMetrics.clicks),
            cost: Number(latestMetrics.cost),
            conversions: Number(latestMetrics.conversions),
            conversionValue: Number(latestMetrics.conversionValue),
            ctr: Number(latestMetrics.ctr),
            cpc: Number(latestMetrics.cpc),
            cpm: Number(latestMetrics.cpm),
            conversionRate: Number(latestMetrics.conversionRate),
            roas: Number(latestMetrics.roas),
            date: latestMetrics.date,
          } : null,
        }
      })
    )

    return NextResponse.json({
      data: campaignsWithMetrics,
      total: campaignsWithMetrics.length,
    })
  } catch (error) {
    console.error('Error fetching Google Ads campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}





