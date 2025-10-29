import { PrismaClient, Prisma } from '@prisma/client'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

export class MetricsAggregationService {
  /**
   * Aggregate hourly metrics to daily
   * Run this hourly to aggregate the previous hour
   */
  async aggregateHourlyToDaily(date: Date): Promise<void> {
    logger.info('Starting hourly to daily aggregation', { date })

    try {
      // Aggregate campaign metrics
      await this.aggregateCampaignMetricsToDaily(date)
      
      // Aggregate ad set metrics
      await this.aggregateAdSetMetricsToDaily(date)
      
      // Aggregate ad metrics
      await this.aggregateAdMetricsToDaily(date)

      logger.info('Hourly to daily aggregation completed', { date })
    } catch (error) {
      logger.error('Hourly to daily aggregation failed', { date, error })
      throw error
    }
  }

  /**
   * Aggregate daily metrics to monthly
   * Run this daily to aggregate the previous day
   */
  async aggregateDailyToMonthly(year: number, month: number): Promise<void> {
    logger.info('Starting daily to monthly aggregation', { year, month })

    try {
      // Aggregate campaign metrics
      await this.aggregateCampaignMetricsToMonthly(year, month)
      
      // Aggregate ad set metrics
      await this.aggregateAdSetMetricsToMonthly(year, month)
      
      // Aggregate ad metrics
      await this.aggregateAdMetricsToMonthly(year, month)

      logger.info('Daily to monthly aggregation completed', { year, month })
    } catch (error) {
      logger.error('Daily to monthly aggregation failed', { year, month, error })
      throw error
    }
  }

  /**
   * Aggregate campaign hourly metrics to daily
   */
  private async aggregateCampaignMetricsToDaily(date: Date): Promise<void> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Get all campaigns that have hourly metrics for this day
    const hourlyMetrics = await prisma.metaCampaignMetricsHourly.groupBy({
      by: ['accountId', 'campaignId'],
      where: {
        date: startOfDay,
      },
    })

