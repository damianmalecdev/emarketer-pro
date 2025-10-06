import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextAuthOptions'
import { prisma } from '@/lib/prisma'
import { generateChatResponse } from '@/lib/openai'
import { chatMessageSchema, validateInput } from '@/lib/validation'
import { withRateLimit, chatRateLimit } from '@/lib/rate-limit'
import { logger } from '@/lib/logger'
import { createErrorResponse, createSuccessResponse, ApiErrors } from '@/lib/api-utils'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()
  
  try {
    // Apply rate limiting
    const rateLimitResponse = withRateLimit(chatRateLimit, 'Too many chat requests')(request)
    if (rateLimitResponse) {
      logger.warn('Rate limit exceeded for chat API', { requestId })
      return rateLimitResponse
    }

    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      logger.warn('Unauthorized chat API request', { requestId })
      return createErrorResponse(ApiErrors.UNAUTHORIZED, requestId)
    }

    logger.info('Chat API request started', { 
      userId: session.user.id, 
      requestId 
    })

    const body = await request.json()
    
    // Validate input
    const validation = validateInput(chatMessageSchema, body)
    if (!validation.success) {
      logger.warn('Chat API validation failed', { 
        errors: validation.errors, 
        userId: session.user.id, 
        requestId 
      })
      return createErrorResponse({
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: { errors: validation.errors },
        statusCode: 400
      }, requestId)
    }

    const { message } = validation.data!

    // Ensure user exists in database
    await prisma.user.upsert({
      where: { id: session.user.id },
      update: {},
      create: { 
        id: session.user.id, 
        email: session.user.email || '', 
        name: session.user.name || '' 
      }
    })

    // Save user message
    await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        role: 'user',
        content: message,
      }
    })

    // Get recent conversation history for context
    const recentMessages = await prisma.chatMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    // Get user's integrations
    const integrations = await prisma.integration.findMany({
      where: { userId: session.user.id, isActive: true },
      select: { platform: true, accountName: true }
    })

    // Get user's campaigns with recent metrics (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const campaignsWithMetrics = await prisma.campaign.findMany({
      where: { 
        userId: session.user.id,
        metrics: {
          some: {
            date: { gte: thirtyDaysAgo }
          }
        }
      },
      include: {
        metrics: {
          where: {
            date: { gte: thirtyDaysAgo }
          },
          orderBy: { date: 'desc' },
          take: 30, // Last 30 days per campaign
        }
      },
      take: 50, // Limit to 50 campaigns
    })

    // Get recent alerts (last 10)
    const alerts = await prisma.alert.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        type: true,
        severity: true,
        message: true,
        createdAt: true,
      }
    })

    // Calculate aggregate statistics from metrics
    const allMetrics = campaignsWithMetrics.flatMap(c => c.metrics)
    
    const stats = allMetrics.length > 0 ? {
      totalSpend: allMetrics.reduce((sum, m) => sum + m.spend, 0),
      totalRevenue: allMetrics.reduce((sum, m) => sum + m.revenue, 0),
      totalImpressions: allMetrics.reduce((sum, m) => sum + m.impressions, 0),
      totalClicks: allMetrics.reduce((sum, m) => sum + m.clicks, 0),
      totalConversions: allMetrics.reduce((sum, m) => sum + m.conversions, 0),
      averageROAS: allMetrics.reduce((sum, m) => sum + (m.roas || 0), 0) / allMetrics.length,
      averageCTR: allMetrics.reduce((sum, m) => sum + (m.ctr || 0), 0) / allMetrics.length,
      averageCPC: allMetrics.reduce((sum, m) => sum + (m.cpc || 0), 0) / allMetrics.length,
      averageCPA: allMetrics.reduce((sum, m) => sum + (m.cpa || 0), 0) / allMetrics.length,
      campaignsByPlatform: campaignsWithMetrics.reduce((acc, c) => {
        acc[c.platform] = (acc[c.platform] || 0) + 1
        return acc
      }, {} as Record<string, number>),
      daysWithData: new Set(allMetrics.map(m => m.date.toISOString().split('T')[0])).size
    } : null

    // Build context for AI
    let context = ''
    
    if (integrations.length > 0) {
      context += `\n\nConnected platforms: ${integrations.map(i => `${i.platform} (${i.accountName || 'No name'})`).join(', ')}`
    }

    if (stats) {
      context += `\n\nCampaign Statistics (Last 30 days, ${stats.daysWithData} days with data):
- Total Spend: $${stats.totalSpend.toFixed(2)}
- Total Revenue: $${stats.totalRevenue.toFixed(2)}
- Total ROAS: ${stats.totalSpend > 0 ? (stats.totalRevenue / stats.totalSpend).toFixed(2) : '0.00'}x
- Total Impressions: ${stats.totalImpressions.toLocaleString()}
- Total Clicks: ${stats.totalClicks.toLocaleString()}
- Total Conversions: ${stats.totalConversions.toFixed(0)}
- Average ROAS: ${stats.averageROAS.toFixed(2)}x
- Average CTR: ${stats.averageCTR.toFixed(2)}%
- Average CPC: $${stats.averageCPC.toFixed(2)}
- Average CPA: $${stats.averageCPA.toFixed(2)}
- Campaigns by platform: ${Object.entries(stats.campaignsByPlatform).map(([p, c]) => `${p}: ${c}`).join(', ')}`
    }

    if (campaignsWithMetrics.length > 0) {
      // Calculate total revenue per campaign (sum of all daily metrics)
      const campaignTotals = campaignsWithMetrics.map(campaign => {
        const totalSpend = campaign.metrics.reduce((sum, m) => sum + m.spend, 0)
        const totalRevenue = campaign.metrics.reduce((sum, m) => sum + m.revenue, 0)
        const avgROAS = campaign.metrics.reduce((sum, m) => sum + m.roas, 0) / campaign.metrics.length
        return {
          name: campaign.name,
          platform: campaign.platform,
          totalSpend,
          totalRevenue,
          avgROAS,
          daysActive: campaign.metrics.length
        }
      })

      context += `\n\nTop 10 Campaigns by Revenue (aggregated over ${campaignsWithMetrics[0]?.metrics.length || 0} days):
${campaignTotals
  .sort((a, b) => b.totalRevenue - a.totalRevenue)
  .slice(0, 10)
  .map((c, i) => `${i + 1}. ${c.name} (${c.platform}): $${c.totalSpend.toFixed(2)} spend → $${c.totalRevenue.toFixed(2)} revenue (Avg ROAS: ${c.avgROAS.toFixed(2)}x, ${c.daysActive} days active)`)
  .join('\n')}`
      
      // Add trend analysis for top campaign
      if (campaignsWithMetrics[0]?.metrics.length > 1) {
        const topCampaign = campaignTotals[0]
        const matchingCampaign = campaignsWithMetrics.find(c => c.name === topCampaign.name)
        if (matchingCampaign) {
          const recentMetrics = matchingCampaign.metrics.slice(0, 7) // Last 7 days
          const olderMetrics = matchingCampaign.metrics.slice(7, 14) // Previous 7 days
          
          if (recentMetrics.length > 0 && olderMetrics.length > 0) {
            const recentROAS = recentMetrics.reduce((sum, m) => sum + m.roas, 0) / recentMetrics.length
            const olderROAS = olderMetrics.reduce((sum, m) => sum + m.roas, 0) / olderMetrics.length
            const roasTrend = ((recentROAS - olderROAS) / olderROAS * 100).toFixed(1)
            
            context += `\n\nTrend Analysis (Top Campaign):
- ${topCampaign.name}: ROAS ${recentROAS > olderROAS ? '📈 increased' : '📉 decreased'} by ${Math.abs(parseFloat(roasTrend))}% (from ${olderROAS.toFixed(2)}x to ${recentROAS.toFixed(2)}x)`
          }
        }
      }
    }

    if (alerts.length > 0) {
      context += `\n\nRecent Alerts:
${alerts.slice(0, 5).map((a, i) => `${i + 1}. [${a.severity}] ${a.message}`).join('\n')}`
    }

    if (!integrations.length && !campaignsWithMetrics.length) {
      context += '\n\nNote: User has not connected any advertising platforms yet. Suggest connecting Meta Ads, Google Ads, or GA4 in Settings.'
    }

    // Prepare messages for OpenAI
    const messages = recentMessages
      .reverse()
      .map(msg => ({
        role: msg.role,
        content: msg.content
      }))

    // Generate AI response
    const aiResponse = await generateChatResponse(messages, context)

    // Save AI response
    await prisma.chatMessage.create({
      data: {
        userId: session.user.id,
        role: 'assistant',
        content: aiResponse,
      }
    })

    const duration = Date.now() - startTime
    logger.info('Chat API request completed successfully', { 
      userId: session.user.id, 
      requestId,
      duration: `${duration}ms`
    })

    return createSuccessResponse({ 
      message: aiResponse,
    }, requestId)

  } catch (error) {
    const duration = Date.now() - startTime
    logger.error('Chat API error', error as Error, { 
      requestId
    })
    return createErrorResponse(ApiErrors.INTERNAL_ERROR, requestId)
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')

    const messages = await prisma.chatMessage.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ messages: messages.reverse() })

  } catch (error) {
    console.error('Get chat messages error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
