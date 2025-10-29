// src/app/api/integrations/google-ads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { google } from 'googleapis'

export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const companyId = searchParams.get('companyId')

  if (!companyId) {
    return NextResponse.json(
      { error: 'companyId required' }, 
      { status: 400 }
    )
  }

  if (action === 'auth-url') {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_ADS_CLIENT_ID,
      process.env.GOOGLE_ADS_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/integrations/google-ads/callback`
    )

    // CRITICAL: State MUST contain userId and companyId
    const state = JSON.stringify({
      userId: user.id,
      companyId
    })

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/adwords',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      state
    })

    return NextResponse.json({ authUrl })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

