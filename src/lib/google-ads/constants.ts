// Constants for Google Ads

import { 
  GoogleAdsCampaignStatus, 
  GoogleAdsCampaignType,
  GoogleAdsAdType,
  GoogleAdsKeywordMatchType,
  GoogleAdsBiddingStrategyType,
  GoogleAdsAdApprovalStatus
} from '@prisma/client'

// ============================================
// STATUS CONFIGURATIONS
// ============================================

export const STATUS_COLORS: Record<string, string> = {
  ENABLED: 'green',
  PAUSED: 'yellow',
  REMOVED: 'red',
  UNKNOWN: 'gray',
  // Approval statuses
  APPROVED: 'green',
  APPROVED_LIMITED: 'yellow',
  ELIGIBLE: 'green',
  UNDER_REVIEW: 'blue',
  DISAPPROVED: 'red',
  SITE_SUSPENDED: 'red',
}

export const STATUS_LABELS: Record<string, string> = {
  ENABLED: 'Active',
  PAUSED: 'Paused',
  REMOVED: 'Removed',
  UNKNOWN: 'Unknown',
  APPROVED: 'Approved',
  APPROVED_LIMITED: 'Limited',
  ELIGIBLE: 'Eligible',
  UNDER_REVIEW: 'Under Review',
  DISAPPROVED: 'Disapproved',
  SITE_SUSPENDED: 'Suspended',
}

// ============================================
// CAMPAIGN TYPE CONFIGURATIONS
// ============================================

export const CAMPAIGN_TYPE_LABELS: Record<GoogleAdsCampaignType, string> = {
  SEARCH: 'Search',
  DISPLAY: 'Display',
  VIDEO: 'Video',
  SHOPPING: 'Shopping',
  PERFORMANCE_MAX: 'Performance Max',
  DISCOVERY: 'Discovery',
  APP: 'App',
  LOCAL: 'Local',
  SMART: 'Smart',
  HOTEL: 'Hotel',
}

export const CAMPAIGN_TYPE_ICONS: Record<GoogleAdsCampaignType, string> = {
  SEARCH: '🔍',
  DISPLAY: '🖼️',
  VIDEO: '🎥',
  SHOPPING: '🛒',
  PERFORMANCE_MAX: '⚡',
  DISCOVERY: '🌟',
  APP: '📱',
  LOCAL: '📍',
  SMART: '🤖',
  HOTEL: '🏨',
}

// ============================================
// AD TYPE CONFIGURATIONS
// ============================================

export const AD_TYPE_LABELS: Record<GoogleAdsAdType, string> = {
  TEXT_AD: 'Text Ad',
  EXPANDED_TEXT_AD: 'Expanded Text Ad',
  RESPONSIVE_SEARCH_AD: 'Responsive Search Ad',
  CALL_ONLY_AD: 'Call Only Ad',
  EXPANDED_DYNAMIC_SEARCH_AD: 'Dynamic Search Ad',
  HOTEL_AD: 'Hotel Ad',
  SHOPPING_SMART_AD: 'Smart Shopping Ad',
  SHOPPING_PRODUCT_AD: 'Shopping Product Ad',
  VIDEO_AD: 'Video Ad',
  IMAGE_AD: 'Image Ad',
  RESPONSIVE_DISPLAY_AD: 'Responsive Display Ad',
  LOCAL_AD: 'Local Ad',
  HTML5_UPLOAD_AD: 'HTML5 Ad',
  DYNAMIC_HTML5_AD: 'Dynamic HTML5 Ad',
  APP_ENGAGEMENT_AD: 'App Engagement Ad',
  SHOPPING_COMPARISON_LISTING_AD: 'Comparison Listing Ad',
  APP_AD: 'App Ad',
  LEGACY_APP_INSTALL_AD: 'Legacy App Install Ad',
  RESPONSIVE_DISPLAY_AD_CONTROL: 'Responsive Display Control',
  DISPLAY_UPLOAD_AD: 'Display Upload Ad',
  UNKNOWN: 'Unknown',
}

// ============================================
// KEYWORD MATCH TYPE CONFIGURATIONS
// ============================================

export const MATCH_TYPE_LABELS: Record<GoogleAdsKeywordMatchType, string> = {
  EXACT: 'Exact',
  PHRASE: 'Phrase',
  BROAD: 'Broad',
  UNKNOWN: 'Unknown',
}

export const MATCH_TYPE_SYMBOLS: Record<GoogleAdsKeywordMatchType, string> = {
  EXACT: '[ ]',
  PHRASE: '" "',
  BROAD: '',
  UNKNOWN: '?',
}

