// src/app/api/integrations/google-ads/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const stateStr = searchParams.get('state')
  const error = searchParams.get('error')

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=oauth_${error}`, req.url)
    )
  }

  if (!code || !stateStr) {
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=oauth_failed', req.url)
    )
  }

  try {
    // Parse state
    const state = JSON.parse(stateStr)
    const { userId, companyId } = state

    // Validate company access
    const membership = await prisma.membership.findUnique({
      where: {
        userId_companyId: { userId, companyId }
      }
    })

    if (!membership) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=access_denied', req.url)
      )
    }

    // Exchange code for tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_ADS_CLIENT_ID,
      process.env.GOOGLE_ADS_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/integrations/google-ads/callback`
    )

    const { tokens } = await oauth2Client.getToken(code)

    // Save integration to company
    await prisma.integration.upsert({
      where: {
        companyId_platform_accountId: {
          companyId,
          platform: 'google-ads',
          accountId: 'pending' // Will be updated after first sync
        }
      },
      create: {
        companyId,
        platform: 'google-ads',
        accessToken: tokens.access_token || null,
        refreshToken: tokens.refresh_token || null,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        accountId: 'pending',
        isActive: true
      },
      update: {
        accessToken: tokens.access_token || null,
        refreshToken: tokens.refresh_token || null,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        isActive: true
      }
    })

    return NextResponse.redirect(
      new URL('/dashboard/settings?success=google_ads_connected', req.url)
    )
  } catch (error) {
    console.error('Google Ads callback error:', error)
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=oauth_failed', req.url)
    )
  }
}

