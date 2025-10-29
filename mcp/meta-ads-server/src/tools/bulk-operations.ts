import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { MetaAPIService } from '../services/meta-api.service'
import { handleError } from '../utils/error-handler'
import type { BulkStatusUpdate, BulkBudgetUpdate } from '../types/mcp.types'

const router = Router()
const prisma = new PrismaClient()

// POST /tools/bulk_update_status - Update status for multiple entities
router.post('/bulk_update_status', async (req, res) => {
  try {
    const params: BulkStatusUpdate = req.body

    if (!params.entityType || !params.entityIds || !params.status) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: entityType, entityIds, status',
      })
    }

    if (params.entityIds.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Bulk operations limited to 50 entities',
      })
    }

    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    // Process each entity
    for (const entityId of params.entityIds) {
      try {
        if (params.entityType === 'CAMPAIGN') {
          const campaign = await prisma.metaCampaign.findUnique({
            where: { id: entityId },
            include: { account: true },
          })

          if (campaign && campaign.account.accessToken) {
            const api = new MetaAPIService({
              accessToken: campaign.account.accessToken,
              accountId: campaign.account.accountId,
            })

            await api.updateCampaign(campaign.campaignId, { status: params.status })

            await prisma.metaCampaign.update({
              where: { id: entityId },
              data: { status: params.status as any },
            })

            successCount++
          }
        } else if (params.entityType === 'ADSET') {
          const adset = await prisma.metaAdSet.findUnique({
            where: { id: entityId },
            include: { campaign: { include: { account: true } } },
          })

          if (adset && adset.campaign.account.accessToken) {
            const api = new MetaAPIService({
              accessToken: adset.campaign.account.accessToken,
              accountId: adset.campaign.account.accountId,
            })

            await api.updateAdSet(adset.adSetId, { status: params.status })

            await prisma.metaAdSet.update({
              where: { id: entityId },
              data: { status: params.status as any },
            })

            successCount++
          }
        } else if (params.entityType === 'AD') {
          const ad = await prisma.metaAd.findUnique({
            where: { id: entityId },
            include: {
              adSet: {
                include: {
                  campaign: { include: { account: true } },
                },
              },
            },
          })

          if (ad && ad.adSet.campaign.account.accessToken) {
            const api = new MetaAPIService({
              accessToken: ad.adSet.campaign.account.accessToken,
              accountId: ad.adSet.campaign.account.accountId,
            })

            await api.updateAd(ad.adId, { status: params.status })

            await prisma.metaAd.update({
              where: { id: entityId },
              data: { status: params.status as any },
            })

            successCount++
          }
        }
      } catch (error) {
        failCount++
        errors.push(`${entityId}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    res.json({
      success: true,
      message: `Bulk status update completed: ${successCount} successful, ${failCount} failed`,
      data: {
        successCount,
        failCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    })
  } catch (error) {
    handleError(res, error, 'tools.bulk_update_status')
  }
})

// POST /tools/bulk_update_budgets - Update budgets for multiple entities
router.post('/bulk_update_budgets', async (req, res) => {
  try {
    const params: BulkBudgetUpdate = req.body

    if (!params.entityType || !params.entityIds || !params.budgetType || !params.budgetAmount) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
      })
    }

    if (params.entityIds.length > 50) {
      return res.status(400).json({
        success: false,
        error: 'Bulk operations limited to 50 entities',
      })
    }

    let successCount = 0
    let failCount = 0
    const errors: string[] = []

    const budgetField = params.budgetType === 'DAILY' ? 'daily_budget' : 'lifetime_budget'

    for (const entityId of params.entityIds) {
      try {
        if (params.entityType === 'CAMPAIGN') {
          const campaign = await prisma.metaCampaign.findUnique({
            where: { id: entityId },
            include: { account: true },
          })

          if (campaign && campaign.account.accessToken) {
            const api = new MetaAPIService({
              accessToken: campaign.account.accessToken,
              accountId: campaign.account.accountId,
            })

            await api.updateCampaign(campaign.campaignId, {
              [budgetField]: params.budgetAmount,
            })

            await prisma.metaCampaign.update({
              where: { id: entityId },
              data: {
                [params.budgetType === 'DAILY' ? 'dailyBudget' : 'lifetimeBudget']: params.budgetAmount,
              },
            })

            successCount++
          }
        } else if (params.entityType === 'ADSET') {
          const adset = await prisma.metaAdSet.findUnique({
            where: { id: entityId },
            include: { campaign: { include: { account: true } } },
          })

          if (adset && adset.campaign.account.accessToken) {
            const api = new MetaAPIService({
              accessToken: adset.campaign.account.accessToken,
              accountId: adset.campaign.account.accountId,
            })

            await api.updateAdSet(adset.adSetId, {
              [budgetField]: params.budgetAmount,
            })

            await prisma.metaAdSet.update({
              where: { id: entityId },
              data: {
                [params.budgetType === 'DAILY' ? 'dailyBudget' : 'lifetimeBudget']: params.budgetAmount,
              },
            })

            successCount++
          }
        }
      } catch (error) {
        failCount++
        errors.push(`${entityId}: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    res.json({
      success: true,
      message: `Bulk budget update completed: ${successCount} successful, ${failCount} failed`,
      data: {
        successCount,
        failCount,
        errors: errors.length > 0 ? errors : undefined,
      },
    })
  } catch (error) {
    handleError(res, error, 'tools.bulk_update_budgets')
  }
})

export default router