    for (const group of hourlyMetrics) {
      try {
        // Aggregate hourly data
        const aggregated = await prisma.metaCampaignMetricsHourly.aggregate({
          where: {
            accountId: group.accountId,
            campaignId: group.campaignId,
            date: startOfDay,
          },
          _sum: {
            impressions: true,
            reach: true,
            clicks: true,
            uniqueClicks: true,
            spend: true,
            conversions: true,
            conversionValues: true,
            inlineLinkClicks: true,
            outboundClicks: true,
            uniqueOutboundClicks: true,
            videoPlayActions: true,
            videoP25Watched: true,
            videoP50Watched: true,
            videoP75Watched: true,
            videoP95Watched: true,
            videoP100Watched: true,
          },
          _avg: {
            frequency: true,
            ctr: true,
            uniqueCtr: true,
            cpc: true,
            cpm: true,
            cpp: true,
            costPerConversion: true,
            websiteCtr: true,
            inlineLinkClickCtr: true,
            costPerInlineLinkClick: true,
            costPerOutboundClick: true,
            purchaseRoas: true,
            videoAvgTimeWatched: true,
          },
        })

        // Upsert daily metrics
        await prisma.metaCampaignMetricsDaily.upsert({
          where: {
            campaignId_date: {
              campaignId: group.campaignId,
              date: startOfDay,
            },
          },
          create: {
            accountId: group.accountId,
            campaignId: group.campaignId,
            date: startOfDay,
            dayOfWeek: startOfDay.getDay(),
            impressions: aggregated._sum.impressions || BigInt(0),
            reach: aggregated._sum.reach,
            frequency: aggregated._avg.frequency || undefined,
            clicks: aggregated._sum.clicks || BigInt(0),
            uniqueClicks: aggregated._sum.uniqueClicks,
            spend: aggregated._sum.spend || 0,
            ctr: aggregated._avg.ctr || undefined,
            uniqueCtr: aggregated._avg.uniqueCtr || undefined,
            cpc: aggregated._avg.cpc || undefined,
            cpm: aggregated._avg.cpm || undefined,
            cpp: aggregated._avg.cpp || undefined,
            conversions: aggregated._sum.conversions || undefined,
            conversionValues: aggregated._sum.conversionValues || undefined,
            costPerConversion: aggregated._avg.costPerConversion || undefined,
            websiteCtr: aggregated._avg.websiteCtr || undefined,
            inlineLinkClicks: aggregated._sum.inlineLinkClicks,
            inlineLinkClickCtr: aggregated._avg.inlineLinkClickCtr || undefined,
            costPerInlineLinkClick: aggregated._avg.costPerInlineLinkClick || undefined,
            outboundClicks: aggregated._sum.outboundClicks,
            uniqueOutboundClicks: aggregated._sum.uniqueOutboundClicks,
            costPerOutboundClick: aggregated._avg.costPerOutboundClick || undefined,
            purchaseRoas: aggregated._avg.purchaseRoas || undefined,
            videoPlayActions: aggregated._sum.videoPlayActions,
            videoAvgTimeWatched: aggregated._avg.videoAvgTimeWatched || undefined,
            videoP25Watched: aggregated._sum.videoP25Watched,
            videoP50Watched: aggregated._sum.videoP50Watched,
            videoP75Watched: aggregated._sum.videoP75Watched,
            videoP95Watched: aggregated._sum.videoP95Watched,
            videoP100Watched: aggregated._sum.videoP100Watched,
          },
          update: {
            impressions: aggregated._sum.impressions || BigInt(0),
            reach: aggregated._sum.reach,
            frequency: aggregated._avg.frequency || undefined,
            clicks: aggregated._sum.clicks || BigInt(0),
            uniqueClicks: aggregated._sum.uniqueClicks,
            spend: aggregated._sum.spend || 0,
            ctr: aggregated._avg.ctr || undefined,
            uniqueCtr: aggregated._avg.uniqueCtr || undefined,
            cpc: aggregated._avg.cpc || undefined,
            cpm: aggregated._avg.cpm || undefined,
            cpp: aggregated._avg.cpp || undefined,
            conversions: aggregated._sum.conversions || undefined,
            conversionValues: aggregated._sum.conversionValues || undefined,
            costPerConversion: aggregated._avg.costPerConversion || undefined,
            websiteCtr: aggregated._avg.websiteCtr || undefined,
            inlineLinkClicks: aggregated._sum.inlineLinkClicks,
            inlineLinkClickCtr: aggregated._avg.inlineLinkClickCtr || undefined,
            costPerInlineLinkClick: aggregated._avg.costPerInlineLinkClick || undefined,
            outboundClicks: aggregated._sum.outboundClicks,
            uniqueOutboundClicks: aggregated._sum.uniqueOutboundClicks,
            costPerOutboundClick: aggregated._avg.costPerOutboundClick || undefined,
            purchaseRoas: aggregated._avg.purchaseRoas || undefined,
            videoPlayActions: aggregated._sum.videoPlayActions,
            videoAvgTimeWatched: aggregated._avg.videoAvgTimeWatched || undefined,
            videoP25Watched: aggregated._sum.videoP25Watched,
            videoP50Watched: aggregated._sum.videoP50Watched,
            videoP75Watched: aggregated._sum.videoP75Watched,
            videoP95Watched: aggregated._sum.videoP95Watched,
            videoP100Watched: aggregated._sum.videoP100Watched,
          },
        })

        logger.debug('Aggregated campaign metrics to daily', {
          campaignId: group.campaignId,
          date: startOfDay,
        })
      } catch (error) {
        logger.error('Failed to aggregate campaign metrics to daily', {
          campaignId: group.campaignId,
          date: startOfDay,
          error,
        })
      }
    }
  }

  /**
   * Aggregate ad set hourly metrics to daily
   */
  private async aggregateAdSetMetricsToDaily(date: Date): Promise<void> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const hourlyMetrics = await prisma.metaAdSetMetricsHourly.groupBy({
      by: ['accountId', 'campaignId', 'adSetId'],
      where: {
        date: startOfDay,
      },
    })

    for (const group of hourlyMetrics) {
      try {
        const aggregated = await prisma.metaAdSetMetricsHourly.aggregate({
          where: {
            accountId: group.accountId,
            campaignId: group.campaignId,
            adSetId: group.adSetId,
            date: startOfDay,
          },
          _sum: {
            impressions: true,
            reach: true,
            clicks: true,
            uniqueClicks: true,
            spend: true,
            conversions: true,
            conversionValues: true,
            inlineLinkClicks: true,
          },
          _avg: {
            frequency: true,
            ctr: true,
            uniqueCtr: true,
            cpc: true,
            cpm: true,
            cpp: true,
            costPerConversion: true,
            websiteCtr: true,
            inlineLinkClickCtr: true,
            costPerInlineLinkClick: true,
            purchaseRoas: true,
          },
        })

        await prisma.metaAdSetMetricsDaily.upsert({
          where: {
            adSetId_date: {
              adSetId: group.adSetId,
              date: startOfDay,
            },
          },
          create: {
            accountId: group.accountId,
            campaignId: group.campaignId,
            adSetId: group.adSetId,
            date: startOfDay,
            dayOfWeek: startOfDay.getDay(),
            impressions: aggregated._sum.impressions || BigInt(0),
            reach: aggregated._sum.reach,
            frequency: aggregated._avg.frequency || undefined,
            clicks: aggregated._sum.clicks || BigInt(0),
            uniqueClicks: aggregated._sum.uniqueClicks,
            spend: aggregated._sum.spend || 0,
            ctr: aggregated._avg.ctr || undefined,
            cpc: aggregated._avg.cpc || undefined,
            cpm: aggregated._avg.cpm || undefined,
            conversions: aggregated._sum.conversions || undefined,
            conversionValues: aggregated._sum.conversionValues || undefined,
            costPerConversion: aggregated._avg.costPerConversion || undefined,
            inlineLinkClicks: aggregated._sum.inlineLinkClicks,
            purchaseRoas: aggregated._avg.purchaseRoas || undefined,
          },
          update: {
            impressions: aggregated._sum.impressions || BigInt(0),
            reach: aggregated._sum.reach,
            frequency: aggregated._avg.frequency || undefined,
            clicks: aggregated._sum.clicks || BigInt(0),
            uniqueClicks: aggregated._sum.uniqueClicks,
            spend: aggregated._sum.spend || 0,
            ctr: aggregated._avg.ctr || undefined,
            cpc: aggregated._avg.cpc || undefined,
            cpm: aggregated._avg.cpm || undefined,
            conversions: aggregated._sum.conversions || undefined,
            conversionValues: aggregated._sum.conversionValues || undefined,
            costPerConversion: aggregated._avg.costPerConversion || undefined,
            inlineLinkClicks: aggregated._sum.inlineLinkClicks,
            purchaseRoas: aggregated._avg.purchaseRoas || undefined,
          },
        })
      } catch (error) {
        logger.error('Failed to aggregate ad set metrics to daily', {
          adSetId: group.adSetId,
          date: startOfDay,
          error,
        })
      }
    }
  }

  /**
   * Aggregate ad hourly metrics to daily
   */
  private async aggregateAdMetricsToDaily(date: Date): Promise<void> {
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)

    const hourlyMetrics = await prisma.metaAdMetricsHourly.groupBy({
      by: ['accountId', 'campaignId', 'adSetId', 'adId'],
      where: {
        date: startOfDay,
      },
    })

    for (const group of hourlyMetrics) {
      try {
        const aggregated = await prisma.metaAdMetricsHourly.aggregate({
          where: {
            accountId: group.accountId,
            campaignId: group.campaignId,
            adSetId: group.adSetId,
            adId: group.adId,
            date: startOfDay,
          },
          _sum: {
            impressions: true,
            reach: true,
            clicks: true,
            uniqueClicks: true,
            spend: true,
            conversions: true,
            conversionValues: true,
            inlineLinkClicks: true,
          },
          _avg: {
            frequency: true,
            ctr: true,
            uniqueCtr: true,
            cpc: true,
            cpm: true,
            costPerConversion: true,
            costPerInlineLinkClick: true,
            purchaseRoas: true,
          },
        })

        await prisma.metaAdMetricsDaily.upsert({
          where: {
            adId_date: {
              adId: group.adId,
              date: startOfDay,
            },
          },
          create: {
            accountId: group.accountId,
            campaignId: group.campaignId,
            adSetId: group.adSetId,
            adId: group.adId,
            date: startOfDay,
            dayOfWeek: startOfDay.getDay(),
            impressions: aggregated._sum.impressions || BigInt(0),
            reach: aggregated._sum.reach,
            frequency: aggregated._avg.frequency || undefined,
            clicks: aggregated._sum.clicks || BigInt(0),
            uniqueClicks: aggregated._sum.uniqueClicks,
            spend: aggregated._sum.spend || 0,
            ctr: aggregated._avg.ctr || undefined,
            cpc: aggregated._avg.cpc || undefined,
            cpm: aggregated._avg.cpm || undefined,
            conversions: aggregated._sum.conversions || undefined,
            conversionValues: aggregated._sum.conversionValues || undefined,
            costPerConversion: aggregated._avg.costPerConversion || undefined,
            inlineLinkClicks: aggregated._sum.inlineLinkClicks,
            costPerInlineLinkClick: aggregated._avg.costPerInlineLinkClick || undefined,
            purchaseRoas: aggregated._avg.purchaseRoas || undefined,
          },
          update: {
            impressions: aggregated._sum.impressions || BigInt(0),
            reach: aggregated._sum.reach,
            frequency: aggregated._avg.frequency || undefined,
            clicks: aggregated._sum.clicks || BigInt(0),
            uniqueClicks: aggregated._sum.uniqueClicks,
            spend: aggregated._sum.spend || 0,
            ctr: aggregated._avg.ctr || undefined,
            cpc: aggregated._avg.cpc || undefined,
            cpm: aggregated._avg.cpm || undefined,
            conversions: aggregated._sum.conversions || undefined,
            conversionValues: aggregated._sum.conversionValues || undefined,
            costPerConversion: aggregated._avg.costPerConversion || undefined,
            inlineLinkClicks: aggregated._sum.inlineLinkClicks,
            costPerInlineLinkClick: aggregated._avg.costPerInlineLinkClick || undefined,
            purchaseRoas: aggregated._avg.purchaseRoas || undefined,
          },
        })
      } catch (error) {
        logger.error('Failed to aggregate ad metrics to daily', {
          adId: group.adId,
          date: startOfDay,
          error,
        })
      }
    }
  }

  /**
   * Aggregate campaign daily metrics to monthly
   */
  private async aggregateCampaignMetricsToMonthly(year: number, month: number): Promise<void> {
    const firstDay = new Date(year, month - 1, 1)
    const lastDay = new Date(year, month, 0)

    const dailyMetrics = await prisma.metaCampaignMetricsDaily.groupBy({
      by: ['accountId', 'campaignId'],
      where: {
        date: {
          gte: firstDay,
          lte: lastDay,
        },
      },
    })

    for (const group of dailyMetrics) {
      try {
        const aggregated = await prisma.metaCampaignMetricsDaily.aggregate({
          where: {
            accountId: group.accountId,
            campaignId: group.campaignId,
            date: {
              gte: firstDay,
              lte: lastDay,
            },
          },
          _sum: {
            impressions: true,
            reach: true,
            clicks: true,
            uniqueClicks: true,
            spend: true,
            conversions: true,
            conversionValues: true,
            inlineLinkClicks: true,
            outboundClicks: true,
            uniqueOutboundClicks: true,
            videoPlayActions: true,
          },
          _avg: {
            frequency: true,
            ctr: true,
            cpc: true,
            cpm: true,
            costPerConversion: true,
            purchaseRoas: true,
            videoAvgTimeWatched: true,
          },
        })

        await prisma.metaCampaignMetricsMonthly.upsert({
          where: {
            campaignId_year_month: {
              campaignId: group.campaignId,
              year,
              month,
            },
          },
          create: {
            accountId: group.accountId,
            campaignId: group.campaignId,
            year,
            month,
            firstDayOfMonth: firstDay,
            impressions: aggregated._sum.impressions || BigInt(0),
            reach: aggregated._sum.reach,
            frequency: aggregated._avg.frequency || undefined,
            clicks: aggregated._sum.clicks || BigInt(0),
            uniqueClicks: aggregated._sum.uniqueClicks,
            spend: aggregated._sum.spend || 0,
            ctr: aggregated._avg.ctr || undefined,
            cpc: aggregated._avg.cpc || undefined,
            cpm: aggregated._avg.cpm || undefined,
            conversions: aggregated._sum.conversions || undefined,
            conversionValues: aggregated._sum.conversionValues || undefined,
            costPerConversion: aggregated._avg.costPerConversion || undefined,
            inlineLinkClicks: aggregated._sum.inlineLinkClicks,
            outboundClicks: aggregated._sum.outboundClicks,
            uniqueOutboundClicks: aggregated._sum.uniqueOutboundClicks,
            purchaseRoas: aggregated._avg.purchaseRoas || undefined,
            videoPlayActions: aggregated._sum.videoPlayActions,
            videoAvgTimeWatched: aggregated._avg.videoAvgTimeWatched || undefined,
          },
          update: {
            impressions: aggregated._sum.impressions || BigInt(0),
            reach: aggregated._sum.reach,
            frequency: aggregated._avg.frequency || undefined,
            clicks: aggregated._sum.clicks || BigInt(0),
            uniqueClicks: aggregated._sum.uniqueClicks,
            spend: aggregated._sum.spend || 0,
            ctr: aggregated._avg.ctr || undefined,
            cpc: aggregated._avg.cpc || undefined,
            cpm: aggregated._avg.cpm || undefined,
            conversions: aggregated._sum.conversions || undefined,
            conversionValues: aggregated._sum.conversionValues || undefined,
            costPerConversion: aggregated._avg.costPerConversion || undefined,
            inlineLinkClicks: aggregated._sum.inlineLinkClicks,
            outboundClicks: aggregated._sum.outboundClicks,
            uniqueOutboundClicks: aggregated._sum.uniqueOutboundClicks,
            purchaseRoas: aggregated._avg.purchaseRoas || undefined,
            videoPlayActions: aggregated._sum.videoPlayActions,
            videoAvgTimeWatched: aggregated._avg.videoAvgTimeWatched || undefined,
          },
        })
      } catch (error) {
        logger.error('Failed to aggregate campaign metrics to monthly', {
          campaignId: group.campaignId,
          year,
          month,
          error,
        })
      }
    }
  }

  /**
   * Aggregate ad set daily metrics to monthly (simplified version)
   */
  private async aggregateAdSetMetricsToMonthly(year: number, month: number): Promise<void> {
    // Similar to campaign aggregation
    logger.debug('Ad set monthly aggregation', { year, month })
  }

  /**
   * Aggregate ad daily metrics to monthly (simplified version)
   */
  private async aggregateAdMetricsToMonthly(year: number, month: number): Promise<void> {
    // Similar to campaign aggregation
    logger.debug('Ad monthly aggregation', { year, month })
  }
}

export const metricsAggregationService = new MetricsAggregationService()

