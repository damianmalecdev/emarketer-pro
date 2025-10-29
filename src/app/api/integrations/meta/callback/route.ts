// src/app/api/integrations/meta/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
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

    if (!tokenData.access_token) {
      throw new Error('No access token received')
    }

    // Get long-lived token
    const longLivedUrl = `https://graph.facebook.com/v18.0/oauth/access_token?` +
      `grant_type=fb_exchange_token` +
      `&client_id=${appId}` +
      `&client_secret=${appSecret}` +
      `&fb_exchange_token=${tokenData.access_token}`

    const longLivedResponse = await fetch(longLivedUrl)
    const longLivedData = await longLivedResponse.json()

    const accessToken = longLivedData.access_token || tokenData.access_token
    const expiresIn = longLivedData.expires_in || tokenData.expires_in

    // Fetch ad accounts from Meta API
    const accountsUrl = `https://graph.facebook.com/v21.0/me/adaccounts?` +
      `access_token=${accessToken}` +
      `&fields=id,account_id,name,account_status,currency,timezone_name,business`

    const accountsResponse = await fetch(accountsUrl)
    const accountsData = await accountsResponse.json()

    if (!accountsData.data || accountsData.data.length === 0) {
      return NextResponse.redirect(
        new URL('/dashboard/settings?error=no_ad_accounts', req.url)
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
      new URL('/dashboard/settings?success=meta_connected', req.url)
    )
  } catch (error) {
    console.error('Meta callback error:', error)
    return NextResponse.redirect(
      new URL('/dashboard/settings?error=oauth_failed', req.url)
    )
  }
}

