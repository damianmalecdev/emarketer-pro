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

    // Sprawdź czy są integracje Meta
    const metaIntegrations = await prisma.integration.findMany({
      where: {
        userId: session.user.id,
        platform: 'meta'
      }
    })

    const activeIntegrations = metaIntegrations.filter(i => i.isActive)

    return NextResponse.json({
      success: true,
      totalIntegrations: metaIntegrations.length,
      activeIntegrations: activeIntegrations.length,
      integrations: metaIntegrations.map(i => ({
        id: i.id,
        accountId: i.accountId,
        accountName: i.accountName,
        isActive: i.isActive,
        createdAt: i.createdAt,
        hasAccessToken: !!i.accessToken,
        accessTokenPreview: i.accessToken ? `${i.accessToken.substring(0, 10)}...` : null
      })),
      env: {
        hasMetaAppID: !!process.env.META_APP_ID,
        hasMetaAppSecret: !!process.env.META_APP_SECRET,
        nextAuthUrl: process.env.NEXTAUTH_URL
      }
    })

  } catch (error) {
    console.error('Test Meta API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

