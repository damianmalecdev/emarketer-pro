import cron from 'node-cron'
import { metricsAggregationService } from '../services/metrics-aggregation.service'
import { rateLimiter } from '../utils/rate-limiter'
import { cacheService } from '../services/cache.service'
import { logger } from '../utils/logger'

/**
 * Metrics aggregation scheduler
 * Runs aggregation jobs on a schedule
 */

// Aggregate hourly metrics to daily - Runs every hour at :05 minutes
cron.schedule('5 * * * *', async () => {
  logger.info('Starting hourly to daily aggregation cron job')
  try {
    const date = new Date()
    date.setHours(date.getHours() - 1) // Aggregate previous hour

    await metricsAggregationService.aggregateHourlyToDaily(date)
    
    logger.info('Hourly to daily aggregation completed')
  } catch (error) {
    logger.error('Hourly to daily aggregation cron failed', { error })
  }
})

// Aggregate daily metrics to monthly - Runs daily at 2:00 AM
cron.schedule('0 2 * * *', async () => {
  logger.info('Starting daily to monthly aggregation cron job')
  try {
    const date = new Date()
    date.setDate(date.getDate() - 1) // Aggregate previous day

    const year = date.getFullYear()
    const month = date.getMonth() + 1

    await metricsAggregationService.aggregateDailyToMonthly(year, month)
    
    logger.info('Daily to monthly aggregation completed')
  } catch (error) {
    logger.error('Daily to monthly aggregation cron failed', { error })
  }
})

// Clean up old rate limit records - Runs daily at 3:00 AM
cron.schedule('0 3 * * *', async () => {
  logger.info('Starting rate limit cleanup cron job')
  try {
    await rateLimiter.cleanup()
    logger.info('Rate limit cleanup completed')
  } catch (error) {
    logger.error('Rate limit cleanup cron failed', { error })
  }
})

// Clean up expired cache entries - Runs every 6 hours
cron.schedule('0 */6 * * *', async () => {
  logger.info('Starting cache cleanup cron job')
  try {
    await cacheService.cleanup()
    logger.info('Cache cleanup completed')
  } catch (error) {
    logger.error('Cache cleanup cron failed', { error })
  }
})

logger.info('Meta Ads MCP aggregation scheduler initialized')
logger.info('Scheduled jobs:')
logger.info('  - Hourly to daily aggregation: Every hour at :05')
logger.info('  - Daily to monthly aggregation: Daily at 2:00 AM')
logger.info('  - Rate limit cleanup: Daily at 3:00 AM')
logger.info('  - Cache cleanup: Every 6 hours')

// Keep the process running
process.on('SIGINT', () => {
  logger.info('Aggregation scheduler shutting down...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  logger.info('Aggregation scheduler shutting down...')
  process.exit(0)
})

