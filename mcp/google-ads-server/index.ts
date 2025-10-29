import express from 'express'
import { GoogleAdsClient } from './googleAdsClient'
import { PrismaClient } from '@prisma/client'

const app = express()
const PORT = process.env.MCP_GOOGLE_ADS_PORT ? Number(process.env.MCP_GOOGLE_ADS_PORT) : 8922
const prisma = new PrismaClient()

app.use(express.json())

// Health check
app.get('/health', (_req, res) => res.json({ ok: true, service: 'google-ads-mcp' }))

// ============================================
// MCP RESOURCES
// ============================================

// customer:// - List/get customer accounts
app.get('/resources/customers', async (req, res) => {
  try {
    const companyId = String(req.query.company_id || '')
    if (!companyId) return res.status(400).json({ error: 'Missing company_id' })

    const customers = await prisma.googleAdsCustomer.findMany({
      where: { companyId, isActive: true },
      select: {
        id: true,
        customerId: true,
        name: true,
        descriptiveName: true,
        currency: true,
        timezone: true,
        accountType: true,
        status: true,
        lastSyncAt: true,
      },
    })

    res.json({ customers })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Unknown error' })
  }
})

app.get('/resources/customers/:customerId', async (req, res) => {
  try {
    const { customerId } = req.params
    const companyId = String(req.query.company_id || '')
    if (!companyId) return res.status(400).json({ error: 'Missing company_id' })

    const customer = await prisma.googleAdsCustomer.findFirst({
      where: { customerId, companyId },
      include: {
        campaigns: {
          where: { status: { not: 'REMOVED' } },
          take: 10,
        },
        syncLogs: {
          orderBy: { startedAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!customer) return res.status(404).json({ error: 'Customer not found' })
    res.json({ customer })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Unknown error' })
  }
})

// campaign:// - Access campaigns
app.get('/resources/campaigns', async (req, res) => {
  try {
    const customerId = String(req.query.customer_id || '')
    const status = req.query.status as string | undefined
    if (!customerId) return res.status(400).json({ error: 'Missing customer_id' })

    const campaigns = await prisma.googleAdsCampaign.findMany({
      where: {
        customerId,
        ...(status && { status: status as any }),
      },
      include: {
        budget: true,
        _count: {
          select: { adGroups: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    res.json({ campaigns })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Unknown error' })
  }
})

app.get('/resources/campaigns/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params
    const customerId = String(req.query.customer_id || '')
    if (!customerId) return res.status(400).json({ error: 'Missing customer_id' })

    const campaign = await prisma.googleAdsCampaign.findFirst({
      where: { campaignId, customerId },
      include: {
        budget: true,
        biddingStrategy: true,
        adGroups: {
          include: {
            _count: {
              select: { ads: true, keywords: true },
            },
          },
        },
        geoTargets: true,
        languageTargets: true,
        deviceTargets: true,
      },
    })

    if (!campaign) return res.status(404).json({ error: 'Campaign not found' })
    res.json({ campaign })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Unknown error' })
  }
})

// adgroup:// - Access ad groups
app.get('/resources/adgroups', async (req, res) => {
  try {
    const campaignId = String(req.query.campaign_id || '')
    if (!campaignId) return res.status(400).json({ error: 'Missing campaign_id' })

    const adGroups = await prisma.googleAdsAdGroup.findMany({
      where: { campaignId },
      include: {
        _count: {
          select: { ads: true, keywords: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
    })

    res.json({ adGroups })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Unknown error' })
  }
})

// ad:// - Access ads
app.get('/resources/ads', async (req, res) => {
  try {
    const adGroupId = String(req.query.adgroup_id || '')
    if (!adGroupId) return res.status(400).json({ error: 'Missing adgroup_id' })

    const ads = await prisma.googleAdsAd.findMany({
      where: { adGroupId },
      orderBy: { updatedAt: 'desc' },
    })

    res.json({ ads })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Unknown error' })
  }
})

// keyword:// - Access keywords
app.get('/resources/keywords', async (req, res) => {
  try {
    const adGroupId = String(req.query.adgroup_id || '')
    if (!adGroupId) return res.status(400).json({ error: 'Missing adgroup_id' })

    const keywords = await prisma.googleAdsKeyword.findMany({
      where: { adGroupId, status: { not: 'REMOVED' } },
      orderBy: { updatedAt: 'desc' },
    })

    res.json({ keywords })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Unknown error' })
  }
})

// metrics:// - Query time-series metrics
app.get('/resources/metrics', async (req, res) => {
  try {
    const entityType = String(req.query.entity_type || 'CAMPAIGN')
    const customerId = String(req.query.customer_id || '')
    const entityId = String(req.query.entity_id || '')
    const startDate = req.query.start_date ? new Date(String(req.query.start_date)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const endDate = req.query.end_date ? new Date(String(req.query.end_date)) : new Date()
    const granularity = String(req.query.granularity || 'daily') // hourly, daily, monthly

    if (!customerId) return res.status(400).json({ error: 'Missing customer_id' })

    let metrics: any[] = []

    if (granularity === 'hourly') {
      metrics = await prisma.googleAdsMetricsHourly.findMany({
        where: {
          entityType,
          customerId,
          ...(entityId && entityType === 'CAMPAIGN' && { campaignId: entityId }),
          ...(entityId && entityType === 'AD_GROUP' && { adGroupId: entityId }),
          ...(entityId && entityType === 'AD' && { adId: entityId }),
          ...(entityId && entityType === 'KEYWORD' && { keywordId: entityId }),
          timestamp: { gte: startDate, lte: endDate },
        },
        orderBy: { timestamp: 'asc' },
      })
    } else if (granularity === 'monthly') {
      const startYear = startDate.getFullYear()
      const startMonth = startDate.getMonth() + 1
      const endYear = endDate.getFullYear()
      const endMonth = endDate.getMonth() + 1

      metrics = await prisma.googleAdsMetricsMonthly.findMany({
        where: {
          entityType,
          customerId,
          ...(entityId && entityType === 'CAMPAIGN' && { campaignId: entityId }),
          ...(entityId && entityType === 'AD_GROUP' && { adGroupId: entityId }),
          ...(entityId && entityType === 'AD' && { adId: entityId }),
          ...(entityId && entityType === 'KEYWORD' && { keywordId: entityId }),
          OR: [
            { year: { gte: startYear, lte: endYear } },
          ],
        },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      })
    } else {
      // daily (default)
      metrics = await prisma.googleAdsMetricsDaily.findMany({
        where: {
          entityType,
          customerId,
          ...(entityId && entityType === 'CAMPAIGN' && { campaignId: entityId }),
          ...(entityId && entityType === 'AD_GROUP' && { adGroupId: entityId }),
          ...(entityId && entityType === 'AD' && { adId: entityId }),
          ...(entityId && entityType === 'KEYWORD' && { keywordId: entityId }),
          date: { gte: startDate, lte: endDate },
        },
        orderBy: { date: 'asc' },
      })
    }

    res.json({ metrics, granularity, entityType, count: metrics.length })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Unknown error' })
  }
})

// insights:// - Get aggregated insights
app.get('/resources/insights', async (req, res) => {
  try {
    const customerId = String(req.query.customer_id || '')
    const campaignId = req.query.campaign_id as string | undefined
    const startDate = req.query.start_date ? new Date(String(req.query.start_date)) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const endDate = req.query.end_date ? new Date(String(req.query.end_date)) : new Date()

    if (!customerId) return res.status(400).json({ error: 'Missing customer_id' })

    // Aggregate daily metrics
    const metrics = await prisma.googleAdsMetricsDaily.findMany({
      where: {
        entityType: 'CAMPAIGN',
        customerId,
        ...(campaignId && { campaignId }),
        date: { gte: startDate, lte: endDate },
      },
    })

    // Calculate aggregates
    const totals = metrics.reduce(
      (acc, m) => ({
        impressions: acc.impressions + Number(m.impressions),
        clicks: acc.clicks + Number(m.clicks),
        cost: acc.cost + Number(m.cost),
        conversions: acc.conversions + Number(m.conversions),
        conversionValue: acc.conversionValue + Number(m.conversionValue),
      }),
      { impressions: 0, clicks: 0, cost: 0, conversions: 0, conversionValue: 0 }
    )

    const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
    const cpc = totals.clicks > 0 ? totals.cost / totals.clicks : 0
    const conversionRate = totals.clicks > 0 ? (totals.conversions / totals.clicks) * 100 : 0
    const roas = totals.cost > 0 ? totals.conversionValue / totals.cost : 0

    res.json({
      insights: {
        ...totals,
        ctr: ctr.toFixed(2),
        cpc: cpc.toFixed(2),
        conversionRate: conversionRate.toFixed(2),
        roas: roas.toFixed(2),
      },
      period: { startDate, endDate },
      dataPoints: metrics.length,
    })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Unknown error' })
  }
})

// ============================================
// MCP TOOLS
// ============================================

// tools/customers - List accessible customers from Google Ads API
app.post('/tools/customers', async (req, res) => {
  try {
    const { accessToken, refreshToken, companyId } = req.body
    if (!accessToken || !companyId) {
      return res.status(400).json({ error: 'Missing accessToken or companyId' })
    }

    const client = new GoogleAdsClient({ accessToken, refreshToken })
    const customers = await client.listAccessibleCustomers()

    res.json({ customers })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Unknown error' })
  }
})

// tools/sync - Trigger sync from Google Ads API
app.post('/tools/sync', async (req, res) => {
  try {
    const { customerId, accessToken, refreshToken, syncType = 'FULL', entityType } = req.body
    if (!customerId || !accessToken) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    // Create sync log
    const syncLog = await prisma.googleAdsSyncLog.create({
      data: {
        customerId,
        syncType,
        entityType,
        status: 'IN_PROGRESS',
        startedAt: new Date(),
        triggeredBy: 'MCP',
      },
    })

    // Start sync in background (in production, use queue)
    const client = new GoogleAdsClient({ accessToken, refreshToken, customerId })

    try {
      let recordsProcessed = 0
      let recordsCreated = 0
      let recordsUpdated = 0

      // Sync campaigns
      if (!entityType || entityType === 'CAMPAIGNS') {
        const campaigns = await client.listCampaigns()
        for (const campaign of campaigns) {
          const existing = await prisma.googleAdsCampaign.findFirst({
            where: { customerId, campaignId: campaign.id },
          })

          if (existing) {
            await prisma.googleAdsCampaign.update({
              where: { id: existing.id },
              data: {
                name: campaign.name,
                status: campaign.status,
                type: campaign.type,
                lastSyncAt: new Date(),
              },
            })
            recordsUpdated++
          } else {
            await prisma.googleAdsCampaign.create({
              data: {
                customerId,
                campaignId: campaign.id,
                name: campaign.name,
                status: campaign.status,
                type: campaign.type,
                lastSyncAt: new Date(),
              },
            })
            recordsCreated++
          }
          recordsProcessed++
        }
      }

      // Update sync log
      await prisma.googleAdsSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'SUCCESS',
          completedAt: new Date(),
          duration: Math.floor((Date.now() - syncLog.startedAt.getTime()) / 1000),
          recordsProcessed,
          recordsCreated,
          recordsUpdated,
        },
      })

      res.json({
        success: true,
        syncLogId: syncLog.id,
        recordsProcessed,
        recordsCreated,
        recordsUpdated,
      })
    } catch (syncError: any) {
      // Update sync log with error
      await prisma.googleAdsSyncLog.update({
        where: { id: syncLog.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          error: syncError.message,
          errorDetails: { stack: syncError.stack },
        },
      })

      throw syncError
    }
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Unknown error' })
  }
})

// tools/campaigns - List/create/update campaigns
app.post('/tools/campaigns', async (req, res) => {
  try {
    const { action, customerId, accessToken, refreshToken, campaignData } = req.body
    if (!customerId || !accessToken || !action) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    const client = new GoogleAdsClient({ accessToken, refreshToken, customerId })

    if (action === 'list') {
      const campaigns = await client.listCampaigns()
      res.json({ campaigns })
    } else if (action === 'create') {
      if (!campaignData) return res.status(400).json({ error: 'Missing campaignData' })
      const campaign = await client.createCampaign(campaignData)
      res.json({ campaign, success: true })
    } else if (action === 'update') {
      if (!campaignData || !campaignData.id) {
        return res.status(400).json({ error: 'Missing campaignData or campaign ID' })
      }
      const campaign = await client.updateCampaign(campaignData)
      res.json({ campaign, success: true })
    } else {
      res.status(400).json({ error: 'Invalid action. Use: list, create, update' })
    }
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Unknown error' })
  }
})

// tools/metrics - Query metrics with date ranges
app.post('/tools/metrics', async (req, res) => {
  try {
    const { customerId, accessToken, refreshToken, startDate, endDate, entityType = 'CAMPAIGN', entityId } = req.body
    if (!customerId || !accessToken || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required parameters' })
    }

    const client = new GoogleAdsClient({ accessToken, refreshToken, customerId })
    const metrics = await client.getMetrics({
      startDate,
      endDate,
      entityType,
      entityId,
    })

    res.json({ metrics, count: metrics.length })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Unknown error' })
  }
})

// tools/bulkOperations - Execute bulk changes
app.post('/tools/bulkOperations', async (req, res) => {
  try {
    const { customerId, accessToken, refreshToken, operations } = req.body
    if (!customerId || !accessToken || !operations || !Array.isArray(operations)) {
      return res.status(400).json({ error: 'Missing required parameters or invalid operations' })
    }

    const client = new GoogleAdsClient({ accessToken, refreshToken, customerId })

    // Queue operations
    const queuedOperations = []
    for (const op of operations) {
      const queued = await prisma.googleAdsOperationQueue.create({
        data: {
          operationType: op.type,
          entityType: op.entityType,
          entityId: op.entityId,
          payload: op.data,
          status: 'PENDING',
        },
      })
      queuedOperations.push(queued)
    }

    res.json({
      success: true,
      queued: queuedOperations.length,
      operations: queuedOperations.map(op => ({ id: op.id, type: op.operationType })),
    })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Unknown error' })
  }
})

// ============================================
// SERVER STARTUP
// ============================================

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`[mcp:google-ads] listening on http://localhost:${PORT}`)
})

// Graceful shutdown
process.on('SIGTERM', async () => {
  await prisma.$disconnect()
  process.exit(0)
})



