// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getChatCompletion } from '@/lib/openai'
import { prisma } from '@/lib/prisma'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { message, companyId } = await req.json()

  if (!message) {
    return NextResponse.json(
      { error: 'Message required' },
      { status: 400 }
    )
  }

  try {
    // Build context from user's data
    const context = await buildMarketingContext(user.id, companyId)

    // Get conversation history (last 10 messages)
    const history = await prisma.chatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10
    })

    const messages = [
      {
        role: 'system' as const,
        content: `You are eMarketer.pro AI Assistant, an expert marketing analytics assistant specialized in Meta Ads, Google Ads, Google Analytics, and TikTok Ads.

Current user context:
${context}

Provide actionable insights, explain metrics clearly, and help optimize campaigns. Be concise and friendly.`
      },
      ...history.reverse().map(h => ({ 
        role: h.role as 'user' | 'assistant', 
        content: h.content 
      })),
      { role: 'user' as const, content: message }
    ]

    // Call OpenAI
    const assistantMessage = await getChatCompletion(messages)

    // Save messages
    await prisma.chatMessage.createMany({
      data: [
        {
          userId: user.id,
          role: 'user',
          content: message
        },
        {
          userId: user.id,
          role: 'assistant',
          content: assistantMessage || 'I apologize, but I was unable to generate a response.'
        }
      ]
    })

    return NextResponse.json({
      message: assistantMessage,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: 'Failed to process chat message' },
      { status: 500 }
    )
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const messages = await prisma.chatMessage.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      take: 50
    })

    return NextResponse.json({ messages })
  } catch (error) {
    console.error('Error fetching messages:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

async function buildMarketingContext(userId: string, companyId?: string) {
  // Get user's companies
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { company: true }
  })

  const targetCompanyId = companyId || memberships[0]?.companyId

  if (!targetCompanyId) {
    return 'No data available yet. Connect your marketing platforms first to get insights.'
  }

  // Get integrations
  const integrations = await prisma.integration.findMany({
    where: { companyId: targetCompanyId, isActive: true },
    select: { platform: true, accountName: true }
  })

  if (integrations.length === 0) {
    return 'No platforms connected yet. Connect Google Ads, Meta, GA4, or TikTok to start analyzing your data.'
  }

  // Get last 7 days metrics
  const last7Days = new Date()
  last7Days.setDate(last7Days.getDate() - 7)

  const campaigns = await prisma.campaign.findMany({
    where: { companyId: targetCompanyId },
    include: {
      metrics: {
        where: { date: { gte: last7Days } },
        select: {
          spend: true,
          revenue: true,
          conversions: true,
          impressions: true,
          clicks: true
        }
      }
    },
    take: 10
  })

  // Aggregate metrics
  const totalMetrics = campaigns.reduce((acc, campaign) => {
    campaign.metrics.forEach(m => {
      acc.spend += m.spend
      acc.revenue += m.revenue
      acc.conversions += m.conversions
      acc.impressions += m.impressions
      acc.clicks += m.clicks
    })
    return acc
  }, { spend: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0 })

  const roas = totalMetrics.spend > 0 
    ? ((totalMetrics.revenue / totalMetrics.spend) * 100).toFixed(2)
    : '0'

  const ctr = totalMetrics.impressions > 0
    ? ((totalMetrics.clicks / totalMetrics.impressions) * 100).toFixed(2)
    : '0'

  return `
Connected Platforms: ${integrations.map(i => i.platform).join(', ')}

Last 7 Days Performance:
- Total Spend: $${totalMetrics.spend.toFixed(2)}
- Total Revenue: $${totalMetrics.revenue.toFixed(2)}
- ROAS: ${roas}%
- Conversions: ${totalMetrics.conversions.toFixed(0)}
- CTR: ${ctr}%
- Total Campaigns: ${campaigns.length}

Top Campaigns by Revenue:
${campaigns
  .filter(c => c.metrics.length > 0)
  .sort((a, b) => {
    const aRev = a.metrics.reduce((sum, m) => sum + m.revenue, 0)
    const bRev = b.metrics.reduce((sum, m) => sum + m.revenue, 0)
    return bRev - aRev
  })
  .slice(0, 5)
  .map(c => `- ${c.name}: $${c.metrics.reduce((sum, m) => sum + m.revenue, 0).toFixed(2)}`)
  .join('\n')}
`.trim()
}

