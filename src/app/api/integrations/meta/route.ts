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
    const action = searchParams.get('action')

    if (action === 'auth-url') {
      const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/meta/callback`
      const scope = 'public_profile,email'
      const state = session.user.id
      
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${process.env.META_APP_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${scope}&` +
        `state=${state}&` +
        `response_type=code`

      return NextResponse.json({ authUrl })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Meta integration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action, accessToken, accountId, accountName } = await request.json()

    if (action === 'save-token') {
      const integration = await prisma.integration.upsert({
        where: {
          userId_platform_accountId: {
            userId: session.user.id,
            platform: 'meta',
            accountId: accountId || 'default'
          }
        },
        update: {
          accessToken,
          accountId,
          accountName,
          isActive: true
        },
        create: {
          userId: session.user.id,
          platform: 'meta',
          accessToken,
          accountId,
          accountName,
          isActive: true
        }
      })

      return NextResponse.json({ integration, message: 'Meta integration saved successfully' })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Meta integration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
