import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { logger } from '@/lib/logger'

export function middleware(request: NextRequest) {
  const startTime = Date.now()
  const requestId = crypto.randomUUID()

  // Add request ID to headers for tracing
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  })

  response.headers.set('X-Request-ID', requestId)

  // Log API requests
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const method = request.method
    const url = request.nextUrl.pathname
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const ip = request.headers.get('x-forwarded-for') || 'unknown'

    logger.info('API request started', {
      method,
      url,
      userAgent,
      ip,
      requestId,
    })

    // Add response logging
    response.headers.set('X-Response-Time', '0')
    
    // Override the response to add timing
    const originalResponse = response
    const newResponse = new NextResponse(originalResponse.body, {
      status: originalResponse.status,
      statusText: originalResponse.statusText,
      headers: originalResponse.headers,
    })

    // Add timing header after response
    newResponse.headers.set('X-Response-Time', `${Date.now() - startTime}`)
    
    return newResponse
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}