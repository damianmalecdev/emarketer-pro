import { NextRequest } from 'next/server'

interface RateLimitConfig {
  limit: number
  windowMs: number
  keyGenerator?: (req: NextRequest) => string
}

interface RateLimitEntry {
  count: number
  resetTime: number
}

// In-memory store for rate limiting
// In production, use Redis or similar
const rateLimitStore = new Map<string, RateLimitEntry>()

export function createRateLimit(config: RateLimitConfig) {
  const { limit, windowMs, keyGenerator = defaultKeyGenerator } = config

  return (req: NextRequest): { success: boolean; remaining: number; resetTime: number } => {
    const key = keyGenerator(req)
    const now = Date.now()
    // const windowStart = now - windowMs // Not used in current implementation

    // Clean up expired entries
    for (const [k, v] of rateLimitStore.entries()) {
      if (v.resetTime < now) {
        rateLimitStore.delete(k)
      }
    }

    const entry = rateLimitStore.get(key)
    
    if (!entry) {
      // First request
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return {
        success: true,
        remaining: limit - 1,
        resetTime: now + windowMs
      }
    }

    if (entry.resetTime < now) {
      // Window expired, reset
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + windowMs
      })
      return {
        success: true,
        remaining: limit - 1,
        resetTime: now + windowMs
      }
    }

    if (entry.count >= limit) {
      // Rate limit exceeded
      return {
        success: false,
        remaining: 0,
        resetTime: entry.resetTime
      }
    }

    // Increment counter
    entry.count++
    rateLimitStore.set(key, entry)

    return {
      success: true,
      remaining: limit - entry.count,
      resetTime: entry.resetTime
    }
  }
}

function defaultKeyGenerator(req: NextRequest): string {
  // Use IP address as default key
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0] : '127.0.0.1'
  return ip
}

// Predefined rate limiters
export const chatRateLimit = createRateLimit({
  limit: 10, // 10 requests
  windowMs: 60 * 1000, // per minute
})

export const apiRateLimit = createRateLimit({
  limit: 100, // 100 requests
  windowMs: 60 * 1000, // per minute
})

export const authRateLimit = createRateLimit({
  limit: 5, // 5 requests
  windowMs: 15 * 60 * 1000, // per 15 minutes
})

// Middleware helper
export function withRateLimit(
  rateLimiter: ReturnType<typeof createRateLimit>,
  message: string = 'Too many requests'
) {
  return (req: NextRequest) => {
    const result = rateLimiter(req)
    
    if (!result.success) {
      return new Response(
        JSON.stringify({ 
          error: message,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((result.resetTime - Date.now()) / 1000).toString(),
            'X-RateLimit-Limit': '10',
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': result.resetTime.toString(),
          }
        }
      )
    }

    return null
  }
}