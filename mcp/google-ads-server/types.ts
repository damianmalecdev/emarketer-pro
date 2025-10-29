/**
 * Google Ads MCP Server Types
 * TypeScript type definitions for Google Ads API integration
 */

// ============================================
// Customer Types
// ============================================

export interface GoogleAdsCustomerInfo {
  id: string
  resourceName?: string
  descriptiveName?: string
  currencyCode?: string
  timeZone?: string
  trackingUrlTemplate?: string
  finalUrlSuffix?: string
  autoTaggingEnabled?: boolean
  hasPartnersBadge?: boolean
  manager?: boolean
  testAccount?: boolean
}

export interface GoogleAdsAccountHierarchy {
  parentCustomerId: string
  childCustomerId: string
  level: number
}

// ============================================
// Campaign Types
// ============================================

export type GoogleAdsCampaignType =
  | 'SEARCH'
  | 'DISPLAY'
  | 'VIDEO'
  | 'SHOPPING'
  | 'PERFORMANCE_MAX'
  | 'DISCOVERY'
  | 'APP'
  | 'LOCAL'
  | 'SMART'
  | 'HOTEL'
  | 'UNKNOWN'

export type GoogleAdsCampaignStatus =
  | 'ENABLED'
  | 'PAUSED'
  | 'REMOVED'
  | 'UNKNOWN'

export interface GoogleAdsCampaignInfo {
  id: string
  resourceName?: string
  name: string
  status: GoogleAdsCampaignStatus | string
  type: GoogleAdsCampaignType | string
  startDate?: string
  endDate?: string
  budgetId?: string
  biddingStrategyType?: string
  targetCpa?: number
  targetRoas?: number
  advertisingChannelType?: string
  advertisingChannelSubType?: string
}

export interface GoogleAdsCampaignData {
  id?: string
  name: string
  type: GoogleAdsCampaignType | string
  status?: GoogleAdsCampaignStatus | string
  budgetId?: string
  biddingStrategyType?: string
  targetCpa?: number
  targetRoas?: number
  startDate?: string
  endDate?: string
  geoTargets?: string[]
  languages?: string[]
  networkSettings?: {
    targetGoogleSearch?: boolean
    targetSearchNetwork?: boolean
    targetContentNetwork?: boolean
  }
}

// ============================================
// Ad Group Types
// ============================================

export type GoogleAdsAdGroupType =
  | 'SEARCH_STANDARD'
  | 'DISPLAY_STANDARD'
  | 'SHOPPING_PRODUCT_ADS'
  | 'VIDEO_TRUE_VIEW_IN_STREAM'
  | 'HOTEL_ADS'
  | 'UNKNOWN'

export interface GoogleAdsAdGroupInfo {
  id: string
  resourceName?: string
  name: string
  status: GoogleAdsCampaignStatus | string
  type?: GoogleAdsAdGroupType | string
  campaignId: string
  cpcBidMicros?: number
  cpmBidMicros?: number
  cpvBidMicros?: number
  targetCpa?: number
}

export interface GoogleAdsAdGroupData {
  id?: string
  name: string
  campaignId: string
  status?: GoogleAdsCampaignStatus | string
  type?: GoogleAdsAdGroupType | string
  cpcBidMicros?: number
  targetCpa?: number
}

// ============================================
// Ad Types
// ============================================

export type GoogleAdsAdType =
  | 'TEXT_AD'
  | 'EXPANDED_TEXT_AD'
  | 'RESPONSIVE_SEARCH_AD'
  | 'RESPONSIVE_DISPLAY_AD'
  | 'VIDEO_AD'
  | 'SHOPPING_PRODUCT_AD'
  | 'CALL_ONLY_AD'
  | 'APP_AD'
  | 'UNKNOWN'

export type GoogleAdsAdApprovalStatus =
  | 'APPROVED'
  | 'APPROVED_LIMITED'
  | 'ELIGIBLE'
  | 'UNDER_REVIEW'
  | 'DISAPPROVED'
  | 'SITE_SUSPENDED'
  | 'UNKNOWN'

export interface GoogleAdsAdInfo {
  id: string
  resourceName?: string
  name?: string
  type: GoogleAdsAdType | string
  status: GoogleAdsCampaignStatus | string
  adGroupId: string
  approvalStatus?: GoogleAdsAdApprovalStatus | string
  headlines?: Array<{ text: string; pinnedField?: string }>
  descriptions?: Array<{ text: string; pinnedField?: string }>
  finalUrls?: string[]
  displayUrl?: string
  path1?: string
  path2?: string
}

// ============================================
// Keyword Types
// ============================================

