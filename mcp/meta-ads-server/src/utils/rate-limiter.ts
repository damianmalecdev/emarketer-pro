import { PrismaClient } from '@prisma/client'
import { logger } from './logger'

const prisma = new PrismaClient()

interface RateLimitConfig {
  accountId: string
  endpointPattern: string
  limitType: 'APP_LEVEL' | 'ACCOUNT_LEVEL'
  maxCalls: number
  windowMinutes: number
}

export class RateLimiter {
  /**
   * Check if we can make a request within rate limits
   */
  async checkRateLimit(config: RateLimitConfig): Promise<boolean> {
    const now = new Date()
    const windowStart = new Date(now.getTime() - config.windowMinutes * 60000)

    const rateLimit = await prisma.metaRateLimit.findFirst({
      where: {
        accountId: config.accountId,
        endpointPattern: config.endpointPattern,
        windowStart: {
          gte: windowStart,
        },
      },
      orderBy: {
        windowStart: 'desc',
      },
    })

    if (!rateLimit) {
      // No existing rate limit, create one
      await this.recordCall(config)
      return true
    }

    if (rateLimit.callsCount >= config.maxCalls) {
      logger.warn('Rate limit exceeded', {
        accountId: config.accountId,
        endpoint: config.endpointPattern,
        calls: rateLimit.callsCount,
        max: config.maxCalls,
      })
      return false
    }

    return true
  }

  /**
   * Record an API call
   */
  async recordCall(config: RateLimitConfig) {
    const now = new Date()
    const windowStart = new Date(now.getTime() - config.windowMinutes * 60000)
    const windowEnd = new Date(now.getTime() + config.windowMinutes * 60000)

    await prisma.metaRateLimit.upsert({
      where: {
        accountId_endpointPattern_windowStart: {
          accountId: config.accountId,
          endpointPattern: config.endpointPattern,
          windowStart,
        },
      },
      create: {
        accountId: config.accountId,
        endpointPattern: config.endpointPattern,
        callsCount: 1,
        windowStart,
        windowEnd,
        limitType: config.limitType,
        callsRemaining: config.maxCalls - 1,
      },
      update: {
        callsCount: {
          increment: 1,
        },
        callsRemaining: {
          decrement: 1,
        },
      },
    })
  }

  /**
   * Clean up old rate limit records
   */
  async cleanup() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000) // 24 hours ago

    const deleted = await prisma.metaRateLimit.deleteMany({
      where: {
        windowEnd: {
          lt: cutoff,
        },
      },
    })

    logger.info(`Cleaned up ${deleted.count} old rate limit records`)
  }
}

export const rateLimiter = new RateLimiter()

