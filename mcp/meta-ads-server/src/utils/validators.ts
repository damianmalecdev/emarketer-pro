/**
 * Validation utilities for Meta Ads data
 */

export function validateAccountId(accountId: string): boolean {
  // Meta Ad Account IDs start with "act_" followed by digits
  return /^act_\d+$/.test(accountId)
}

export function validateCampaignId(campaignId: string): boolean {
  // Meta Campaign IDs are numeric strings
  return /^\d+$/.test(campaignId)
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validateUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function validateDateString(date: string): boolean {
  // YYYY-MM-DD format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return false
  }
  const d = new Date(date)
  return d instanceof Date && !isNaN(d.getTime())
}

export function validateBudget(budget: number): boolean {
  return budget > 0 && budget < 10000000 // Max $10M
}

export function validateBidAmount(bid: number): boolean {
  return bid > 0 && bid < 100000 // Max $100K
}

export function sanitizeString(str: string): string {
  return str.trim().replace(/[<>]/g, '')
}

export function validateObjective(objective: string): boolean {
  const validObjectives = [
    'OUTCOME_AWARENESS',
    'OUTCOME_ENGAGEMENT',
    'OUTCOME_LEADS',
    'OUTCOME_SALES',
    'OUTCOME_TRAFFIC',
    'OUTCOME_APP_PROMOTION',
    'APP_INSTALLS',
    'BRAND_AWARENESS',
    'CONVERSIONS',
    'EVENT_RESPONSES',
    'LEAD_GENERATION',
    'LINK_CLICKS',
    'LOCAL_AWARENESS',
    'MESSAGES',
    'OFFER_CLAIMS',
    'PAGE_LIKES',
    'POST_ENGAGEMENT',
    'PRODUCT_CATALOG_SALES',
    'REACH',
    'STORE_VISITS',
    'VIDEO_VIEWS',
  ]
  return validObjectives.includes(objective)
}

export function validateOptimizationGoal(goal: string): boolean {
  const validGoals = [
    'NONE',
    'APP_INSTALLS',
    'AD_RECALL_LIFT',
    'ENGAGED_USERS',
    'EVENT_RESPONSES',
    'IMPRESSIONS',
    'LEAD_GENERATION',
    'QUALITY_LEAD',
    'LINK_CLICKS',
    'OFFSITE_CONVERSIONS',
    'PAGE_LIKES',
    'POST_ENGAGEMENT',
    'QUALITY_CALL',
    'REACH',
    'LANDING_PAGE_VIEWS',
    'VISIT_INSTAGRAM_PROFILE',
    'VALUE',
    'THRUPLAY',
    'DERIVED_EVENTS',
    'APP_INSTALLS_AND_OFFSITE_CONVERSIONS',
    'CONVERSATIONS',
    'IN_APP_VALUE',
  ]
  return validGoals.includes(goal)
}

