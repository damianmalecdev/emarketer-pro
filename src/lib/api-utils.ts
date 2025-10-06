import { NextResponse } from 'next/server'
import { logger } from './logger'

export interface ApiError {
  message: string
  code?: string
  details?: Record<string, unknown>
  statusCode: number
}

export class AppError extends Error {
  public readonly statusCode: number
  public readonly code?: string
  public readonly details?: Record<string, unknown>

  constructor(message: string, statusCode: number = 500, code?: string, details?: Record<string, unknown>) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.code = code
    this.details = details
  }
}

export function createErrorResponse(error: ApiError | AppError | Error, requestId?: string): NextResponse {
  let statusCode = 500
  let message = 'Internal server error'
  let code: string | undefined
  let details: Record<string, unknown> | undefined

  if (error instanceof AppError) {
    statusCode = error.statusCode
    message = error.message
    code = error.code
    details = error.details
  } else if ('statusCode' in error) {
    statusCode = error.statusCode
    message = error.message
    code = error.code
    details = error.details
  } else {
    // Generic error
    message = error.message || 'Internal server error'
  }

  // Log error
  logger.error('API Error', error as Error, { requestId })

  return NextResponse.json(
    {
      error: message,
      code,
      details,
      requestId,
      timestamp: new Date().toISOString(),
    },
    { status: statusCode }
  )
}

export function createSuccessResponse<T>(data: T, requestId?: string): NextResponse {
  return NextResponse.json({
    data,
    requestId,
    timestamp: new Date().toISOString(),
  })
}

// Common error types
export const ApiErrors = {
  UNAUTHORIZED: new AppError('Unauthorized', 401, 'UNAUTHORIZED'),
  FORBIDDEN: new AppError('Forbidden', 403, 'FORBIDDEN'),
  NOT_FOUND: new AppError('Not found', 404, 'NOT_FOUND'),
  VALIDATION_ERROR: new AppError('Validation failed', 400, 'VALIDATION_ERROR'),
  RATE_LIMIT_EXCEEDED: new AppError('Too many requests', 429, 'RATE_LIMIT_EXCEEDED'),
  INTERNAL_ERROR: new AppError('Internal server error', 500, 'INTERNAL_ERROR'),
} as const

// Utility function to handle async operations with error catching
export function withErrorHandling<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  requestId?: string
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args)
    } catch (error) {
      if (error instanceof AppError) {
        throw error
      }
      
      logger.error('Unexpected error in async operation', error as Error, { requestId })
      throw new AppError('An unexpected error occurred', 500, 'UNEXPECTED_ERROR')
    }
  }
}