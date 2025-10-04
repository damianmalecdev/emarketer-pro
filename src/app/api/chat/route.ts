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

    // Get user's recent campaign data for context
    const recentCampaigns = await prisma.campaign.findMany({
      where: { userId: session.user.id },
      orderBy: { date: 'desc' },
      take: 5,
    })

    const context = recentCampaigns.length > 0 
      ? `User's recent campaigns: ${JSON.stringify(recentCampaigns.map(c => ({
          name: c.name,
          platform: c.platform,
          spend: c.spend,
          revenue: c.revenue,
          roas: c.roas
        })))}`
      : undefined

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
