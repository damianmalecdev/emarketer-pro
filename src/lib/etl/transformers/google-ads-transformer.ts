/**
 * Google Ads Data Transformer
 * 
 * Transforms raw Google Ads API (GAQL) responses into normalized campaign and metrics data.
 */

export interface GoogleAdsCampaignRaw {
  campaign: {
    id: string
    name: string
    status: string
  }
  metrics: {
    impressions?: string
    clicks?: string
    costMicros?: string
    conversions?: string
    conversionsValue?: string
    ctr?: string
    averageCpc?: string
  }
}

export interface NormalizedCampaign {
  platformCampaignId: string
  name: string
  platform: 'google-ads'
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
  userId: string
  integrationId: string
}

/**
 * Transform Google Ads campaign data
 */
export function transformGoogleAdsCampaign(
  raw: GoogleAdsCampaignRaw,
  config: TransformConfig
): {
  campaign: NormalizedCampaign
  metrics: NormalizedMetrics
} {
  // Parse metrics
  const impressions = parseInt(raw.metrics.impressions || '0', 10)
  const clicks = parseInt(raw.metrics.clicks || '0', 10)
  const spend = parseInt(raw.metrics.costMicros || '0', 10) / 1_000_000 // Convert micros to currency
  const conversions = parseFloat(raw.metrics.conversions || '0')
  const revenue = parseFloat(raw.metrics.conversionsValue || '0')

  // Calculate derived metrics
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
  const cpc = clicks > 0 ? spend / clicks : 0
  const roas = spend > 0 ? revenue / spend : 0
  const cpa = conversions > 0 ? spend / conversions : 0

  // Validate data
  if (spend < 0 || impressions < 0 || clicks < 0 || conversions < 0) {
    throw new Error('Invalid metric values: negative numbers detected')
  }

  return {
    campaign: {
      platformCampaignId: raw.campaign.id,
      name: raw.campaign.name,
      platform: 'google-ads',
      status: raw.campaign.status,
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
 * Aggregate multiple Google Ads results by campaign ID
 * (Google Ads API returns daily rows, we need to aggregate)
 */
export function aggregateGoogleAdsCampaigns(
  results: GoogleAdsCampaignRaw[]
): Map<
  string,
  {
    campaign: GoogleAdsCampaignRaw['campaign']
    aggregatedMetrics: {
      impressions: number
      clicks: number
      cost: number
      conversions: number
      conversionValue: number
    }
  }
> {
  const campaignMap = new Map()

  for (const result of results) {
    const campaignId = result.campaign.id
    const metrics = result.metrics

    if (!campaignMap.has(campaignId)) {
      campaignMap.set(campaignId, {
        campaign: result.campaign,
        aggregatedMetrics: {
          impressions: 0,
          clicks: 0,
          cost: 0,
          conversions: 0,
          conversionValue: 0,
        },
      })
    }

    const entry = campaignMap.get(campaignId)
    entry.aggregatedMetrics.impressions += parseInt(metrics.impressions || '0', 10)
    entry.aggregatedMetrics.clicks += parseInt(metrics.clicks || '0', 10)
    entry.aggregatedMetrics.cost += parseInt(metrics.costMicros || '0', 10) / 1_000_000
    entry.aggregatedMetrics.conversions += parseFloat(metrics.conversions || '0')
    entry.aggregatedMetrics.conversionValue += parseFloat(metrics.conversionsValue || '0')
  }

  return campaignMap
}

/**
 * Batch transform aggregated Google Ads campaigns
 */
export function transformGoogleAdsCampaignsBatch(
  campaignMap: Map<string, any>,
  config: TransformConfig
): Array<{ campaign: NormalizedCampaign; metrics: NormalizedMetrics }> {
  const results: Array<{ campaign: NormalizedCampaign; metrics: NormalizedMetrics }> = []

  for (const [campaignId, entry] of campaignMap) {
    try {
      const { campaign, aggregatedMetrics } = entry

      const spend = aggregatedMetrics.cost
      const impressions = aggregatedMetrics.impressions
      const clicks = aggregatedMetrics.clicks
      const conversions = aggregatedMetrics.conversions
      const revenue = aggregatedMetrics.conversionValue

      const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0
      const cpc = clicks > 0 ? spend / clicks : 0
      const roas = spend > 0 ? revenue / spend : 0
      const cpa = conversions > 0 ? spend / conversions : 0

      results.push({
        campaign: {
          platformCampaignId: campaignId,
          name: campaign.name,
          platform: 'google-ads',
          status: campaign.status,
        },
        metrics: {
          date: new Date(),
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
      })
    } catch (error) {
      console.error(`Failed to transform Google Ads campaign ${campaignId}:`, error)
    }
  }

  return results
}

/**
 * Validate Google Ads API response
 */
export function validateGoogleAdsResponse(response: any): {
  isValid: boolean
  errors: string[]
} {
  const errors: string[] = []

  if (!response || typeof response !== 'object') {
    errors.push('Response is not a valid object')
    return { isValid: false, errors }
  }

  if (!response.results && !Array.isArray(response.results)) {
    // Google Ads API returns empty array for no results
    if (!Array.isArray(response)) {
      errors.push('Response does not contain results array')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

