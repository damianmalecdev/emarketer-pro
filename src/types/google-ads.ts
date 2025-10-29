// Google Ads TypeScript Types
// Matching Prisma schema for frontend use

import { 
  GoogleAdsCampaignType, 
  GoogleAdsCampaignStatus, 
  GoogleAdsAdGroupType,
  GoogleAdsAdType,
  GoogleAdsKeywordMatchType,
  GoogleAdsBiddingStrategyType,
  GoogleAdsAdApprovalStatus,
  GoogleAdsAccountType
} from '@prisma/client'

// ============================================
// CUSTOMER TYPES
// ============================================

export interface GoogleAdsCustomer {
  id: string
  customerId: string
  name: string
  descriptiveName: string | null
  currency: string
  timezone: string
  accountType: GoogleAdsAccountType
  status: GoogleAdsCampaignStatus
  isActive: boolean
  canManageClients: boolean
  testAccount: boolean
  lastSyncAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface GoogleAdsCustomerSummary extends GoogleAdsCustomer {
  campaignCount: number
  activeCampaignCount: number
  totalSpend: number
  totalClicks: number
  totalImpressions: number
  totalConversions: number
}

// ============================================
// CAMPAIGN TYPES
// ============================================

export interface GoogleAdsCampaign {
  id: string
  customerId: string
  campaignId: string
  name: string
  type: GoogleAdsCampaignType
  status: GoogleAdsCampaignStatus
  budgetId: string | null
  biddingStrategyId: string | null
  targetCpa: number | null
  targetRoas: number | null
  startDate: Date | null
  endDate: Date | null
  biddingStrategyType: GoogleAdsBiddingStrategyType | null
  advertisingChannelType: string | null
  createdAt: Date
  updatedAt: Date
  lastSyncAt: Date | null
}

export interface GoogleAdsCampaignWithDetails extends GoogleAdsCampaign {
  budget?: GoogleAdsBudget | null
  biddingStrategy?: GoogleAdsBiddingStrategy | null
  adGroupCount: number
  keywordCount: number
  adCount: number
  geoTargets: GoogleAdsGeoTarget[]
  languageTargets: GoogleAdsLanguageTarget[]
  deviceTargets: GoogleAdsDeviceTarget[]
}

export interface GoogleAdsCampaignWithMetrics extends GoogleAdsCampaign {
  customerName?: string
  budget?: GoogleAdsBudget | null
  biddingStrategy?: GoogleAdsBiddingStrategy | null
  adGroupCount: number
  keywordCount: number
  metrics: CampaignMetrics | null
}

// ============================================
// AD GROUP TYPES
// ============================================

export interface GoogleAdsAdGroup {
  id: string
  customerId: string
  campaignId: string
  adGroupId: string
  name: string
  type: GoogleAdsAdGroupType | null
  status: GoogleAdsCampaignStatus
  cpcBidMicros: bigint | null
  cpmBidMicros: bigint | null
  cpvBidMicros: bigint | null
  targetCpa: number | null
  createdAt: Date
  updatedAt: Date
  lastSyncAt: Date | null
}

export interface GoogleAdsAdGroupWithCounts extends GoogleAdsAdGroup {
  adCount: number
  keywordCount: number
}

export interface GoogleAdsAdGroupWithMetrics extends GoogleAdsAdGroup {
  adCount: number
  keywordCount: number
  metrics: AdGroupMetrics | null
}

// ============================================
// AD TYPES
// ============================================

export interface GoogleAdsAd {
  id: string
  customerId: string
  campaignId: string
  adGroupId: string
  adId: string
  name: string | null
  type: GoogleAdsAdType
  status: GoogleAdsCampaignStatus
  approvalStatus: GoogleAdsAdApprovalStatus
  headlines: any
  descriptions: any
  displayUrl: string | null
  finalUrls: any
  rsaStrength: string | null
  videoId: string | null
  createdAt: Date
  updatedAt: Date
  lastSyncAt: Date | null
}

export interface GoogleAdsAdWithMetrics extends GoogleAdsAd {
  metrics: AdMetrics | null
}

// ============================================
// KEYWORD TYPES
// ============================================

export interface GoogleAdsKeyword {
  id: string
  customerId: string
  campaignId: string
  adGroupId: string
  keywordId: string
  text: string
  matchType: GoogleAdsKeywordMatchType
  status: GoogleAdsCampaignStatus
  cpcBidMicros: bigint | null
  qualityScore: number | null
  landingPageScore: string | null
  creativeScore: string | null
  expectedCtr: string | null
  createdAt: Date
  updatedAt: Date
  lastSyncAt: Date | null
}

export interface GoogleAdsKeywordWithMetrics extends GoogleAdsKeyword {
  metrics: KeywordMetrics | null
}

// ============================================
// BUDGET & BIDDING TYPES
// ============================================

export interface GoogleAdsBudget {
  id: string
  customerId: string
  budgetId: string
  name: string
  amountMicros: bigint
  deliveryMethod: string
  period: string | null
  status: GoogleAdsCampaignStatus
  explicitlyShared: boolean
  referenceCount: number | null
}

export interface GoogleAdsBiddingStrategy {
  id: string
  customerId: string
  biddingStrategyId: string
  name: string
  type: GoogleAdsBiddingStrategyType
  status: GoogleAdsCampaignStatus
  targetCpaMicros: bigint | null
  targetRoas: number | null
  targetSpendMicros: bigint | null
}

// ============================================
// TARGETING TYPES
// ============================================

export interface GoogleAdsGeoTarget {
  id: string
  campaignId: string
  geoTargetId: string
  name: string
  canonicalName: string | null
  targetType: string
  isNegative: boolean
  bidModifier: number | null
}

export interface GoogleAdsLanguageTarget {
  id: string
  campaignId: string
  languageCode: string
  languageName: string
}

export interface GoogleAdsDeviceTarget {
  id: string
  campaignId: string
  deviceType: string
  bidModifier: number
}

// ============================================
// METRICS TYPES
// ============================================

export interface BaseMetrics {
  impressions: number
  clicks: number
  cost: number
  conversions: number
  conversionValue: number
  ctr: number
  cpc: number
  cpm: number
  conversionRate: number
  roas: number
}

export interface CampaignMetrics extends BaseMetrics {
  campaignId: string
  campaignName: string
  date?: Date
  dateRange?: DateRange
}

export interface AdGroupMetrics extends BaseMetrics {
  adGroupId: string
  adGroupName: string
  date?: Date
}

export interface AdMetrics extends BaseMetrics {
  adId: string
  adName: string | null
  date?: Date
}

export interface KeywordMetrics extends BaseMetrics {
  keywordId: string
  keywordText: string
  qualityScore: number | null
  date?: Date
}

export interface TimeSeriesMetrics {
  date: Date
  impressions: number
  clicks: number
  cost: number
  conversions: number
  conversionValue: number
  ctr: number
  cpc: number
  cpm: number
  conversionRate: number
  roas: number
}

export interface AggregatedMetrics {
  totalSpend: number
  totalImpressions: number
  totalClicks: number
  totalConversions: number
  totalRevenue: number
  avgCpc: number
  avgCpm: number
  avgCtr: number
  avgConversionRate: number
  avgRoas: number
}

// ============================================
// SYNC TYPES
// ============================================

export interface SyncLog {
  id: string
  customerId: string
  syncType: string
  entityType: string | null
  status: string
  startedAt: Date
  completedAt: Date | null
  duration: number | null
  recordsProcessed: number
  recordsCreated: number
  recordsUpdated: number
  recordsFailed: number
  error: string | null
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ListResponse<T> {
  data: T[]
  total: number
  page?: number
  pageSize?: number
}

export interface DetailResponse<T> {
  data: T
}

export interface MetricsResponse {
  metrics: TimeSeriesMetrics[]
  aggregated: AggregatedMetrics
  entityType: string
  entityId: string
  dateRange: DateRange
}

export interface SyncResponse {
  success: boolean
  syncLogId: string
  summary: {
    customers: number
    campaigns: number
    adGroups: number
    ads: number
    keywords: number
    metrics: number
  }
  duration: number
}

// ============================================
// UTILITY TYPES
// ============================================

export interface DateRange {
  startDate: Date
  endDate: Date
}

export type EntityType = 'CAMPAIGN' | 'AD_GROUP' | 'AD' | 'KEYWORD'
export type MetricGranularity = 'hourly' | 'daily' | 'monthly'

export interface MetricsQueryParams {
  entityType: EntityType
  entityId: string
  customerId: string
  startDate: string
  endDate: string
  granularity?: MetricGranularity
}

// ============================================
// FILTER & SORT TYPES
// ============================================

export interface CampaignFilters {
  status?: GoogleAdsCampaignStatus[]
  type?: GoogleAdsCampaignType[]
  search?: string
}

export interface AdGroupFilters {
  status?: GoogleAdsCampaignStatus[]
  search?: string
}

export interface KeywordFilters {
  status?: GoogleAdsCampaignStatus[]
  matchType?: GoogleAdsKeywordMatchType[]
  minQualityScore?: number
  search?: string
}

export type SortDirection = 'asc' | 'desc'

export interface SortConfig {
  field: string
  direction: SortDirection
}

