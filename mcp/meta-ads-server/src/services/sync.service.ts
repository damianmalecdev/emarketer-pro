import { PrismaClient } from '@prisma/client'
import { MetaAPIService } from './meta-api.service'
import { logger } from '../utils/logger'
import { fetchAllPages } from '../utils/pagination'
import type { SyncOptions } from '../types/mcp.types'

const prisma = new PrismaClient()

export class SyncService {
  /**
   * Sync Meta Ads account data to database
   */
  async syncAccount(options: SyncOptions): Promise<void> {
    const startTime = new Date()
    let syncLogId: string

    try {
      // Get account from database
      const account = await prisma.metaAdsAccount.findUnique({
        where: { id: options.accountId },
      })

      if (!account || !account.accessToken) {
        throw new Error('Account not found or missing access token')
      }

      // Create sync log
      const syncLog = await prisma.metaSyncLog.create({
        data: {
          accountId: options.accountId,
          syncType: options.syncType,
          entityType: options.entityTypes?.join(','),
          status: 'IN_PROGRESS',
          startedAt: startTime,
          triggeredBy: options.triggeredBy,
        },
      })
      syncLogId = syncLog.id

      logger.info('Starting sync', {
        accountId: options.accountId,
        syncType: options.syncType,
        syncLogId,
      })

      // Initialize API client
      const api = new MetaAPIService({
        accessToken: account.accessToken,
        accountId: account.accountId,
      })

      let recordsProcessed = 0
      let recordsCreated = 0
      let recordsUpdated = 0
      let recordsFailed = 0

      // Sync campaigns
      if (!options.entityTypes || options.entityTypes.includes('CAMPAIGNS')) {
        logger.info('Syncing campaigns')
        const campaignsResult = await this.syncCampaigns(account.accountId, api)
        recordsProcessed += campaignsResult.processed
        recordsCreated += campaignsResult.created
        recordsUpdated += campaignsResult.updated
        recordsFailed += campaignsResult.failed
      }

      // Sync ad sets
      if (!options.entityTypes || options.entityTypes.includes('ADSETS')) {
        logger.info('Syncing ad sets')
        const adsetsResult = await this.syncAdSets(account.accountId, api)
        recordsProcessed += adsetsResult.processed
        recordsCreated += adsetsResult.created
        recordsUpdated += adsetsResult.updated
        recordsFailed += adsetsResult.failed
      }

      // Sync ads
      if (!options.entityTypes || options.entityTypes.includes('ADS')) {
        logger.info('Syncing ads')
        const adsResult = await this.syncAds(account.accountId, api)
        recordsProcessed += adsResult.processed
        recordsCreated += adsResult.created
        recordsUpdated += adsResult.updated
        recordsFailed += adsResult.failed
      }

      // Sync metrics
      if (options.syncType === 'METRICS' || options.entityTypes?.includes('METRICS')) {
        logger.info('Syncing metrics')
        if (options.dateRange) {
          const metricsResult = await this.syncMetrics(account.accountId, api, options.dateRange)
          recordsProcessed += metricsResult.processed
          recordsCreated += metricsResult.created
          recordsFailed += metricsResult.failed
        }
      }

      // Update sync log
      const completedAt = new Date()
      await prisma.metaSyncLog.update({
        where: { id: syncLogId },
        data: {
          status: recordsFailed > 0 ? 'PARTIAL_SUCCESS' : 'SUCCESS',
          completedAt,
          duration: completedAt.getTime() - startTime.getTime(),
          recordsProcessed,
          recordsCreated,
          recordsUpdated,
          recordsFailed,
        },
      })

      // Update account last sync time
      await prisma.metaAdsAccount.update({
        where: { id: options.accountId },
        data: { lastSyncAt: new Date() },
      })

      logger.info('Sync completed', {
        accountId: options.accountId,
        syncLogId,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
        recordsFailed,
      })
    } catch (error) {
      logger.error('Sync failed', { error, accountId: options.accountId })

      if (syncLogId!) {
        await prisma.metaSyncLog.update({
          where: { id: syncLogId },
          data: {
            status: 'FAILED',
            completedAt: new Date(),
            duration: Date.now() - startTime.getTime(),
            error: error instanceof Error ? error.message : String(error),
            errorDetails: error,
          },
        })
      }

      throw error
    }
  }

