import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { handleError } from '../utils/error-handler'
import { cacheService } from '../services/cache.service'

const router = Router()
const prisma = new PrismaClient()

// GET /resources/metrics/campaign/:campaignId - Get campaign metrics
router.get('/metrics/campaign/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params
    const dateStart = String(req.query.date_start || '')
    const dateEnd = String(req.query.date_end || '')
    const timeframe = String(req.query.timeframe || 'daily') // hourly, daily, monthly

    if (!dateStart || !dateEnd) {
      return res.status(400).json({ success: false, error: 'Missing date_start or date_end' })
    }

    const cacheKey = `metrics:campaign:${campaignId}:${timeframe}:${dateStart}:${dateEnd}`
    const cached = await cacheService.get(cacheKey)
    if (cached) {
      return res.json({ success: true, data: cached })
    }

    let metrics

    if (timeframe === 'hourly') {
      metrics = await prisma.metaCampaignMetricsHourly.findMany({
        where: {
          campaignId,
          date: {
            gte: new Date(dateStart),
            lte: new Date(dateEnd),
          },
        },
        orderBy: { timestamp: 'asc' },
      })
    } else if (timeframe === 'monthly') {
      const start = new Date(dateStart)
      const end = new Date(dateEnd)
      metrics = await prisma.metaCampaignMetricsMonthly.findMany({
        where: {
          campaignId,
          OR: [
            {
              year: { gte: start.getFullYear(), lte: end.getFullYear() },
              month: { gte: start.getMonth() + 1, lte: end.getMonth() + 1 },
            },
          ],
        },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      })
    } else {
      metrics = await prisma.metaCampaignMetricsDaily.findMany({
        where: {
          campaignId,
          date: {
            gte: new Date(dateStart),
            lte: new Date(dateEnd),
          },
        },
        orderBy: { date: 'asc' },
      })
    }

    await cacheService.set(cacheKey, metrics, 300)

    res.json({ success: true, data: metrics })
  } catch (error) {
    handleError(res, error, 'metrics.campaign')
  }
})

// GET /resources/metrics/adset/:adSetId - Get ad set metrics
router.get('/metrics/adset/:adSetId', async (req, res) => {
  try {
    const { adSetId } = req.params
    const dateStart = String(req.query.date_start || '')
    const dateEnd = String(req.query.date_end || '')
    const timeframe = String(req.query.timeframe || 'daily')

    if (!dateStart || !dateEnd) {
      return res.status(400).json({ success: false, error: 'Missing date_start or date_end' })
    }

    const cacheKey = `metrics:adset:${adSetId}:${timeframe}:${dateStart}:${dateEnd}`
    const cached = await cacheService.get(cacheKey)
    if (cached) {
      return res.json({ success: true, data: cached })
    }

    let metrics

    if (timeframe === 'hourly') {
      metrics = await prisma.metaAdSetMetricsHourly.findMany({
        where: {
          adSetId,
          date: {
            gte: new Date(dateStart),
            lte: new Date(dateEnd),
          },
        },
        orderBy: { timestamp: 'asc' },
      })
    } else if (timeframe === 'monthly') {
      const start = new Date(dateStart)
      const end = new Date(dateEnd)
      metrics = await prisma.metaAdSetMetricsMonthly.findMany({
        where: {
          adSetId,
          year: { gte: start.getFullYear(), lte: end.getFullYear() },
          month: { gte: start.getMonth() + 1, lte: end.getMonth() + 1 },
        },
        orderBy: [{ year: 'asc' }, { month: 'asc' }],
      })
    } else {
      metrics = await prisma.metaAdSetMetricsDaily.findMany({
        where: {
          adSetId,
          date: {
            gte: new Date(dateStart),
            lte: new Date(dateEnd),
          },
        },
        orderBy: { date: 'asc' },
      })
    }

    await cacheService.set(cacheKey, metrics, 300)

    res.json({ success: true, data: metrics })
  } catch (error) {
    handleError(res, error, 'metrics.adset')
  }
})

// GET /resources/metrics/ad/:adId - Get ad metrics
router.get('/metrics/ad/:adId', async (req, res) => {
  try {
    const { adId } = req.params
    const dateStart = String(req.query.date_start || '')
    const dateEnd = String(req.query.date_end || '')
    const timeframe = String(req.query.timeframe || 'daily')

    if (!dateStart || !dateEnd) {
      return res.status(400).json({ success: false, error: 'Missing date_start or date_end' })
    }

    const metrics = await prisma.metaAdMetricsDaily.findMany({
      where: {
        adId,
        date: {
          gte: new Date(dateStart),
          lte: new Date(dateEnd),
        },
      },
      orderBy: { date: 'asc' },
    })

    res.json({ success: true, data: metrics })
  } catch (error) {
    handleError(res, error, 'metrics.ad')
  }
})

export default router

