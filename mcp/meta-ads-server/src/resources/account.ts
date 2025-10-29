import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { handleError } from '../utils/error-handler'
import { cacheService } from '../services/cache.service'

const router = Router()
const prisma = new PrismaClient()

// GET /resources/accounts - List all Meta Ad Accounts for a company
router.get('/accounts', async (req, res) => {
  try {
    const companyId = String(req.query.company_id || '')
    if (!companyId) {
      return res.status(400).json({ success: false, error: 'Missing company_id' })
    }

    const cacheKey = `accounts:company:${companyId}`
    const cached = await cacheService.get(cacheKey)
    if (cached) {
      return res.json({ success: true, data: cached })
    }

    const accounts = await prisma.metaAdsAccount.findMany({
      where: { companyId, isActive: true },
      select: {
        id: true,
        accountId: true,
        name: true,
        accountStatus: true,
        currency: true,
        timezone: true,
        accountType: true,
        spendingLimit: true,
        dailySpendLimit: true,
        amountSpent: true,
        balance: true,
        lastSyncAt: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { name: 'asc' },
    })

    await cacheService.set(cacheKey, accounts, 300) // 5 minutes TTL

    res.json({ success: true, data: accounts })
  } catch (error) {
    handleError(res, error, 'accounts.list')
  }
})

// GET /resources/accounts/:accountId - Get single Meta Ad Account
router.get('/accounts/:accountId', async (req, res) => {
  try {
    const { accountId } = req.params
    const companyId = String(req.query.company_id || '')
    if (!companyId) {
      return res.status(400).json({ success: false, error: 'Missing company_id' })
    }

    const cacheKey = `account:${accountId}`
    const cached = await cacheService.get(cacheKey)
    if (cached) {
      return res.json({ success: true, data: cached })
    }

    const account = await prisma.metaAdsAccount.findFirst({
      where: { id: accountId, companyId },
      include: {
        campaigns: {
          where: { status: { not: 'DELETED' } },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        syncLogs: {
          orderBy: { startedAt: 'desc' },
          take: 5,
        },
        _count: {
          select: {
            campaigns: true,
            customAudiences: true,
            pixels: true,
          },
        },
      },
    })

    if (!account) {
      return res.status(404).json({ success: false, error: 'Account not found' })
    }

    await cacheService.set(cacheKey, account, 300)

    res.json({ success: true, data: account })
  } catch (error) {
    handleError(res, error, 'accounts.get')
  }
})

export default router