export const MATCH_TYPE_COLORS: Record<GoogleAdsKeywordMatchType, string> = {
  EXACT: 'blue',
  PHRASE: 'purple',
  BROAD: 'green',
  UNKNOWN: 'gray',
}

// ============================================
// BIDDING STRATEGY CONFIGURATIONS
// ============================================

export const BIDDING_STRATEGY_LABELS: Record<GoogleAdsBiddingStrategyType, string> = {
  MANUAL_CPC: 'Manual CPC',
  MANUAL_CPM: 'Manual CPM',
  MANUAL_CPV: 'Manual CPV',
  TARGET_CPA: 'Target CPA',
  TARGET_ROAS: 'Target ROAS',
  MAXIMIZE_CONVERSIONS: 'Maximize Conversions',
  MAXIMIZE_CONVERSION_VALUE: 'Maximize Conversion Value',
  TARGET_IMPRESSION_SHARE: 'Target Impression Share',
  TARGET_SPEND: 'Target Spend',
  MAXIMIZE_CLICKS: 'Maximize Clicks',
  ENHANCED_CPC: 'Enhanced CPC',
  PERCENT_CPC: 'Percent CPC',
  UNKNOWN: 'Unknown',
}

export const BIDDING_STRATEGY_DESCRIPTIONS: Record<GoogleAdsBiddingStrategyType, string> = {
  MANUAL_CPC: 'Set your own maximum CPC bids',
  MANUAL_CPM: 'Set your own CPM bids',
  MANUAL_CPV: 'Set your own CPV bids',
  TARGET_CPA: 'Automatically set bids to get as many conversions as possible at your target CPA',
  TARGET_ROAS: 'Automatically set bids to maximize conversion value at your target ROAS',
  MAXIMIZE_CONVERSIONS: 'Automatically set bids to get the most conversions within your budget',
  MAXIMIZE_CONVERSION_VALUE: 'Automatically set bids to maximize total conversion value',
  TARGET_IMPRESSION_SHARE: 'Automatically set bids to show your ads at a target location',
  TARGET_SPEND: 'Automatically maximize clicks within your budget',
  MAXIMIZE_CLICKS: 'Automatically set bids to get as many clicks as possible',
  ENHANCED_CPC: 'Automatically adjust manual bids to maximize conversions',
  PERCENT_CPC: 'Set bids as a percentage of target CPC',
  UNKNOWN: 'Unknown bidding strategy',
}

// ============================================
// QUALITY SCORE CONFIGURATIONS
// ============================================

export const QUALITY_SCORE_COLORS: Record<string, string> = {
  high: 'green',
  medium: 'yellow',
  low: 'red',
}

export function getQualityScoreLevel(score: number | null): string {
  if (score === null) return 'unknown'
  if (score >= 8) return 'high'
  if (score >= 5) return 'medium'
  return 'low'
}

// ============================================
// METRIC CONFIGURATIONS
// ============================================

export const METRIC_LABELS: Record<string, string> = {
  impressions: 'Impressions',
  clicks: 'Clicks',
  cost: 'Cost',
  conversions: 'Conversions',
  conversionValue: 'Conv. Value',
  ctr: 'CTR',
  cpc: 'CPC',
  cpm: 'CPM',
  cpv: 'CPV',
  conversionRate: 'Conv. Rate',
  roas: 'ROAS',
  roi: 'ROI',
}

export const METRIC_FORMATS: Record<string, 'number' | 'currency' | 'percentage' | 'multiplier'> = {
  impressions: 'number',
  clicks: 'number',
  cost: 'currency',
  conversions: 'number',
  conversionValue: 'currency',
  ctr: 'percentage',
  cpc: 'currency',
  cpm: 'currency',
  cpv: 'currency',
  conversionRate: 'percentage',
  roas: 'multiplier',
  roi: 'percentage',
}

// ============================================
// CACHE TIMES (milliseconds)
// ============================================

export const CACHE_TIMES = {
  customers: 10 * 60 * 1000,      // 10 minutes
  campaigns: 5 * 60 * 1000,       // 5 minutes
  adGroups: 5 * 60 * 1000,        // 5 minutes
  ads: 3 * 60 * 1000,             // 3 minutes
  keywords: 3 * 60 * 1000,        // 3 minutes
  metrics: 2 * 60 * 1000,         // 2 minutes
  sync: 30 * 1000,                // 30 seconds
}

// ============================================
// DATE RANGE PRESETS
// ============================================

export const DATE_RANGE_PRESETS = [
  { label: 'Today', days: 0 },
  { label: 'Yesterday', days: 1 },
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
  { label: 'This month', days: 'month' as const },
  { label: 'Last month', days: 'lastMonth' as const },
]

// ============================================
// PAGINATION
// ============================================

export const DEFAULT_PAGE_SIZE = 50
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 200]





