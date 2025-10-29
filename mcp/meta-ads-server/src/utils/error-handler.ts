import { Response } from 'express'
import { logger } from './logger'
import { MetaError } from '../types/meta-api.types'

export class MetaAPIError extends Error {
  code: number
  subcode?: number
  type: string
  fbtraceId: string

  constructor(error: MetaError['error']) {
    super(error.message)
    this.name = 'MetaAPIError'
    this.code = error.code
    this.subcode = error.error_subcode
    this.type = error.type
    this.fbtraceId = error.fbtrace_id
  }
}

export function handleError(res: Response, error: unknown, context?: string) {
  logger.error(`Error${context ? ` in ${context}` : ''}`, { error })

  if (error instanceof MetaAPIError) {
    return res.status(400).json({
      success: false,
      error: 'Meta API Error',
      message: error.message,
      details: {
        code: error.code,
        subcode: error.subcode,
        type: error.type,
        fbtraceId: error.fbtraceId,
      },
    })
  }

  if (error instanceof Error) {
    return res.status(500).json({
      success: false,
      error: error.name,
      message: error.message,
    })
  }

  return res.status(500).json({
    success: false,
    error: 'Unknown error',
    message: String(error),
  })
}

export function isMetaRateLimitError(error: unknown): boolean {
  if (error instanceof MetaAPIError) {
    return error.code === 4 || error.code === 17 || error.code === 32
  }
  return false
}

export function isMetaAuthError(error: unknown): boolean {
  if (error instanceof MetaAPIError) {
    return error.code === 190 || error.code === 102
  }
  return false
}