  /**
   * Sync campaigns for an account
   */
  private async syncCampaigns(accountId: string, api: MetaAPIService) {
    let processed = 0, created = 0, updated = 0, failed = 0

    try {
      const campaigns = await fetchAllPages((after) =>
        api.listCampaigns(accountId, { after })
      )

      for (const campaign of campaigns) {
        try {
          await prisma.metaCampaign.upsert({
            where: {
              accountId_campaignId: {
                accountId,
                campaignId: campaign.id,
              },
            },
            create: {
              accountId,
              campaignId: campaign.id,
              name: campaign.name,
              status: campaign.status,
              effectiveStatus: campaign.effective_status as any,
              objective: campaign.objective as any,
              specialAdCategories: campaign.special_ad_categories,
              buyingType: campaign.buying_type as any,
              dailyBudget: campaign.daily_budget ? parseFloat(campaign.daily_budget) : undefined,
              lifetimeBudget: campaign.lifetime_budget ? parseFloat(campaign.lifetime_budget) : undefined,
              budgetRemaining: campaign.budget_remaining ? parseFloat(campaign.budget_remaining) : undefined,
              startTime: campaign.start_time ? new Date(campaign.start_time) : undefined,
              endTime: campaign.stop_time ? new Date(campaign.stop_time) : undefined,
              lastSyncAt: new Date(),
            },
            update: {
              name: campaign.name,
              status: campaign.status,
              effectiveStatus: campaign.effective_status as any,
              objective: campaign.objective as any,
              specialAdCategories: campaign.special_ad_categories,
              buyingType: campaign.buying_type as any,
              dailyBudget: campaign.daily_budget ? parseFloat(campaign.daily_budget) : undefined,
              lifetimeBudget: campaign.lifetime_budget ? parseFloat(campaign.lifetime_budget) : undefined,
              budgetRemaining: campaign.budget_remaining ? parseFloat(campaign.budget_remaining) : undefined,
              startTime: campaign.start_time ? new Date(campaign.start_time) : undefined,
              endTime: campaign.stop_time ? new Date(campaign.stop_time) : undefined,
              lastSyncAt: new Date(),
            },
          })
          processed++
          // Check if it was created or updated
          const existing = await prisma.metaCampaign.findFirst({
            where: { accountId, campaignId: campaign.id },
          })
          if (existing?.createdAt.getTime() === existing?.updatedAt.getTime()) {
            created++
          } else {
            updated++
          }
        } catch (error) {
          failed++
          logger.error('Failed to sync campaign', { campaignId: campaign.id, error })
        }
      }
    } catch (error) {
      logger.error('Failed to fetch campaigns', { error })
      throw error
    }

    return { processed, created, updated, failed }
  }

  /**
   * Sync ad sets for an account
   */
  private async syncAdSets(accountId: string, api: MetaAPIService) {
    let processed = 0, created = 0, updated = 0, failed = 0

    // Get all campaigns first
    const campaigns = await prisma.metaCampaign.findMany({
      where: { accountId },
    })

    for (const campaign of campaigns) {
      try {
        const adsets = await fetchAllPages((after) =>
          api.listAdSets(campaign.campaignId, { after })
        )

        for (const adset of adsets) {
          try {
            await prisma.metaAdSet.upsert({
              where: {
                campaignId_adSetId: {
                  campaignId: campaign.id,
                  adSetId: adset.id,
                },
              },
              create: {
                accountId,
                campaignId: campaign.id,
                adSetId: adset.id,
                name: adset.name,
                status: adset.status,
                effectiveStatus: adset.effective_status as any,
                optimizationGoal: adset.optimization_goal as any,
                billingEvent: adset.billing_event as any,
                bidAmount: adset.bid_amount,
                dailyBudget: adset.daily_budget ? parseFloat(adset.daily_budget) : undefined,
                lifetimeBudget: adset.lifetime_budget ? parseFloat(adset.lifetime_budget) : undefined,
                startTime: adset.start_time ? new Date(adset.start_time) : undefined,
                endTime: adset.end_time ? new Date(adset.end_time) : undefined,
                targeting: adset.targeting,
                attributionSetting: adset.attribution_spec,
                lastSyncAt: new Date(),
              },
              update: {
                name: adset.name,
                status: adset.status,
                effectiveStatus: adset.effective_status as any,
                optimizationGoal: adset.optimization_goal as any,
                billingEvent: adset.billing_event as any,
                bidAmount: adset.bid_amount,
                dailyBudget: adset.daily_budget ? parseFloat(adset.daily_budget) : undefined,
                lifetimeBudget: adset.lifetime_budget ? parseFloat(adset.lifetime_budget) : undefined,
                startTime: adset.start_time ? new Date(adset.start_time) : undefined,
                endTime: adset.end_time ? new Date(adset.end_time) : undefined,
                targeting: adset.targeting,
                attributionSetting: adset.attribution_spec,
                lastSyncAt: new Date(),
              },
            })
            processed++
          } catch (error) {
            failed++
            logger.error('Failed to sync ad set', { adSetId: adset.id, error })
          }
        }
      } catch (error) {
        logger.error('Failed to fetch ad sets for campaign', { campaignId: campaign.campaignId, error })
      }
    }

    created = Math.floor(processed / 2) // Approximation
    updated = processed - created

    return { processed, created, updated, failed }
  }

