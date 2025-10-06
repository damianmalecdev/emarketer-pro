/**
 * Campaign Data Loader
 * 
 * Handles loading normalized campaign and metrics data into the database.
 */

import { prisma } from '@/lib/prisma'

export interface NormalizedCampaign {
  platformCampaignId: string
  name: string
  platform: string
  status: string
}

export interface NormalizedMetrics {
  date: Date
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  ctr: number
  cpc: number
  roas: number
  cpa: number
}

export interface LoadConfig {
  userId: string
  integrationId: string
}

/**
 * Load a single campaign with its metrics into the database
 */
export async function loadCampaignWithMetrics(
  campaign: NormalizedCampaign,
  metrics: NormalizedMetrics,
  config: LoadConfig
): Promise<{ success: boolean; campaignId?: string; error?: string }> {
  try {
    // Step 1: Upsert Campaign (master data)
    const dbCampaign = await prisma.campaign.upsert({
      where: {
        platform_name_userId: {
          platform: campaign.platform,
          name: campaign.name,
          userId: config.userId,
        },
      },
      update: {
        platformCampaignId: campaign.platformCampaignId,
        status: campaign.status,
        integrationId: config.integrationId,
      },
      create: {
        userId: config.userId,
        integrationId: config.integrationId,
        platform: campaign.platform,
        platformCampaignId: campaign.platformCampaignId,
        name: campaign.name,
        status: campaign.status,
      },
    })

    // Step 2: Normalize date to midnight
    const normalizedDate = new Date(metrics.date)
    normalizedDate.setHours(0, 0, 0, 0)

    // Step 3: Upsert CampaignMetric (daily snapshot)
    await prisma.campaignMetric.upsert({
      where: {
        campaignId_date: {
          campaignId: dbCampaign.id,
          date: normalizedDate,
        },
      },
      update: {
        spend: metrics.spend,
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        conversions: metrics.conversions,
        revenue: metrics.revenue,
        ctr: metrics.ctr,
        cpc: metrics.cpc,
        roas: metrics.roas,
        cpa: metrics.cpa,
      },
      create: {
        campaignId: dbCampaign.id,
        date: normalizedDate,
        spend: metrics.spend,
        impressions: metrics.impressions,
        clicks: metrics.clicks,
        conversions: metrics.conversions,
        revenue: metrics.revenue,
        ctr: metrics.ctr,
        cpc: metrics.cpc,
        roas: metrics.roas,
        cpa: metrics.cpa,
      },
    })

    return {
      success: true,
      campaignId: dbCampaign.id,
    }
  } catch (error) {
    console.error('Campaign loader error:', error)
    return {
      success: false,
      error: String(error),
    }
  }
}

/**
 * Load multiple campaigns in batch
 */
export async function loadCampaignsBatch(
  items: Array<{ campaign: NormalizedCampaign; metrics: NormalizedMetrics }>,
  config: LoadConfig
): Promise<{
  total: number
  success: number
  failed: number
  errors: Array<{ campaign: string; error: string }>
}> {
  const results = {
    total: items.length,
    success: 0,
    failed: 0,
    errors: [] as Array<{ campaign: string; error: string }>,
  }

  for (const item of items) {
    const result = await loadCampaignWithMetrics(
      item.campaign,
      item.metrics,
      config
    )

    if (result.success) {
      results.success++
    } else {
      results.failed++
      results.errors.push({
        campaign: item.campaign.name,
        error: result.error || 'Unknown error',
      })
    }
  }

  return results
}

/**
 * Get the last sync date for a user's platform
 */
export async function getLastSyncDate(
  userId: string,
  platform: string
): Promise<Date | null> {
  const lastMetric = await prisma.campaignMetric.findFirst({
    where: {
      campaign: {
        userId,
        platform,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      createdAt: true,
    },
  })

  return lastMetric?.createdAt || null
}

/**
 * Get campaign count for a user's platform
 */
export async function getCampaignCount(
  userId: string,
  platform: string
): Promise<number> {
  return await prisma.campaign.count({
    where: {
      userId,
      platform,
    },
  })
}

