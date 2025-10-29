// API Route: /api/google-ads/ads
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
    const adGroupId = searchParams.get('adGroupId')
    const status = searchParams.get('status')
    const approvalStatus = searchParams.get('approvalStatus')

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    if (!adGroupId) {
      return NextResponse.json(
        { error: 'Ad Group ID is required' },
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
      adGroupId: string
      status?: string
      approvalStatus?: string
    } = {
      adGroupId,
    }

    if (status) {
      where.status = status
    }

    if (approvalStatus) {
      where.approvalStatus = approvalStatus
    }

    // Fetch ads with related data
    const ads = await prisma.googleAdsAd.findMany({
      where,
      include: {
        adGroup: {
          select: {
            id: true,
            name: true,
            campaign: {
              select: {
                id: true,
                name: true,
                customer: {
                  select: {
                    currency: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    })

    // Get latest metrics for each ad
    const adsWithMetrics = await Promise.all(
      ads.map(async (ad) => {
        const latestMetrics = await prisma.googleAdsMetricsDaily.findFirst({
          where: {
            entityType: 'AD',
            adId: ad.id,
          },
          orderBy: {
            date: 'desc',
          },
        })

        return {
          id: ad.id,
          customerId: ad.customerId,
          campaignId: ad.campaignId,
          adGroupId: ad.adGroupId,
          adGroupName: ad.adGroup.name,
          campaignName: ad.adGroup.campaign.name,
          adId: ad.adId,
          name: ad.name,
          type: ad.type,
          status: ad.status,
          approvalStatus: ad.approvalStatus,
          policyReviewStatus: ad.policyReviewStatus,
          headlines: ad.headlines,
          descriptions: ad.descriptions,
          displayUrl: ad.displayUrl,
          finalUrls: ad.finalUrls,
          finalMobileUrls: ad.finalMobileUrls,
          path1: ad.path1,
          path2: ad.path2,
          rsaStrength: ad.rsaStrength,
          videoId: ad.videoId,
          imageAssetId: ad.imageAssetId,
          createdAt: ad.createdAt,
          updatedAt: ad.updatedAt,
          lastSyncAt: ad.lastSyncAt,
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
      data: adsWithMetrics,
      total: adsWithMetrics.length,
    })
  } catch (error) {
    console.error('Error fetching Google Ads ads:', error)
    return NextResponse.json(
      { error: 'Failed to fetch ads' },
      { status: 500 }
    )
  }
}

