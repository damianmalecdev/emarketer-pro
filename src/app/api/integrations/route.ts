import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextAuthOptions'
import { prisma } from '@/lib/prisma'
import { integrationSchema, validateInput } from '@/lib/validation'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const integrations = await prisma.integration.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json({ integrations })

  } catch (error) {
    console.error('Get integrations error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    
    // Validate input
    const validation = validateInput(integrationSchema, body)
    if (!validation.success) {
      return NextResponse.json({ 
        error: 'Validation failed', 
        details: validation.errors 
      }, { status: 400 })
    }

    const { platform, accessToken, accountId, accountName } = validation.data!

    // Check if integration already exists
    const existingIntegration = await prisma.integration.findFirst({
      where: {
        userId: session.user.id,
        platform,
        accountId
      }
    })

    if (existingIntegration) {
      return NextResponse.json({ 
        error: 'Integration already exists for this account' 
      }, { status: 400 })
    }

    const integration = await prisma.integration.create({
      data: {
        userId: session.user.id,
        platform,
        accessToken,
        accountId,
        accountName,
        isActive: true
      }
    })

    return NextResponse.json({ 
      integration,
      message: 'Integration added successfully'
    })

  } catch (error) {
    console.error('Add integration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const integrationId = searchParams.get('id')

    if (!integrationId) {
      return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 })
    }

    await prisma.integration.delete({
      where: {
        id: integrationId,
        userId: session.user.id
      }
    })

    return NextResponse.json({ message: 'Integration removed successfully' })

  } catch (error) {
    console.error('Delete integration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