export type GoogleAdsKeywordMatchType =
  | 'EXACT'
  | 'PHRASE'
  | 'BROAD'
  | 'UNKNOWN'

export interface GoogleAdsKeywordInfo {
  id: string
  resourceName?: string
  text: string
  matchType: GoogleAdsKeywordMatchType | string
  status: GoogleAdsCampaignStatus | string
  adGroupId: string
  cpcBidMicros?: number
  qualityScore?: number
  finalUrls?: string[]
}

export interface GoogleAdsKeywordData {
  id?: string
  text: string
  matchType: GoogleAdsKeywordMatchType | string
  adGroupId: string
  cpcBidMicros?: number
  finalUrls?: string[]
}

// ============================================
// Extension Types
// ============================================

export type GoogleAdsExtensionType =
  | 'SITELINK'
  | 'CALLOUT'
  | 'STRUCTURED_SNIPPET'
  | 'CALL'
  | 'PRICE'
  | 'PROMOTION'
  | 'LOCATION'
  | 'APP'
  | 'IMAGE'
  | 'LEAD_FORM'

export interface GoogleAdsExtensionInfo {
  id: string
  type: GoogleAdsExtensionType | string
  status: GoogleAdsCampaignStatus | string
  sitelinkData?: {
    linkText: string
    finalUrls: string[]
    description1?: string
    description2?: string
  }
  calloutData?: {
    text: string
  }
  structuredSnippetData?: {
    header: string
    values: string[]
  }
  callData?: {
    phoneNumber: string
    countryCode: string
  }
}

// ============================================
// Budget & Bidding Types
// ============================================

export interface GoogleAdsBudgetInfo {
  id: string
  resourceName?: string
  name: string
  amountMicros: number
  deliveryMethod: 'STANDARD' | 'ACCELERATED'
  period?: 'DAILY' | 'CUSTOM_PERIOD'
  explicitlyShared?: boolean
}

export type GoogleAdsBiddingStrategyType =
  | 'MANUAL_CPC'
  | 'MANUAL_CPM'
  | 'MANUAL_CPV'
  | 'TARGET_CPA'
  | 'TARGET_ROAS'
  | 'MAXIMIZE_CONVERSIONS'
  | 'MAXIMIZE_CONVERSION_VALUE'
  | 'TARGET_IMPRESSION_SHARE'
  | 'TARGET_SPEND'
  | 'MAXIMIZE_CLICKS'
  | 'ENHANCED_CPC'
  | 'PERCENT_CPC'

export interface GoogleAdsBiddingStrategyInfo {
  id: string
  resourceName?: string
  name: string
  type: GoogleAdsBiddingStrategyType | string
  targetCpaMicros?: number
  targetRoas?: number
  targetSpendMicros?: number
  targetImpressionShare?: number
}

// ============================================
// Metrics Types
// ============================================

export interface GoogleAdsMetricsQuery {
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  entityType?: 'CAMPAIGN' | 'AD_GROUP' | 'AD' | 'KEYWORD' | 'SEARCH_QUERY'
  entityId?: string
  metrics?: string[] // Array of metric field names
  segmentBy?: 'DATE' | 'DEVICE' | 'GEO' | 'HOUR' | 'DAY_OF_WEEK'
}

export interface GoogleAdsMetricsResult {
  date?: string
  campaignId?: string
  campaignName?: string
  adGroupId?: string
  adGroupName?: string
  adId?: string
  keywordText?: string
  
  // Core metrics
  impressions: number
  clicks: number
  cost: number // In account currency
  
  // Calculated metrics
  ctr?: number // Click-through rate (%)
  cpc?: number // Cost per click
  cpm?: number // Cost per 1000 impressions
  
  // Conversion metrics
  conversions?: number
  conversionValue?: number
  conversionRate?: number
  costPerConversion?: number
  roas?: number // Return on ad spend
  
  // Video metrics
  videoViews?: number
  videoQuartile25?: number
  videoQuartile50?: number
  videoQuartile75?: number
  videoQuartile100?: number
  
  // Engagement
  engagements?: number
  interactions?: number
  
  // Quality metrics (for keywords)
  qualityScore?: number
  
  // Search metrics
  searchImpressionShare?: number
  searchRankLostImpressionShare?: number
  searchBudgetLostImpressionShare?: number
}

// ============================================
// Conversion Types
// ============================================

export type GoogleAdsConversionCategory =
  | 'PURCHASE'
  | 'SIGNUP'
  | 'LEAD'
  | 'DOWNLOAD'
  | 'PAGE_VIEW'
  | 'ADD_TO_CART'
  | 'BEGIN_CHECKOUT'
  | 'SUBSCRIBE'
  | 'CONTACT'
  | 'ENGAGEMENT'
  | 'STORE_VISIT'
  | 'QUALIFIED_LEAD'

