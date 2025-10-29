// src/app/api/meta/data-deletion/route.ts
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

type SignedRequestPayload = {
  user_id?: string
  issued_at?: number
  // Meta may include more fields; we only rely on user_id
}

function base64UrlDecode(input: string): Buffer {
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/')
  const pad = base64.length % 4 === 0 ? 0 : 4 - (base64.length % 4)
  const padded = base64 + '='.repeat(pad)
  return Buffer.from(padded, 'base64')
}

function verifyAndParseSignedRequest(signedRequest: string, appSecret: string): SignedRequestPayload | null {
  const [encodedSig, payload] = signedRequest.split('.')
  if (!encodedSig || !payload) return null

  const expectedSig = crypto
    .createHmac('sha256', appSecret)
    .update(payload)
    .digest()

  const providedSig = base64UrlDecode(encodedSig)
  const valid = crypto.timingSafeEqual(expectedSig, providedSig)
  if (!valid) return null

  try {
    const json = base64UrlDecode(payload).toString('utf8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || ''
    let signedRequest: string | null = null

    if (contentType.includes('application/json')) {
      const body = await req.json()
      signedRequest = body?.signed_request || body?.signedRequest || null
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const form = await req.formData()
      signedRequest = (form.get('signed_request') as string) || null
    } else {
      // Try both just in case
      try {
        const body = await req.json()
        signedRequest = body?.signed_request || null
      } catch {
        const form = await req.formData()
        signedRequest = (form.get('signed_request') as string) || null
      }
    }

    if (!signedRequest) {
      return NextResponse.json({ error: 'signed_request required' }, { status: 400 })
    }

    const appSecret = process.env.META_APP_SECRET
    if (!appSecret) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const payload = verifyAndParseSignedRequest(signedRequest, appSecret)
    if (!payload || !payload.user_id) {
      return NextResponse.json({ error: 'Invalid signed_request' }, { status: 400 })
    }

    const userId = payload.user_id

    // Here you would enqueue a deletion job for userId.
    // We return a confirmation link that the dashboard can serve.
    const baseUrl = process.env.NEXTAUTH_URL || process.env.APP_URL || 'https://emarketer.pro'
    const confirmationCode = crypto.createHash('sha256').update(`meta:${userId}:${Date.now()}`).digest('hex').slice(0, 32)
    const statusUrl = `${baseUrl}/delete-account?code=${confirmationCode}`

    return NextResponse.json({
      url: statusUrl,
      confirmation_code: confirmationCode,
    })
  } catch (err) {
    console.error('Meta data deletion error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function GET() {
  // Optional no-op for health checks
  return NextResponse.json({ status: 'ok' })
}


