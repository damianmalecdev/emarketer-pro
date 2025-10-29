import { Router } from 'express'
import { PrismaClient } from '@prisma/client'
import { MetaAPIService } from '../services/meta-api.service'
import { handleError } from '../utils/error-handler'
import { cacheService } from '../services/cache.service'
import { validateObjective, validateBudget } from '../utils/validators'
import type { CampaignCreateParams } from '../types/mcp.types'

const router = Router()
const prisma = new PrismaClient()

// POST /tools/create_campaign - Create new campaign
router.post('/create_campaign', async (req, res) => {
  try {
    const params: CampaignCreateParams = req.body

    if (!params.accountId || !params.name || !params.objective) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: accountId, name, objective',
      })
    }

    if (!validateObjective(params.objective)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid objective',
      })
    }

    if (params.dailyBudget && !validateBudget(params.dailyBudget)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid daily budget',
      })
    }

    // Get account to get access token
    const account = await prisma.metaAdsAccount.findUnique({
      where: { id: params.accountId },
    })

    if (!account || !account.accessToken) {
      return res.status(404).json({
        success: false,
        error: 'Account not found or missing access token',
      })
    }

    // Create campaign via Meta API
    const api = new MetaAPIService({
      accessToken: account.accessToken,
      accountId: account.accountId,
    })

    const result = await api.createCampaign(account.accountId, {
      name: params.name,
      objective: params.objective,
      status: params.status || 'PAUSED',
      special_ad_categories: params.specialAdCategories,
      buying_type: params.buyingType,
      daily_budget: params.dailyBudget,
      lifetime_budget: params.lifetimeBudget,
      start_time: params.startTime,
      stop_time: params.endTime,
    })

    // Save to database
    const campaign = await prisma.metaCampaign.create({
      data: {
        accountId: params.accountId,
        campaignId: result.id,
        name: params.name,
        status: params.status || 'PAUSED',
        objective: params.objective as any,
        specialAdCategories: params.specialAdCategories,
        buyingType: params.buyingType as any,
        dailyBudget: params.dailyBudget,
        lifetimeBudget: params.lifetimeBudget,
        startTime: params.startTime ? new Date(params.startTime) : undefined,
        endTime: params.endTime ? new Date(params.endTime) : undefined,
      },
    })

    // Log change history
    await prisma.metaChangeHistory.create({
      data: {
        accountId: params.accountId,
        entityType: 'CAMPAIGN',
        entityId: campaign.id,
        changeType: 'CREATE',
        changedBy: 'MCP',
        changedVia: 'MCP',
        metadata: params,
      },
    })

    // Invalidate cache
    await cacheService.invalidatePattern(`campaigns:account:${params.accountId}`)

    res.json({
      success: true,
      data: campaign,
      message: 'Campaign created successfully',
    })
  } catch (error) {
    handleError(res, error, 'tools.create_campaign')
  }
})

// POST /tools/update_campaign - Update campaign
router.post('/update_campaign', async (req, res) => {
  try {
    const { campaignId, ...updates } = req.body

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        error: 'Missing campaignId',
      })
    }

    // Get campaign
    const campaign = await prisma.metaCampaign.findUnique({
      where: { id: campaignId },
      include: { account: true },
    })

    if (!campaign || !campaign.account.accessToken) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found or missing access token',
      })
    }

    // Update via Meta API
    const api = new MetaAPIService({
      accessToken: campaign.account.accessToken,
      accountId: campaign.account.accountId,
    })

    await api.updateCampaign(campaign.campaignId, updates)

    // Update in database
    const updated = await prisma.metaCampaign.update({
      where: { id: campaignId },
      data: {
        ...updates,
        updatedAt: new Date(),
      },
    })

    // Log change history
    for (const [field, newValue] of Object.entries(updates)) {
      await prisma.metaChangeHistory.create({
        data: {
          accountId: campaign.accountId,
          entityType: 'CAMPAIGN',
          entityId: campaignId,
          changeType: 'UPDATE',
          fieldName: field,
          oldValue: String((campaign as any)[field] || ''),
          newValue: String(newValue),
          changedBy: 'MCP',
          changedVia: 'MCP',
        },
      })
    }

    // Invalidate cache
    await cacheService.invalidateResource('CAMPAIGN', campaignId)

    res.json({
      success: true,
      data: updated,
      message: 'Campaign updated successfully',
    })
  } catch (error) {
    handleError(res, error, 'tools.update_campaign')
  }
})

