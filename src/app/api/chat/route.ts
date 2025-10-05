import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextAuthOptions'
import { prisma } from '@/lib/prisma'
import { generateChatResponse } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { message } = await request.json()

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 })
    }

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

    // Get user's campaign data for context (last 30 days)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const campaigns = await prisma.campaign.findMany({
      where: { 
        userId: session.user.id,
        date: { gte: thirtyDaysAgo }
      },
      orderBy: { date: 'desc' },
      take: 50,
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

    // Calculate aggregate statistics
    const stats = campaigns.length > 0 ? {
      totalSpend: campaigns.reduce((sum, c) => sum + c.spend, 0),
      totalRevenue: campaigns.reduce((sum, c) => sum + c.revenue, 0),
      totalImpressions: campaigns.reduce((sum, c) => sum + c.impressions, 0),
      totalClicks: campaigns.reduce((sum, c) => sum + c.clicks, 0),
      totalConversions: campaigns.reduce((sum, c) => sum + c.conversions, 0),
      averageROAS: campaigns.reduce((sum, c) => sum + (c.roas || 0), 0) / campaigns.length,
      averageCTR: campaigns.reduce((sum, c) => sum + (c.ctr || 0), 0) / campaigns.length,
      averageCPC: campaigns.reduce((sum, c) => sum + (c.cpc || 0), 0) / campaigns.length,
      campaignsByPlatform: campaigns.reduce((acc, c) => {
        acc[c.platform] = (acc[c.platform] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    } : null

    // Build context for AI
    let context = ''
    
    if (integrations.length > 0) {
      context += `\n\nConnected platforms: ${integrations.map(i => `${i.platform} (${i.accountName || 'No name'})`).join(', ')}`
    }

    if (stats) {
      context += `\n\nCampaign Statistics (Last 30 days):
- Total Spend: $${stats.totalSpend.toFixed(2)}
- Total Revenue: $${stats.totalRevenue.toFixed(2)}
- Total ROAS: ${(stats.totalRevenue / stats.totalSpend).toFixed(2)}x
- Total Impressions: ${stats.totalImpressions.toLocaleString()}
- Total Clicks: ${stats.totalClicks.toLocaleString()}
- Total Conversions: ${stats.totalConversions}
- Average ROAS: ${stats.averageROAS.toFixed(2)}x
- Average CTR: ${stats.averageCTR.toFixed(2)}%
- Average CPC: $${stats.averageCPC.toFixed(2)}
- Campaigns by platform: ${Object.entries(stats.campaignsByPlatform).map(([p, c]) => `${p}: ${c}`).join(', ')}`
    }

    if (campaigns.length > 0) {
      context += `\n\nTop 10 Campaigns by Revenue:
${campaigns
  .sort((a, b) => b.revenue - a.revenue)
  .slice(0, 10)
  .map((c, i) => `${i + 1}. ${c.name} (${c.platform}): $${c.spend.toFixed(2)} spend → $${c.revenue.toFixed(2)} revenue (ROAS: ${(c.roas || 0).toFixed(2)}x)`)
  .join('\n')}`
    }

    if (alerts.length > 0) {
      context += `\n\nRecent Alerts:
${alerts.slice(0, 5).map((a, i) => `${i + 1}. [${a.severity}] ${a.message}`).join('\n')}`
    }

    if (!integrations.length && !campaigns.length) {
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

    return NextResponse.json({ 
      message: aiResponse,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
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
