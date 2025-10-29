// Database Types (Prisma client types will be used in practice)
// These are for reference and additional type safety

export interface MetaAdsAccountData {
  id: string
  companyId: string
  accountId: string
  name: string
  accountStatus: number
  currency: string
  timezone: string
  accountType: 'PERSONAL' | 'BUSINESS' | 'TEST'
  accessToken?: string
  refreshToken?: string
  tokenExpiresAt?: Date
  isActive: boolean
  lastSyncAt?: Date
}

export interface MetaCampaignData {
  id: string
  accountId: string
  campaignId: string
  name: string
  status: 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED'
  objective: string
  dailyBudget?: number
  lifetimeBudget?: number
  startTime?: Date
  endTime?: Date
}

export interface MetricsData {
  impressions: bigint
  reach?: bigint
  frequency?: number
  clicks: bigint
  uniqueClicks?: bigint
  spend: number
  ctr?: number
  cpc?: number
  cpm?: number
  conversions?: number
  conversionValues?: number
  purchaseRoas?: number
}

export interface SyncLogData {
  id: string
  accountId: string
  syncType: string
  entityType?: string
  status: 'PENDING' | 'IN_PROGRESS' | 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED' | 'CANCELLED'
  startedAt: Date
  completedAt?: Date
  duration?: number
  recordsProcessed: number
  recordsCreated: number
  recordsUpdated: number
  recordsFailed: number
  error?: string
  errorDetails?: any
  triggeredBy?: string
}

