// src/app/api/integrations/meta/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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
    const appId = process.env.META_APP_ID
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/integrations/meta/callback`
    
    // CRITICAL: State MUST contain userId and companyId
    const state = JSON.stringify({
      userId: user.id,
      companyId
    })

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${appId}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&state=${encodeURIComponent(state)}` +
      `&scope=public_profile,email`

    return NextResponse.json({ authUrl })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}

