// API Route: /api/google-ads/adgroups
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
    const status = searchParams.get('status')

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID is required' },
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
    const where: {
      campaignId: string
      status?: string
    } = {
      campaignId,
    }

    if (status) {
      where.status = status
    }

    // Fetch ad groups with related data
    const adGroups = await prisma.googleAdsAdGroup.findMany({
      where,
      include: {
        campaign: {
          select: {
            id: true,
            campaignId: true,
            name: true,
            customer: {
              select: {
                currency: true,
              },
            },
          },
        },
        _count: {
          select: {
            ads: true,
            keywords: true,
            negativeKeywords: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    })

    // Get latest metrics for each ad group
    const adGroupsWithMetrics = await Promise.all(
      adGroups.map(async (adGroup) => {
        const latestMetrics = await prisma.googleAdsMetricsDaily.findFirst({
          where: {
            entityType: 'AD_GROUP',
            adGroupId: adGroup.id,
          },
          orderBy: {
            date: 'desc',
          },
        })

        return {
          id: adGroup.id,
          customerId: adGroup.customerId,
          campaignId: adGroup.campaignId,
          campaignName: adGroup.campaign.name,
          adGroupId: adGroup.adGroupId,
          name: adGroup.name,
          type: adGroup.type,
          status: adGroup.status,
          cpcBidMicros: adGroup.cpcBidMicros?.toString(),
          cpmBidMicros: adGroup.cpmBidMicros?.toString(),
          cpvBidMicros: adGroup.cpvBidMicros?.toString(),
          targetCpa: adGroup.targetCpa,
          adCount: adGroup._count.ads,
          keywordCount: adGroup._count.keywords,
          negativeKeywordCount: adGroup._count.negativeKeywords,
          createdAt: adGroup.createdAt,
          updatedAt: adGroup.updatedAt,
          lastSyncAt: adGroup.lastSyncAt,
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
      data: adGroupsWithMetrics,
      total: adGroupsWithMetrics.length,
    })
  } catch (error) {
    console.error('Error fetching Google Ads ad groups:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ad groups' },
      { status: 500 }
    )
  }
}

