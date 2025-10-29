import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { syncService } from '../services/sync.service'
import { handleError } from '../utils/error-handler'
import type { SyncOptions } from '../types/mcp.types'

const router = Router()
const prisma = new PrismaClient()

// POST /tools/sync_account - Full account synchronization
router.post('/sync_account', async (req, res) => {
  try {
    const { accountId } = req.body

    if (!accountId) {
      return res.status(400).json({
        success: false,
        error: 'Missing accountId',
      })
    }

    // Verify account exists
    const account = await prisma.metaAdsAccount.findUnique({
      where: { id: accountId },
    })

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      })
    }

    // Start sync in background (don't await)
    const syncOptions: SyncOptions = {
      accountId,
      syncType: 'FULL',
      triggeredBy: 'MCP',
    }

    // Queue the sync operation
    await prisma.metaMCPJobQueue.create({
      data: {
        jobType: 'SYNC_ACCOUNT',
        entityType: 'ACCOUNT',
        entityId: accountId,
        payload: syncOptions,
        status: 'PENDING',
        priority: 1,
      },
    })

    // Start sync async (don't block response)
    syncService.syncAccount(syncOptions).catch((error) => {
      console.error('Sync failed:', error)
    })

    res.json({
      success: true,
      message: 'Account sync started',
      data: {
        accountId,
        syncType: 'FULL',
      },
    })
  } catch (error) {
    handleError(res, error, 'tools.sync_account')
  }
})

// POST /tools/sync_metrics - Sync metrics for date range
router.post('/sync_metrics', async (req, res) => {
  try {
    const { accountId, dateStart, dateEnd } = req.body

    if (!accountId || !dateStart || !dateEnd) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: accountId, dateStart, dateEnd',
      })
    }

    // Verify account
    const account = await prisma.metaAdsAccount.findUnique({
      where: { id: accountId },
    })

    if (!account) {
      return res.status(404).json({
        success: false,
        error: 'Account not found',
      })
    }

    // Start sync
    const syncOptions: SyncOptions = {
      accountId,
      syncType: 'METRICS',
      entityTypes: ['METRICS'],
      dateRange: {
        since: dateStart,
        until: dateEnd,
      },
      triggeredBy: 'MCP',
    }

    // Queue the sync
    await prisma.metaMCPJobQueue.create({
      data: {
        jobType: 'SYNC_METRICS',
        entityType: 'METRICS',
        entityId: accountId,
        payload: syncOptions,
        status: 'PENDING',
      },
    })

    syncService.syncAccount(syncOptions).catch((error) => {
      console.error('Metrics sync failed:', error)
    })

    res.json({
      success: true,
      message: 'Metrics sync started',
      data: {
        accountId,
        dateRange: { dateStart, dateEnd },
      },
    })
  } catch (error) {
    handleError(res, error, 'tools.sync_metrics')
  }
})

// POST /tools/force_refresh - Force refresh cache
router.post('/force_refresh', async (req, res) => {
  try {
    const { resourceType, resourceId } = req.body

    if (!resourceType) {
      return res.status(400).json({
        success: false,
        error: 'Missing resourceType',
      })
    }

    let count = 0

    if (resourceId) {
      const { cacheService } = await import('../services/cache.service')
      count = await cacheService.invalidateResource(resourceType, resourceId)
    } else {
      const { cacheService } = await import('../services/cache.service')
      count = await cacheService.invalidatePattern(resourceType.toLowerCase())
    }

    res.json({
      success: true,
      message: `Cache refreshed for ${resourceType}`,
      data: {
        entriesInvalidated: count,
      },
    })
  } catch (error) {
    handleError(res, error, 'tools.force_refresh')
  }
})

// GET /tools/sync_status/:accountId - Get sync status
router.get('/sync_status/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params

    const syncLogs = await prisma.metaSyncLog.findMany({
      where: { accountId },
      orderBy: { startedAt: 'desc' },
      take: 10,
    })

    const latestSync = syncLogs[0]

    res.json({
      success: true,
      data: {
        latestSync,
        history: syncLogs,
      },
    })
  } catch (error) {
    handleError(res, error, 'tools.sync_status')
  }
})

export default router

