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
    console.log('🔍 Google Ads callback started')
    console.log('🔍 Code:', code)
    console.log('🔍 State:', stateStr)
    
    // Parse state
    const state = JSON.parse(stateStr)
    const { userId, companyId } = state
    console.log('🔍 Parsed state:', { userId, companyId })

    // Validate company access
    const membership = await prisma.membership.findUnique({
      where: {
        userId_companyId: { userId, companyId }
      }
    })

    if (!membership) {
      console.log('❌ No membership found for user:', userId, 'company:', companyId)
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=access_denied', req.url)
      )
    }

    console.log('✅ Membership found:', membership.id)

    // Exchange code for tokens
    console.log('🔍 Creating OAuth2 client...')
    const baseUrl =
      process.env.NEXTAUTH_URL ||
      process.env.APP_URL ||
      new URL(req.url).origin
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_ADS_CLIENT_ID,
      process.env.GOOGLE_ADS_CLIENT_SECRET,
      `${baseUrl}/api/integrations/google-ads/callback`
    )

    console.log('🔍 Exchanging code for tokens...')
    const { tokens } = await oauth2Client.getToken(code)
    console.log('✅ Tokens received:', { 
      access_token: tokens.access_token ? 'present' : 'missing',
      refresh_token: tokens.refresh_token ? 'present' : 'missing',
      expiry_date: tokens.expiry_date
    })

    // Save integration to company
    console.log('🔍 Saving integration to database...')
    const integration = await prisma.integration.upsert({
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
    console.log('✅ Integration saved:', integration.id)

    return NextResponse.redirect(
      new URL('/dashboard/settings?success=google_ads_connected', req.url)
    )
  } catch (error) {
    console.error('❌ Google Ads callback error:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=oauth_failed', req.url)
    )
  }
}

