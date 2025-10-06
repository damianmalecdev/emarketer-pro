/**
 * Meta Ads Data Transformer
 * 
 * Transforms raw Meta Ads API responses into normalized campaign and metrics data.
 */

export interface MetaCampaignRaw {
  id: string
  name: string
  status: string
  objective?: string
  daily_budget?: string
  lifetime_budget?: string
}

export interface MetaInsightsRaw {
  spend?: string
  impressions?: string
  clicks?: string
  ctr?: string
  cpc?: string
  reach?: string
  frequency?: string
  actions?: Array<{
    action_type: string
    value: string
  }>
}

export interface NormalizedCampaign {
  platformCampaignId: string
  name: string
  platform: 'meta'
  status: string
}

export interface NormalizedMetrics {
  date: Date
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
  ctr: number
  cpc: number
  roas: number
  cpa: number
}

export interface TransformConfig {
  revenuePerConversion?: number // Default: 50
  userId: string
  integrationId: string
}

/**
 * Transform Meta Ads campaign and insights data
 */
export function transformMetaCampaign(
  rawCampaign: MetaCampaignRaw,
  rawInsights: MetaInsightsRaw,
  config: TransformConfig
): {
  campaign: NormalizedCampaign
  metrics: NormalizedMetrics
} {
  const { revenuePerConversion = 50 } = config

  // Extract and parse metrics
  const spend = parseFloat(rawInsights.spend || '0')
  const impressions = parseInt(rawInsights.impressions || '0', 10)
  const clicks = parseInt(rawInsights.clicks || '0', 10)
  
  // Extract conversions from actions array
  const conversions = parseFloat(
    rawInsights.actions?.find(
      (a) =>
        a.action_type === 'purchase' ||
        a.action_type === 'offsite_conversion.fb_pixel_purchase'
    )?.value || '0'
  )

  // Calculate derived metrics
  const revenue = conversions * revenuePerConversion
  const ctr = parseFloat(rawInsights.ctr || '0')
  const cpc = parseFloat(rawInsights.cpc || '0')
  const roas = spend > 0 ? revenue / spend : 0
  const cpa = conversions > 0 ? spend / conversions : 0

  // Validate data
  if (spend < 0 || impressions < 0 || clicks < 0 || conversions < 0) {
    throw new Error('Invalid metric values: negative numbers detected')
  }

  return {
    campaign: {
      platformCampaignId: rawCampaign.id,
      name: rawCampaign.name,
      platform: 'meta',
      status: rawCampaign.status,
    },
    metrics: {
      date: new Date(), // Will be normalized to midnight by loader
      spend,
      impressions,
      clicks,
      conversions,
      revenue,
      ctr,
      cpc,
      roas,
      cpa,
    },
  }
}

/**
 * Batch transform multiple Meta campaigns
 */
export function transformMetaCampaignsBatch(
  campaigns: Array<{ campaign: MetaCampaignRaw; insights: MetaInsightsRaw }>,
  config: TransformConfig
): Array<{ campaign: NormalizedCampaign; metrics: NormalizedMetrics }> {
  return campaigns
    .map((item) => {
      try {
        return transformMetaCampaign(item.campaign, item.insights, config)
      } catch (error) {
        console.error(
          `Failed to transform Meta campaign ${item.campaign.id}:`,
          error
        )
        return null
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

/**
 * Validate Meta Ads API response
 */
export function validateMetaResponse(response: any): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!response || typeof response !== 'object') {
    errors.push('Response is not a valid object')
    return { isValid: false, errors }
  }

  if (!response.data || !Array.isArray(response.data)) {
    errors.push('Response does not contain data array')
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

