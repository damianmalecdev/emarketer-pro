import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { validateCompanyAccess } from '@/lib/permissions'

async function getAccessToken(companyId: string) {
  const integ = await prisma.integration.findFirst({ where: { companyId, platform: 'meta', isActive: true } })
  return integ?.accessToken || null
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get('companyId')
    const accountId = searchParams.get('accountId')
    const since = searchParams.get('since')
    const until = searchParams.get('until')
    if (!companyId || !accountId || !since || !until) {
      return NextResponse.json({ error: 'companyId, accountId, since, until required' }, { status: 400 })
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const ok = await validateCompanyAccess(user.id, companyId)
    if (!ok) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const token = await getAccessToken(companyId)
    if (!token) return NextResponse.json({ metrics: {} })

    const url = new URL('http://localhost:8921/tools/insights')
    url.searchParams.set('access_token', token)
    url.searchParams.set('account_id', accountId)
    url.searchParams.set('since', since)
    url.searchParams.set('until', until)
    const r = await fetch(url.toString())
    const data = await r.json()
    if (!r.ok) return NextResponse.json({ error: data?.error || 'MCP error' }, { status: 502 })
    return NextResponse.json({ metrics: data.metrics || {} })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}


