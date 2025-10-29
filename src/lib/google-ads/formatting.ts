// Formatting utilities for Google Ads data

/**
 * Format currency values
 */
export function formatCurrency(
  value: number | bigint,
  currency: string = 'USD',
  decimals: number = 2
): string {
  const numValue = typeof value === 'bigint' ? Number(value) : value
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numValue)
}

/**
 * Format micros (Google Ads uses micros = amount * 1,000,000)
 */
export function formatMicros(
  micros: number | bigint | null,
  currency: string = 'USD'
): string {
  if (micros === null) return '-'
  const numValue = typeof micros === 'bigint' ? Number(micros) : micros
  const amount = numValue / 1_000_000
  return formatCurrency(amount, currency)
}

/**
 * Format percentage values
 */
export function formatPercentage(
  value: number | null,
  decimals: number = 2
): string {
  if (value === null || value === undefined) return '-'
  return `${value.toFixed(decimals)}%`
}

/**
 * Format large numbers with K, M, B suffixes
 */
export function formatCompactNumber(value: number): string {
  if (value >= 1_000_000_000) {
    return (value / 1_000_000_000).toFixed(1) + 'B'
  }
  if (value >= 1_000_000) {
    return (value / 1_000_000).toFixed(1) + 'M'
  }
  if (value >= 1_000) {
    return (value / 1_000).toFixed(1) + 'K'
  }
  return value.toString()
}

/**
 * Format number with thousand separators
 */
export function formatNumber(
  value: number | null,
  decimals: number = 0
): string {
  if (value === null || value === undefined) return '-'
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

/**
 * Format ROAS (Return on Ad Spend)
 */
export function formatRoas(roas: number | null): string {
  if (roas === null || roas === undefined) return '-'
  return `${roas.toFixed(2)}x`
}

/**
 * Format date to locale string
 */
export function formatDate(date: Date | string | null): string {
  if (!date) return '-'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/**
 * Format date and time
 */
export function formatDateTime(date: Date | string | null): string {
  if (!date) return '-'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  return dateObj.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(date: Date | string | null): string {
  if (!date) return '-'
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`
  if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  return formatDate(dateObj)
}

/**
 * Format quality score with color indicator
 */
export function formatQualityScore(score: number | null): {
  text: string
  color: string
} {
  if (score === null) {
    return { text: '-', color: 'gray' }
  }
  
  let color = 'gray'
  if (score >= 8) color = 'green'
  else if (score >= 5) color = 'yellow'
  else color = 'red'
  
  return { text: score.toString(), color }
}

/**
 * Format enum values to readable text
 */
export function formatEnumValue(value: string): string {
  return value
    .split('_')
    .map(word => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number = 50): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength - 3) + '...'
}





