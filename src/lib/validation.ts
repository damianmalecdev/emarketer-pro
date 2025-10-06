import { z } from 'zod'

// User validation schemas
export const userRegistrationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(1, 'Name is required').max(255, 'Name too long'),
})

export const userLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// Integration validation schemas
export const integrationSchema = z.object({
  platform: z.enum(['meta', 'google-ads', 'ga4']),
  accessToken: z.string().min(1, 'Access token is required'),
  accountId: z.string().min(1, 'Account ID is required'),
  accountName: z.string().optional(),
})

// Campaign validation schemas
export const campaignSchema = z.object({
  name: z.string().min(1, 'Campaign name is required').max(255, 'Campaign name too long'),
  platform: z.enum(['meta', 'google-ads', 'ga4']),
  platformCampaignId: z.string().min(1, 'Platform campaign ID is required'),
  status: z.string().optional(),
})

export const campaignMetricsSchema = z.object({
  date: z.date(),
  spend: z.number().min(0, 'Spend must be non-negative'),
  impressions: z.number().int().min(0, 'Impressions must be non-negative'),
  clicks: z.number().int().min(0, 'Clicks must be non-negative'),
  conversions: z.number().min(0, 'Conversions must be non-negative'),
  revenue: z.number().min(0, 'Revenue must be non-negative'),
  ctr: z.number().min(0).max(100, 'CTR must be between 0 and 100'),
  cpc: z.number().min(0, 'CPC must be non-negative'),
  roas: z.number().min(0, 'ROAS must be non-negative'),
  cpa: z.number().min(0, 'CPA must be non-negative'),
})

// Chat validation schemas
export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(2000, 'Message too long'),
})

// Alert validation schemas
export const alertSchema = z.object({
  message: z.string().min(1, 'Alert message is required').max(500, 'Alert message too long'),
  type: z.enum(['info', 'warning', 'error', 'success']),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  metadata: z.record(z.string(), z.unknown()).optional(),
})

// Report validation schemas
export const reportSchema = z.object({
  title: z.string().min(1, 'Report title is required').max(255, 'Title too long'),
  type: z.enum(['weekly', 'monthly', 'custom']),
  period: z.string().min(1, 'Period is required'),
  summary: z.string().optional(),
})

// API request validation schemas
export const apiRequestSchema = z.object({
  limit: z.number().int().min(1).max(100).optional().default(50),
  offset: z.number().int().min(0).optional().default(0),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
})

// Utility functions
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean
  data?: T
  errors?: string[]
} {
  try {
    const result = schema.parse(data)
    return { success: true, data: result }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.issues.map(err => `${err.path.join('.')}: ${err.message}`)
      }
    }
    return {
      success: false,
      errors: ['Validation failed']
    }
  }
}

export function validateRequestBody<T>(schema: z.ZodSchema<T>) {
  return (data: unknown) => validateInput(schema, data)
}