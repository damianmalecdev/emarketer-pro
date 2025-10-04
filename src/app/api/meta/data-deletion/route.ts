import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { signed_request } = body

    if (!signed_request) {
      return NextResponse.json(
        { error: 'Missing signed_request parameter' },
        { status: 400 }
      )
    }

    const [encodedSig, payload] = signed_request.split('.')
    const data = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'))
    
    const userId = data.user_id
    const appId = data.app_id

    if (appId !== process.env.META_APP_ID) {
      return NextResponse.json({ error: 'Invalid app ID' }, { status: 400 })
    }

    await prisma.integration.deleteMany({
      where: { platform: 'meta' }
    })

    const confirmationCode = `emarketer_deletion_${Date.now()}_${userId}`
    
    console.log('Meta data deletion:', { userId, confirmationCode })

    return NextResponse.json({
      url: `${process.env.NEXTAUTH_URL}/data-deletion-status?id=${confirmationCode}`,
      confirmation_code: confirmationCode
    })

  } catch (error) {
    console.error('Meta data deletion error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const confirmationCode = searchParams.get('id')

  return NextResponse.json({
    message: 'Data deletion completed',
    confirmationCode,
    status: 'deleted'
  })
}
