import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextAuthOptions'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')

    if (action === 'auth-url') {
      const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/google-ads/callback`
      const scope = 'https://www.googleapis.com/auth/adwords'
      const state = session.user.id
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${process.env.GOOGLE_ADS_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `state=${state}&` +
        `response_type=code&` +
        `access_type=offline&` +
        `prompt=consent`

      return NextResponse.json({ authUrl })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Google Ads integration error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
