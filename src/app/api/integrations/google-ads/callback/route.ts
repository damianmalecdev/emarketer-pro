import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state') // user ID
    const error = searchParams.get('error')

    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=${error}`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=missing_params`)
    }

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
        client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/integrations/google-ads/callback`,
        grant_type: 'authorization_code'
      })
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('Google Ads token error:', tokenData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=token_exchange_failed`)
    }

    // Save integration
    await prisma.integration.upsert({
      where: {
        userId_platform_accountId: {
          userId: state,
          platform: 'google-ads',
          accountId: 'default'
        }
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        accountName: 'Google Ads Account',
        isActive: true
      },
      create: {
        userId: state,
        platform: 'google-ads',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        accountId: 'default',
        accountName: 'Google Ads Account',
        isActive: true
      }
    })

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?success=google-ads-connected`)

  } catch (error) {
    console.error('Google Ads callback error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=callback_failed`)
  }
}
