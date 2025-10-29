// Calculation utilities for Google Ads metrics

/**
 * Calculate CTR (Click-Through Rate)
 * CTR = (Clicks / Impressions) * 100
 */
export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0
  return (clicks / impressions) * 100
}

/**
 * Calculate CPC (Cost Per Click)
 * CPC = Cost / Clicks
 */
export function calculateCPC(cost: number, clicks: number): number {
  if (clicks === 0) return 0
  return cost / clicks
}

/**
 * Calculate CPM (Cost Per Mille/Thousand Impressions)
 * CPM = (Cost / Impressions) * 1000
 */
export function calculateCPM(cost: number, impressions: number): number {
  if (impressions === 0) return 0
  return (cost / impressions) * 1000
}

/**
 * Calculate CPV (Cost Per View) for video ads
 */
export function calculateCPV(cost: number, views: number): number {
  if (views === 0) return 0
  return cost / views
}

/**
 * Calculate Conversion Rate
 * Conversion Rate = (Conversions / Clicks) * 100
 */
export function calculateConversionRate(
  conversions: number,
  clicks: number
): number {
  if (clicks === 0) return 0
  return (conversions / clicks) * 100
}

/**
 * Calculate Cost Per Conversion (CPA)
 * CPA = Cost / Conversions
 */
export function calculateCPA(cost: number, conversions: number): number {
  if (conversions === 0) return 0
  return cost / conversions
}

/**
 * Calculate ROAS (Return on Ad Spend)
 * ROAS = Revenue / Cost
 */
export function calculateROAS(revenue: number, cost: number): number {
  if (cost === 0) return 0
  return revenue / cost
}

/**
 * Calculate ROI (Return on Investment)
 * ROI = ((Revenue - Cost) / Cost) * 100
 */
export function calculateROI(revenue: number, cost: number): number {
  if (cost === 0) return 0
  return ((revenue - cost) / cost) * 100
}

/**
 * Calculate all metrics from raw data
 */
export function calculateAllMetrics(data: {
  impressions: number
  clicks: number
  cost: number
  conversions: number
  conversionValue: number
  videoViews?: number
}) {
  return {
    ctr: calculateCTR(data.clicks, data.impressions),
    cpc: calculateCPC(data.cost, data.clicks),
    cpm: calculateCPM(data.cost, data.impressions),
    cpv: data.videoViews ? calculateCPV(data.cost, data.videoViews) : 0,
    conversionRate: calculateConversionRate(data.conversions, data.clicks),
    cpa: calculateCPA(data.cost, data.conversions),
    roas: calculateROAS(data.conversionValue, data.cost),
    roi: calculateROI(data.conversionValue, data.cost),
  }
}

/**
 * Aggregate metrics from multiple time periods
 */
export function aggregateMetrics(
  metrics: Array<{
    impressions: number
    clicks: number
    cost: number
    conversions: number
    conversionValue: number
  }>
) {
  const totals = metrics.reduce(
    (acc, metric) => ({
      impressions: acc.impressions + Number(metric.impressions),
      clicks: acc.clicks + Number(metric.clicks),
      cost: acc.cost + Number(metric.cost),
      conversions: acc.conversions + Number(metric.conversions),
      conversionValue: acc.conversionValue + Number(metric.conversionValue),
    }),
    {
      impressions: 0,
      clicks: 0,
      cost: 0,
      conversions: 0,
      conversionValue: 0,
    }
  )

  return {
    ...totals,
    ...calculateAllMetrics(totals),
  }
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentageChange(
  current: number,
  previous: number
): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

/**
 * Calculate trend direction
 */
export function calculateTrend(
  current: number,
  previous: number
): 'up' | 'down' | 'neutral' {
  const change = calculatePercentageChange(current, previous)
  if (Math.abs(change) < 1) return 'neutral'
  return change > 0 ? 'up' : 'down'
}

/**
 * Calculate average from array of numbers
 */
export function calculateAverage(values: number[]): number {
  if (values.length === 0) return 0
  const sum = values.reduce((acc, val) => acc + val, 0)
  return sum / values.length
}

/**
 * Convert micros to standard currency
 */
export function microsToAmount(micros: number | bigint): number {
  const numValue = typeof micros === 'bigint' ? Number(micros) : micros
  return numValue / 1_000_000
}

/**
 * Convert standard currency to micros
 */
export function amountToMicros(amount: number): number {
  return Math.round(amount * 1_000_000)
}





