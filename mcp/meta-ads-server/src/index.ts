import express from 'express'
import { PrismaClient } from '@prisma/client'
import { logger } from './utils/logger'

// Import resource handlers
import accountResource from './resources/account'
import campaignResource from './resources/campaign'
import metricsResource from './resources/metrics'

// Import tool handlers
import campaignManagementTool from './tools/campaign-management'
import syncTool from './tools/sync'
import bulkOperationsTool from './tools/bulk-operations'

const app = express()
const PORT = process.env.MCP_META_ADS_PORT ? Number(process.env.MCP_META_ADS_PORT) : 8923
const prisma = new PrismaClient()

// Middleware
app.use(express.json())

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`, {
    query: req.query,
    body: req.body,
  })
  next()
})

// Health check
app.get('/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'meta-ads-mcp',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  })
})

// ============================================
// MCP RESOURCES
// ============================================

app.use('/resources', accountResource)
app.use('/resources', campaignResource)
app.use('/resources', metricsResource)

// ============================================
// MCP TOOLS
// ============================================

app.use('/tools', campaignManagementTool)
app.use('/tools', syncTool)
app.use('/tools', bulkOperationsTool)

// ============================================
// ADDITIONAL ENDPOINTS
// ============================================

// GET /info - Server information
app.get('/info', (_req, res) => {
  res.json({
    service: 'Meta Ads MCP Server',
    version: '1.0.0',
    description: 'Model Context Protocol Server for Meta Ads (Facebook & Instagram)',
    capabilities: {
      resources: [
        'meta-account://{accountId}',
        'meta-campaign://{campaignId}',
        'meta-adset://{adsetId}',
        'meta-ad://{adId}',
        'meta-metrics://{entity}/{id}/{timeframe}',
      ],
      tools: [
        'create_meta_campaign',
        'update_meta_campaign',
        'pause_meta_campaign',
        'resume_meta_campaign',
        'delete_meta_campaign',
        'sync_meta_account',
        'sync_meta_metrics',
        'force_refresh',
        'bulk_update_status',
        'bulk_update_budgets',
      ],
    },
    endpoints: {
      health: '/health',
      info: '/info',
      resources: '/resources/*',
      tools: '/tools/*',
    },
  })
})

// GET /status - System status
app.get('/status', async (_req, res) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`

    // Get cache stats
    const { cacheService } = await import('./services/cache.service')
    const cacheStats = await cacheService.getStats()

    // Get account counts
    const accountCount = await prisma.metaAdsAccount.count({
      where: { isActive: true },
    })

    const campaignCount = await prisma.metaCampaign.count()

    // Get recent sync logs
    const recentSyncs = await prisma.metaSyncLog.findMany({
      take: 5,
      orderBy: { startedAt: 'desc' },
      select: {
        id: true,
        accountId: true,
        syncType: true,
        status: true,
        startedAt: true,
        completedAt: true,
      },
    })

    res.json({
      status: 'healthy',
      database: 'connected',
      cache: cacheStats,
      accounts: {
        total: accountCount,
        campaigns: campaignCount,
      },
      recentSyncs,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    })
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error instanceof Error ? error.message : String(error),
    })
  }
})

// 404 handler
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    message: 'The requested endpoint does not exist',
  })
})

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err })
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message || 'An unexpected error occurred',
  })
})

// Start server
app.listen(PORT, () => {
  logger.info(`Meta Ads MCP Server listening on http://localhost:${PORT}`)
  logger.info(`Health check: http://localhost:${PORT}/health`)
  logger.info(`Info: http://localhost:${PORT}/info`)
  logger.info(`Status: http://localhost:${PORT}/status`)
})

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

process.on('SIGTERM', async () => {
  logger.info('Shutting down gracefully...')
  await prisma.$disconnect()
  process.exit(0)
})

export default app

