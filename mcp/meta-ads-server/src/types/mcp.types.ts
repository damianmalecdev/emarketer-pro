// MCP Server Types

export interface MCPResourceRequest {
  company_id?: string
  account_id?: string
  resource_id?: string
  limit?: number
  offset?: number
}

export interface MCPToolRequest {
  account_id: string
  [key: string]: any
}

export interface MCPResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface SyncOptions {
  accountId: string
  syncType: 'FULL' | 'INCREMENTAL' | 'METRICS'
  entityTypes?: string[]
  dateRange?: {
    since: string
    until: string
  }
  triggeredBy: 'USER' | 'CRON' | 'API' | 'MCP'
}

export interface MetricsQuery {
  accountId: string
  entityType: 'CAMPAIGN' | 'ADSET' | 'AD'
  entityIds?: string[]
  dateStart: string
  dateEnd: string
  level?: 'account' | 'campaign' | 'adset' | 'ad'
  breakdowns?: string[]
  timeIncrement?: number | 'all_days' | 'monthly'
}

export interface CampaignCreateParams {
  accountId: string
  name: string
  objective: string
  status?: 'ACTIVE' | 'PAUSED'
  specialAdCategories?: string[]
  buyingType?: 'AUCTION' | 'RESERVED'
  dailyBudget?: number
  lifetimeBudget?: number
  startTime?: string
  endTime?: string
}

export interface AdSetCreateParams {
  campaignId: string
  name: string
  optimizationGoal: string
  billingEvent: string
  bidAmount?: number
  bidStrategy?: string
  dailyBudget?: number
  lifetimeBudget?: number
  startTime?: string
  endTime?: string
  targeting: any
  attributionSpec?: any[]
}

export interface AdCreateParams {
  adSetId: string
  name: string
  creativeId: string
  status?: 'ACTIVE' | 'PAUSED'
  trackingSpecs?: any[]
}

export interface BulkStatusUpdate {
  entityType: 'CAMPAIGN' | 'ADSET' | 'AD'
  entityIds: string[]
  status: 'ACTIVE' | 'PAUSED'
}

export interface BulkBudgetUpdate {
  entityType: 'CAMPAIGN' | 'ADSET'
  entityIds: string[]
  budgetType: 'DAILY' | 'LIFETIME'
  budgetAmount: number
}

