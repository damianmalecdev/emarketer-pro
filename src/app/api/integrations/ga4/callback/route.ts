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

    // Ensure user exists
    await prisma.user.upsert({
      where: { id: state },
      update: {},
      create: { id: state, email: '', name: '' }
    })

    // Exchange code for access token
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GA4_CLIENT_ID || process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GA4_CLIENT_SECRET || process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/integrations/ga4/callback`,
        grant_type: 'authorization_code'
      })
    })

    const tokenData = await tokenResponse.json()

    if (!tokenResponse.ok) {
      console.error('GA4 token error:', tokenData)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=token_exchange_failed`)
    }

    // Get GA4 properties (accounts)
    let propertyId = 'default'
    let propertyName = 'GA4 Property'
    
    try {
      const propertiesResponse = await fetch(
        'https://analyticsadmin.googleapis.com/v1beta/properties',
        {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      if (propertiesResponse.ok) {
        const propertiesData = await propertiesResponse.json()
        if (propertiesData.properties && propertiesData.properties.length > 0) {
          const firstProperty = propertiesData.properties[0]
          propertyId = firstProperty.name.split('/').pop() // Extract ID from "properties/123456"
          propertyName = firstProperty.displayName || 'GA4 Property'
        }
      }
    } catch (e) {
      console.log('Could not fetch GA4 properties, using default')
    }

    // Save integration
    await prisma.integration.upsert({
      where: {
        userId_platform_accountId: {
          userId: state,
          platform: 'ga4',
          accountId: propertyId
        }
      },
      update: {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_in 
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        accountName: propertyName,
        isActive: true
      },
      create: {
        userId: state,
        platform: 'ga4',
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: tokenData.expires_in 
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : null,
        accountId: propertyId,
        accountName: propertyName,
        isActive: true
      }
    })

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?success=ga4-connected`)

  } catch (error) {
    console.error('GA4 callback error:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/settings?error=callback_failed`)
  }
}