export interface GoogleAdsConversionActionInfo {
  id: string
  resourceName?: string
  name: string
  category: GoogleAdsConversionCategory | string
  type: string
  status: GoogleAdsCampaignStatus | string
  countingType?: 'ONE_PER_CLICK' | 'MANY_PER_CLICK'
  clickThroughLookbackWindowDays?: number
  viewThroughLookbackWindowDays?: number
  attributionModel?: string
}

export interface GoogleAdsConversionData {
  conversionActionId: string
  conversionDateTime: string
  conversionValue: number
  currency?: string
  gclid?: string
  gbraid?: string
  wbraid?: string
}

// ============================================
// Asset Types
// ============================================

export type GoogleAdsAssetType =
  | 'IMAGE'
  | 'VIDEO'
  | 'TEXT'
  | 'YOUTUBE_VIDEO'
  | 'MEDIA_BUNDLE'
  | 'LEAD_FORM'

export interface GoogleAdsAssetInfo {
  id: string
  resourceName?: string
  name?: string
  type: GoogleAdsAssetType | string
  source?: string
  imageAsset?: {
    fileSize?: number
    mimeType?: string
    fullSize?: {
      url: string
      width: number
      height: number
    }
  }
  textAsset?: {
    text: string
  }
  youtubeVideoAsset?: {
    youtubeVideoId: string
  }
}

// ============================================
// Sync & MCP Types
// ============================================

export type GoogleAdsSyncStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'SUCCESS'
  | 'PARTIAL_SUCCESS'
  | 'FAILED'
  | 'CANCELLED'

export interface GoogleAdsSyncLogInfo {
  id: string
  customerId: string
  syncType: 'FULL' | 'INCREMENTAL' | 'METRICS'
  entityType?: string
  status: GoogleAdsSyncStatus
  startedAt: Date
  completedAt?: Date
  duration?: number
  recordsProcessed: number
  recordsCreated: number
  recordsUpdated: number
  recordsFailed: number
  error?: string
  triggeredBy?: string
}

export interface GoogleAdsMCPSessionInfo {
  sessionId: string
  customerId?: string
  userId?: string
  isActive: boolean
  lastActivity: Date
  expiresAt: Date
  context?: Record<string, any>
}

export type GoogleAdsOperationStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED'

export interface GoogleAdsOperationQueueInfo {
  id: string
  operationType: string
  entityType: string
  entityId?: string
  payload: Record<string, any>
  status: GoogleAdsOperationStatus
  priority: number
  attempts: number
  maxAttempts: number
  lastAttemptAt?: Date
  nextAttemptAt?: Date
  result?: Record<string, any>
  error?: string
}

// ============================================
// Targeting Types
// ============================================

export interface GoogleAdsGeoTargetInfo {
  id: string
  geoTargetConstantId: string
  name: string
  canonicalName?: string
  targetType: 'LOCATION' | 'PROXIMITY' | 'LOCATION_GROUP'
  isNegative?: boolean
  bidModifier?: number
}

export interface GoogleAdsLanguageTargetInfo {
  languageCode: string
  languageName: string
}

export interface GoogleAdsDeviceTargetInfo {
  deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET' | 'CONNECTED_TV'
  bidModifier: number
}

export interface GoogleAdsAudienceInfo {
  id: string
  resourceName?: string
  name: string
  type: string
  description?: string
  status: GoogleAdsCampaignStatus | string
  membershipDuration?: number
  bidModifier?: number
}

// ============================================
// Shopping Types
// ============================================

export interface GoogleAdsProductFeedInfo {
  id: string
  merchantCenterId: string
  feedId: string
  name: string
  targetCountry: string
  language: string
  status: GoogleAdsCampaignStatus | string
  itemsTotal?: number
  itemsValid?: number
}

export interface GoogleAdsProductInfo {
  id: string
  feedId: string
  itemId: string
  title: string
  description?: string
  link?: string
  imageLink?: string
  price: number
  salePrice?: number
  currency: string
  availability: 'IN_STOCK' | 'OUT_OF_STOCK' | 'PREORDER'
  brand?: string
  condition?: 'NEW' | 'REFURBISHED' | 'USED'
  gtin?: string
  mpn?: string
}

// ============================================
// Error Types
// ============================================

export interface GoogleAdsError {
  code: string
  message: string
  details?: any
  trigger?: string
  location?: string
}

export interface GoogleAdsApiResponse<T = any> {
  success: boolean
  data?: T
  error?: GoogleAdsError
  metadata?: {
    requestId?: string
    timestamp: string
    quotaUsed?: number
  }
}



