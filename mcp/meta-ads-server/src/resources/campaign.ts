import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { handleError } from '../utils/error-handler'
import { cacheService } from '../services/cache.service'

const router = Router()
const prisma = new PrismaClient()

// GET /resources/campaigns - List campaigns
router.get('/campaigns', async (req, res) => {
  try {
    const accountId = String(req.query.account_id || '')
    const status = req.query.status as string | undefined
    const limit = parseInt(String(req.query.limit || '100'))

    if (!accountId) {
      return res.status(400).json({ success: false, error: 'Missing account_id' })
    }

    const cacheKey = `campaigns:account:${accountId}:status:${status || 'all'}`
    const cached = await cacheService.get(cacheKey)
    if (cached) {
      return res.json({ success: true, data: cached })
    }

    const campaigns = await prisma.metaCampaign.findMany({
      where: {
        accountId,
        ...(status && { status: status as any }),
      },
      select: {
        id: true,
        campaignId: true,
        name: true,
        status: true,
        effectiveStatus: true,
        objective: true,
        dailyBudget: true,
        lifetimeBudget: true,
        budgetRemaining: true,
        startTime: true,
        endTime: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            adSets: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    await cacheService.set(cacheKey, campaigns, 60)

    res.json({ success: true, data: campaigns })
  } catch (error) {
    handleError(res, error, 'campaigns.list')
  }
})

// GET /resources/campaigns/:campaignId - Get campaign details
router.get('/campaigns/:campaignId', async (req, res) => {
  try {
    const { campaignId } = req.params

    const cacheKey = `campaign:${campaignId}`
    const cached = await cacheService.get(cacheKey)
    if (cached) {
      return res.json({ success: true, data: cached })
    }

    const campaign = await prisma.metaCampaign.findUnique({
      where: { id: campaignId },
      include: {
        adSets: {
          where: { status: { not: 'DELETED' } },
          take: 20,
        },
        _count: {
          select: {
            adSets: true,
            metricsDaily: true,
          },
        },
      },
    })

    if (!campaign) {
      return res.status(404).json({ success: false, error: 'Campaign not found' })
    }

    await cacheService.set(cacheKey, campaign, 60)

    res.json({ success: true, data: campaign })
  } catch (error) {
    handleError(res, error, 'campaigns.get')
  }
})

export default router

