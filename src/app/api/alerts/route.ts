import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextAuthOptions'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const whereClause: any = { userId: session.user.id }
    if (unreadOnly) {
      whereClause.isRead = false
    }

    const alerts = await prisma.alert.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ alerts })

  } catch (error) {
    console.error('Get alerts error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { alertId, isRead } = await request.json()

    if (!alertId) {
      return NextResponse.json({ error: 'Alert ID is required' }, { status: 400 })
    }

    const alert = await prisma.alert.update({
      where: {
        id: alertId,
        userId: session.user.id
      },
      data: { isRead }
    })

    return NextResponse.json({ alert })

  } catch (error) {
    console.error('Update alert error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Function to create alerts (called by other services)
export async function createAlert(
  userId: string, 
  message: string, 
  type: string, 
  severity: string = 'medium',
  metadata?: any
) {
  try {
    const alert = await prisma.alert.create({
      data: {
        userId,
        message,
        type,
        severity,
        metadata
      }
    })
    return alert
  } catch (error) {
    console.error('Create alert error:', error)
    throw error
  }
}
