import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // This should be the user ID
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=meta_auth_failed`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=meta_auth_invalid`)
    }

    // Ensure user exists
    await prisma.user.upsert({
      where: { id: state },
      update: {},
      create: { id: state, email: '', name: '' }
    })

    // Exchange code for access token
    const tokenResponse = await fetch('https://graph.facebook.com/v18.0/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.META_APP_ID!,
        client_secret: process.env.META_APP_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/integrations/meta/callback`,
        code: code,
      }),
    })

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=meta_token_failed`)
    }

    // Get user's ad accounts
    const accountsResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/adaccounts?access_token=${tokenData.access_token}`
    )
    const accountsData = await accountsResponse.json()

    // Save the integration
    const integration = await prisma.integration.upsert({
      where: {
        userId_platform_accountId: {
          userId: state,
          platform: 'meta',
          accountId: accountsData.data?.[0]?.id || 'default'
        }
      },
      update: {
        accessToken: tokenData.access_token,
        accountId: accountsData.data?.[0]?.id || 'default',
        accountName: accountsData.data?.[0]?.name || 'Meta Ads Account',
        isActive: true
      },
      create: {
        userId: state,
        platform: 'meta',
        accessToken: tokenData.access_token,
        accountId: accountsData.data?.[0]?.id || 'default',
        accountName: accountsData.data?.[0]?.name || 'Meta Ads Account',
        isActive: true
      }
    })

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?success=meta_connected`)

  } catch (error) {
    console.error('Meta OAuth callback error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=meta_callback_failed`)
  }
}
