import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET || 'your-secret-key-change-in-production'

    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const res = await fetch(`${process.env.NEXTAUTH_URL}/api/cron/sync-all`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${cronSecret}` },
    })

    const data = await res.json()
    return NextResponse.json({ ok: res.ok, data }, { status: res.status })
  } catch (error) {
    console.error('Cron run error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}


