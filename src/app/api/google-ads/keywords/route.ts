// API Route: /api/google-ads/keywords
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
    const campaignId = searchParams.get('campaignId')
    const status = searchParams.get('status')
    const matchType = searchParams.get('matchType')

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      )
    }

    if (!adGroupId && !campaignId) {
      return NextResponse.json(
        { error: 'Ad Group ID or Campaign ID is required' },
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
    const where: any = {}

    if (adGroupId) {
      where.adGroupId = adGroupId
    } else if (campaignId) {
      where.campaignId = campaignId
    }

    if (status) {
      where.status = status
    }

    if (matchType) {
      where.matchType = matchType
    }

    // Fetch keywords with related data
    const keywords = await prisma.googleAdsKeyword.findMany({
      where,
      include: {
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
        adGroup: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        text: 'asc',
      },
    })

    // Get latest metrics for each keyword
    const keywordsWithMetrics = await Promise.all(
      keywords.map(async (keyword) => {
        const latestMetrics = await prisma.googleAdsMetricsDaily.findFirst({
          where: {
            entityType: 'KEYWORD',
            keywordId: keyword.id,
          },
          orderBy: {
            date: 'desc',
          },
        })

        return {
          id: keyword.id,
          customerId: keyword.customerId,
          campaignId: keyword.campaignId,
          campaignName: keyword.campaign.name,
          adGroupId: keyword.adGroupId,
          adGroupName: keyword.adGroup.name,
          keywordId: keyword.keywordId,
          text: keyword.text,
          matchType: keyword.matchType,
          status: keyword.status,
          cpcBidMicros: keyword.cpcBidMicros?.toString(),
          qualityScore: keyword.qualityScore,
          landingPageScore: keyword.landingPageScore,
          creativeScore: keyword.creativeScore,
          expectedCtr: keyword.expectedCtr,
          finalUrls: keyword.finalUrls,
          createdAt: keyword.createdAt,
          updatedAt: keyword.updatedAt,
          lastSyncAt: keyword.lastSyncAt,
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
            qualityScore: latestMetrics.qualityScore,
            date: latestMetrics.date,
          } : null,
        }
      })
    )

    return NextResponse.json({
      data: keywordsWithMetrics,
      total: keywordsWithMetrics.length,
    })
  } catch (error) {
    console.error('Error fetching Google Ads keywords:', error)
    return NextResponse.json(
      { error: 'Failed to fetch keywords' },
      { status: 500 }
    )
  }
}





