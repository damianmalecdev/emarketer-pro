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

    // Save integration to company
    await prisma.integration.upsert({
      where: {
        companyId_platform_accountId: {
          companyId,
          platform: 'meta',
          accountId: 'pending' // Will be updated after first sync
        }
      },
      create: {
        companyId,
        platform: 'meta',
        accessToken: accessToken,
        refreshToken: null,
        expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
        accountId: 'pending',
        isActive: true
      },
      update: {
        accessToken: accessToken,
        expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000) : null,
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

