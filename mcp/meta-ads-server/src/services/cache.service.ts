import { PrismaClient } from '@prisma/client'
import { logger } from '../utils/logger'

const prisma = new PrismaClient()

export class CacheService {
  /**
   * Get cached data
   */
  async get<T = any>(key: string): Promise<T | null> {
    try {
      const cached = await prisma.metaMCPCache.findUnique({
        where: { cacheKey: key },
      })

      if (!cached) {
        return null
      }

      // Check if expired
      if (cached.expiresAt < new Date()) {
        await this.delete(key)
        return null
      }

      // Update hit count and last accessed
      await prisma.metaMCPCache.update({
        where: { id: cached.id },
        data: {
          hitCount: { increment: 1 },
          lastAccessedAt: new Date(),
        },
      })

      return cached.data as T
    } catch (error) {
      logger.error('Cache get error', { key, error })
      return null
    }
  }

  /**
   * Set cached data
   */
  async set(
    key: string,
    data: any,
    ttlSeconds: number = 3600,
    resourceType?: string,
    resourceId?: string
  ): Promise<void> {
    try {
      const expiresAt = new Date(Date.now() + ttlSeconds * 1000)

      await prisma.metaMCPCache.upsert({
        where: { cacheKey: key },
        create: {
          cacheKey: key,
          resourceType: resourceType || 'UNKNOWN',
          resourceId,
          data,
          expiresAt,
        },
        update: {
          data,
          expiresAt,
          hitCount: 0,
          lastAccessedAt: new Date(),
        },
      })

      logger.debug('Cache set', { key, ttl: ttlSeconds })
    } catch (error) {
      logger.error('Cache set error', { key, error })
    }
  }

  /**
   * Delete cached data
   */
  async delete(key: string): Promise<void> {
    try {
      await prisma.metaMCPCache.delete({
        where: { cacheKey: key },
      })
      logger.debug('Cache deleted', { key })
    } catch (error) {
      // Ignore errors (key might not exist)
    }
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<number> {
    try {
      const keys = await prisma.metaMCPCache.findMany({
        where: {
          cacheKey: {
            contains: pattern,
          },
        },
        select: { cacheKey: true },
      })

      const deleted = await prisma.metaMCPCache.deleteMany({
        where: {
          cacheKey: {
            contains: pattern,
          },
        },
      })

      logger.info('Cache pattern invalidated', { pattern, count: deleted.count })
      return deleted.count
    } catch (error) {
      logger.error('Cache invalidation error', { pattern, error })
      return 0
    }
  }

  /**
   * Invalidate cache by resource
   */
  async invalidateResource(resourceType: string, resourceId: string): Promise<number> {
    try {
      const deleted = await prisma.metaMCPCache.deleteMany({
        where: {
          resourceType,
          resourceId,
        },
      })

      logger.info('Resource cache invalidated', { resourceType, resourceId, count: deleted.count })
      return deleted.count
    } catch (error) {
      logger.error('Resource cache invalidation error', { resourceType, resourceId, error })
      return 0
    }
  }

  /**
   * Clean up expired cache entries
   */
  async cleanup(): Promise<number> {
    try {
      const deleted = await prisma.metaMCPCache.deleteMany({
        where: {
          expiresAt: {
            lt: new Date(),
          },
        },
      })

      logger.info(`Cleaned up ${deleted.count} expired cache entries`)
      return deleted.count
    } catch (error) {
      logger.error('Cache cleanup error', { error })
      return 0
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<{
    totalEntries: number
    totalHits: number
    topKeys: Array<{ key: string; hits: number }>
  }> {
    try {
      const entries = await prisma.metaMCPCache.findMany({
        select: {
          cacheKey: true,
          hitCount: true,
        },
        orderBy: {
          hitCount: 'desc',
        },
        take: 10,
      })

      const totalEntries = await prisma.metaMCPCache.count()
      const totalHits = entries.reduce((sum, e) => sum + e.hitCount, 0)

      return {
        totalEntries,
        totalHits,
        topKeys: entries.map((e) => ({
          key: e.cacheKey,
          hits: e.hitCount,
        })),
      }
    } catch (error) {
      logger.error('Cache stats error', { error })
      return { totalEntries: 0, totalHits: 0, topKeys: [] }
    }
  }
}

export const cacheService = new CacheService()

