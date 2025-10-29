// Formatted metric value component
import { formatCurrency, formatNumber, formatPercentage, formatRoas } from '@/lib/google-ads/formatting'
import { METRIC_FORMATS } from '@/lib/google-ads/constants'
import { cn } from '@/lib/utils'

interface MetricValueProps {
  value: number | null
  metric?: string
  format?: 'number' | 'currency' | 'percentage' | 'multiplier'
  currency?: string
  decimals?: number
  className?: string
}

export function MetricValue({
  value,
  metric,
  format,
  currency = 'USD',
  decimals,
  className,
}: MetricValueProps) {
  // Auto-detect format from metric name if not provided
  const detectedFormat = format || (metric ? METRIC_FORMATS[metric] : 'number')
  
  const formattedValue = value === null ? '-' : 
    detectedFormat === 'currency' ? formatCurrency(value, currency, decimals) :
    detectedFormat === 'percentage' ? formatPercentage(value, decimals) :
    detectedFormat === 'multiplier' ? formatRoas(value) :
    formatNumber(value, decimals)

  return (
    <span className={cn('font-medium', className)}>
      {formattedValue}
    </span>
  )
}