// POST /tools/pause_campaign - Pause campaign
router.post('/pause_campaign', async (req, res) => {
  try {
    const { campaignId } = req.body

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        error: 'Missing campaignId',
      })
    }

    const campaign = await prisma.metaCampaign.findUnique({
      where: { id: campaignId },
      include: { account: true },
    })

    if (!campaign || !campaign.account.accessToken) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      })
    }

    // Pause via Meta API
    const api = new MetaAPIService({
      accessToken: campaign.account.accessToken,
      accountId: campaign.account.accountId,
    })

    await api.updateCampaign(campaign.campaignId, { status: 'PAUSED' })

    // Update in database
    await prisma.metaCampaign.update({
      where: { id: campaignId },
      data: { status: 'PAUSED' },
    })

    // Log change
    await prisma.metaChangeHistory.create({
      data: {
        accountId: campaign.accountId,
        entityType: 'CAMPAIGN',
        entityId: campaignId,
        changeType: 'UPDATE',
        fieldName: 'status',
        oldValue: campaign.status,
        newValue: 'PAUSED',
        changedBy: 'MCP',
        changedVia: 'MCP',
      },
    })

    await cacheService.invalidateResource('CAMPAIGN', campaignId)

    res.json({
      success: true,
      message: 'Campaign paused successfully',
    })
  } catch (error) {
    handleError(res, error, 'tools.pause_campaign')
  }
})

// POST /tools/resume_campaign - Resume campaign
router.post('/resume_campaign', async (req, res) => {
  try {
    const { campaignId } = req.body

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        error: 'Missing campaignId',
      })
    }

    const campaign = await prisma.metaCampaign.findUnique({
      where: { id: campaignId },
      include: { account: true },
    })

    if (!campaign || !campaign.account.accessToken) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      })
    }

    // Resume via Meta API
    const api = new MetaAPIService({
      accessToken: campaign.account.accessToken,
      accountId: campaign.account.accountId,
    })

    await api.updateCampaign(campaign.campaignId, { status: 'ACTIVE' })

    // Update in database
    await prisma.metaCampaign.update({
      where: { id: campaignId },
      data: { status: 'ACTIVE' },
    })

    // Log change
    await prisma.metaChangeHistory.create({
      data: {
        accountId: campaign.accountId,
        entityType: 'CAMPAIGN',
        entityId: campaignId,
        changeType: 'UPDATE',
        fieldName: 'status',
        oldValue: campaign.status,
        newValue: 'ACTIVE',
        changedBy: 'MCP',
        changedVia: 'MCP',
      },
    })

    await cacheService.invalidateResource('CAMPAIGN', campaignId)

    res.json({
      success: true,
      message: 'Campaign resumed successfully',
    })
  } catch (error) {
    handleError(res, error, 'tools.resume_campaign')
  }
})

// POST /tools/delete_campaign - Delete (archive) campaign
router.post('/delete_campaign', async (req, res) => {
  try {
    const { campaignId } = req.body

    if (!campaignId) {
      return res.status(400).json({
        success: false,
        error: 'Missing campaignId',
      })
    }

    const campaign = await prisma.metaCampaign.findUnique({
      where: { id: campaignId },
      include: { account: true },
    })

    if (!campaign || !campaign.account.accessToken) {
      return res.status(404).json({
        success: false,
        error: 'Campaign not found',
      })
    }

    // Delete via Meta API
    const api = new MetaAPIService({
      accessToken: campaign.account.accessToken,
      accountId: campaign.account.accountId,
    })

    await api.deleteCampaign(campaign.campaignId)

    // Update status in database
    await prisma.metaCampaign.update({
      where: { id: campaignId },
      data: { status: 'DELETED' },
    })

    // Log change
    await prisma.metaChangeHistory.create({
      data: {
        accountId: campaign.accountId,
        entityType: 'CAMPAIGN',
        entityId: campaignId,
        changeType: 'DELETE',
        changedBy: 'MCP',
        changedVia: 'MCP',
      },
    })

    await cacheService.invalidateResource('CAMPAIGN', campaignId)

    res.json({
      success: true,
      message: 'Campaign deleted successfully',
    })
  } catch (error) {
    handleError(res, error, 'tools.delete_campaign')
  }
})

export default router

