// src/app/api/integrations/meta/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const stateStr = searchParams.get('state')
  const error = searchParams.get('error')
  
  // Use NEXTAUTH_URL from env for production redirects
  const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://emarketer.pro'

  console.log('Meta callback received:', { code: !!code, state: !!stateStr, error })

  if (error) {
    console.error('Meta OAuth error:', error)
    return NextResponse.redirect(
      new URL(`/dashboard/settings?error=oauth_${error}`, baseUrl)
    )
  }

  if (!code || !stateStr) {
    console.error('Missing code or state:', { hasCode: !!code, hasState: !!stateStr })
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=oauth_failed', baseUrl)
    )
  }

  try {
    // Parse state
    let state: { userId: string; companyId: string }
    try {
      state = JSON.parse(stateStr)
    } catch (e) {
      console.error('Invalid state JSON from Meta callback:', stateStr)
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=invalid_state', baseUrl)
      )
    }
    const { userId, companyId } = state

    // Validate company access
    const membership = await prisma.membership.findUnique({
      where: {
        userId_companyId: { userId, companyId }
      }
    })

    if (!membership) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=access_denied', baseUrl)
      )
    }

    // Exchange code for access token
    const appId = process.env.META_APP_ID
    const appSecret = process.env.META_APP_SECRET
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/meta/callback`

    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `client_id=${appId}` +
      `&client_secret=${appSecret}` +
      `&code=${code}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}`

    const tokenResponse = await fetch(tokenUrl)
    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error('Meta token exchange failed:', {
        status: tokenResponse.status,
        statusText: tokenResponse.statusText,
        body: tokenData
      })
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=meta_token_exchange', baseUrl)
      )
    }

    // Get long-lived token
    const longLivedUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${appId}` +
      `&client_secret=${appSecret}` +
      `&fb_exchange_token=${tokenData.access_token}`

    const longLivedResponse = await fetch(longLivedUrl)
    const longLivedData = await longLivedResponse.json()
    if (!longLivedResponse.ok && !longLivedData.access_token) {
      console.error('Meta long-lived token exchange failed:', {
        status: longLivedResponse.status,
        statusText: longLivedResponse.statusText,
        body: longLivedData
      })
    }

    const accessToken = longLivedData.access_token || tokenData.access_token
    const expiresIn = longLivedData.expires_in || tokenData.expires_in

    // Fetch ad accounts from Meta API
    const accountsUrl = `https://graph.facebook.com/v21.0/me/adaccounts?` +
      `access_token=${accessToken}` +
      `&fields=id,account_id,name,account_status,currency,timezone_name,business`

    const accountsResponse = await fetch(accountsUrl)
    const accountsData = await accountsResponse.json()
    if (!accountsResponse.ok) {
      console.error('Meta fetch ad accounts failed:', {
        status: accountsResponse.status,
        statusText: accountsResponse.statusText,
        body: accountsData
      })
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=meta_accounts_fetch', baseUrl)
      )
    }

    if (!accountsData.data || accountsData.data.length === 0) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=no_ad_accounts', baseUrl)
      )
    }

    // Save each ad account to MetaAdsAccount table
    for (const accountData of accountsData.data) {
      await prisma.metaAdsAccount.upsert({
        where: {
          companyId_accountId: {
            companyId,
            accountId: accountData.account_id,
          }
        },
        create: {
          companyId,
          accountId: accountData.account_id,
          name: accountData.name,
          accountStatus: accountData.account_status || 1,
          currency: accountData.currency || 'USD',
          timezone: accountData.timezone_name || 'America/New_York',
          accountType: accountData.business ? 'BUSINESS' : 'PERSONAL',
          accessToken: accessToken,
          tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
          businessManagerIdRef: accountData.business?.id,
          isActive: true,
        },
        update: {
          name: accountData.name,
          accountStatus: accountData.account_status || 1,
          currency: accountData.currency || 'USD',
          timezone: accountData.timezone_name || 'America/New_York',
          accessToken: accessToken,
          tokenExpiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
          businessManagerIdRef: accountData.business?.id,
          isActive: true,
        }
      })
    }

    // Also save to old Integration table for backward compatibility
    await prisma.integration.upsert({
      where: {
        companyId_platform_accountId: {
          companyId,
          platform: 'meta',
          accountId: accountsData.data[0].account_id
        }
      },
      create: {
        companyId,
        platform: 'meta',
        accessToken: accessToken,
        refreshToken: null,
        expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
        accountId: accountsData.data[0].account_id,
        accountName: accountsData.data[0].name,
        currency: accountsData.data[0].currency,
        isActive: true
      },
      update: {
        accessToken: accessToken,
        expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
        accountName: accountsData.data[0].name,
        currency: accountsData.data[0].currency,
        isActive: true
      }
    })

    return NextResponse.redirect(
      new URL('/dashboard/settings?success=meta_connected', baseUrl)
    )
  } catch (error) {
    console.error('Meta callback error (unexpected):', error)
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=oauth_failed', baseUrl)
    )
  }
}