  /**
   * Sync ads for an account
   */
  private async syncAds(accountId: string, api: MetaAPIService) {
    let processed = 0, created = 0, updated = 0, failed = 0

    // Get all ad sets first
    const adsets = await prisma.metaAdSet.findMany({
      where: { accountId },
    })

    for (const adset of adsets) {
      try {
        const ads = await fetchAllPages((after) =>
          api.listAds(adset.adSetId, { after })
        )

        for (const ad of ads) {
          try {
            await prisma.metaAd.upsert({
              where: {
                adSetId_adId: {
                  adSetId: adset.id,
                  adId: ad.id,
                },
              },
              create: {
                accountId,
                campaignId: adset.campaignId,
                adSetId: adset.id,
                adId: ad.id,
                name: ad.name,
                status: ad.status,
                effectiveStatus: ad.effective_status as any,
                configuredStatus: ad.configured_status as any,
                creativeId: ad.creative?.id,
                trackingSpecs: ad.tracking_specs,
                lastSyncAt: new Date(),
              },
              update: {
                name: ad.name,
                status: ad.status,
                effectiveStatus: ad.effective_status as any,
                configuredStatus: ad.configured_status as any,
                creativeId: ad.creative?.id,
                trackingSpecs: ad.tracking_specs,
                lastSyncAt: new Date(),
              },
            })
            processed++
          } catch (error) {
            failed++
            logger.error('Failed to sync ad', { adId: ad.id, error })
          }
        }
      } catch (error) {
        logger.error('Failed to fetch ads for ad set', { adSetId: adset.adSetId, error })
      }
    }

    created = Math.floor(processed / 2) // Approximation
    updated = processed - created

    return { processed, created, updated, failed }
  }

  /**
   * Sync metrics for an account
   */
  private async syncMetrics(
    accountId: string,
    api: MetaAPIService,
    dateRange: { since: string; until: string }
  ) {
    let processed = 0, created = 0, failed = 0

    // Sync campaign metrics
    const campaigns = await prisma.metaCampaign.findMany({
      where: { accountId },
      select: { id: true, campaignId: true },
    })

    for (const campaign of campaigns) {
      try {
        const insights = await api.getInsights(campaign.campaignId, {
          level: 'campaign',
          time_range: dateRange,
          time_increment: 1, // Daily
        })

        for (const insight of insights.data) {
          try {
            const date = new Date(insight.date_start)
            await prisma.metaCampaignMetricsDaily.upsert({
              where: {
                campaignId_date: {
                  campaignId: campaign.id,
                  date,
                },
              },
              create: {
                accountId,
                campaignId: campaign.id,
                date,
                dayOfWeek: date.getDay(),
                impressions: BigInt(insight.impressions || 0),
                reach: insight.reach ? BigInt(insight.reach) : null,
                frequency: insight.frequency ? parseFloat(insight.frequency) : null,
                clicks: BigInt(insight.clicks || 0),
                spend: parseFloat(insight.spend || '0'),
                ctr: insight.ctr ? parseFloat(insight.ctr) : null,
                cpc: insight.cpc ? parseFloat(insight.cpc) : null,
                cpm: insight.cpm ? parseFloat(insight.cpm) : null,
                actions: insight.actions,
              },
              update: {
                impressions: BigInt(insight.impressions || 0),
                reach: insight.reach ? BigInt(insight.reach) : null,
                frequency: insight.frequency ? parseFloat(insight.frequency) : null,
                clicks: BigInt(insight.clicks || 0),
                spend: parseFloat(insight.spend || '0'),
                ctr: insight.ctr ? parseFloat(insight.ctr) : null,
                cpc: insight.cpc ? parseFloat(insight.cpc) : null,
                cpm: insight.cpm ? parseFloat(insight.cpm) : null,
                actions: insight.actions,
              },
            })
            processed++
            created++
          } catch (error) {
            failed++
            logger.error('Failed to sync campaign metric', { campaignId: campaign.id, error })
          }
        }
      } catch (error) {
        logger.error('Failed to fetch insights for campaign', { campaignId: campaign.campaignId, error })
      }
    }

    return { processed, created, failed }
  }
}

export const syncService = new SyncService()

