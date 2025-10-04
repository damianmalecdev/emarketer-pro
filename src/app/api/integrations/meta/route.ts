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
      // Generate Meta OAuth URL
      const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/meta/callback`
      // Use basic permissions that don't require App Review for testing
      const scope = 'public_profile,email'
      const state = session.user.id // Use user ID as state
      
      const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${process.env.META_APP_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${scope}&` +
        `state=${state}&` +
        `response_type=code`

      return NextResponse.json({ authUrl })
    }

    if (action === 'campaigns') {
      // Get user's Meta integration
      const integration = await prisma.integration.findFirst({
        where: {
          userId: session.user.id,
          platform: 'meta',
          isActive: true
        }
      })

      if (!integration?.accessToken) {
        return NextResponse.json({ error: 'Meta integration not found' }, { status: 404 })
      }

      // TODO: Implement actual Meta API call
      // For now, return mock data
      const mockCampaigns = [
        {
          id: 'meta_campaign_1',
          name: 'Meta Campaign 1',
          status: 'ACTIVE',
          spend: 1250.50,
          impressions: 45000,
          clicks: 1200,
          conversions: 45,
          revenue: 3200.00
        },
        {
          id: 'meta_campaign_2', 
          name: 'Meta Campaign 2',
          status: 'PAUSED',
          spend: 890.25,
          impressions: 32000,
          clicks: 890,
          conversions: 32,
          revenue: 2100.00
        }
      ]

      return NextResponse.json({ campaigns: mockCampaigns })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Meta integration error:', error)
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

    const { action, accessToken, accountId, accountName } = await request.json()

    if (action === 'save-token') {
      // Save Meta access token
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

      return NextResponse.json({ 
        integration,
        message: 'Meta integration saved successfully'
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Meta integration error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
