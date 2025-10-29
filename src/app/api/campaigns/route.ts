// src/app/api/campaigns/route.ts
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
    const platform = searchParams.get('platform')
    const accountId = searchParams.get('accountId')

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

    // Build query filters
    const where: {
      companyId: string
      platform?: string
      accountId?: string
    } = {
      companyId: companyId
    }

    if (platform) {
      where.platform = platform
    }

    if (accountId) {
      where.accountId = accountId
    }

    // Fetch campaigns with their latest metrics
    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: {
        createdAt: 'desc'
      },
      include: {
        metrics: {
          orderBy: {
            date: 'desc'
          },
          take: 1 // Get latest metric for each campaign
        }
      }
    })

    // Transform data for frontend
    const transformedCampaigns = campaigns.map(campaign => {
      const latestMetric = campaign.metrics[0]
      
      return {
        id: campaign.id,
        name: campaign.name,
        platform: campaign.platform,
        accountId: campaign.accountId,
        accountName: campaign.accountName,
        status: campaign.status,
        budget: campaign.budget,
        currency: campaign.currency,
        createdAt: campaign.createdAt,
        updatedAt: campaign.updatedAt,
        // Latest metrics
        clicks: latestMetric?.clicks || 0,
        impressions: latestMetric?.impressions || 0,
        cost: latestMetric?.spend || 0, // spend is the field name in schema
        conversions: latestMetric?.conversions || 0,
        revenue: latestMetric?.revenue || 0,
        cpc: latestMetric?.cpc || 0,
        cpm: 0, // Not in schema, calculate if needed
        ctr: latestMetric?.ctr || 0,
        conversionRate: 0, // Not in schema, calculate if needed
        roas: latestMetric?.roas || 0,
        // Date of latest metric
        lastMetricDate: latestMetric?.date
      }
    })

    return NextResponse.json({
      campaigns: transformedCampaigns,
      total: transformedCampaigns.length
    })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}
