// Metric card component for displaying key metrics
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency, formatNumber, formatPercentage, formatRoas } from '@/lib/google-ads/formatting'
import { METRIC_FORMATS } from '@/lib/google-ads/constants'
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MetricCardProps {
  title: string
  value: number | null
  metric?: string
  icon?: LucideIcon
  change?: number
  currency?: string
  format?: 'number' | 'currency' | 'percentage' | 'multiplier'
  subtitle?: string
}

export function MetricCard({
  title,
  value,
  metric,
  icon: Icon,
  change,
  currency = 'USD',
  format,
  subtitle,
}: MetricCardProps) {
  // Auto-detect format from metric name if not provided
  const detectedFormat = format || (metric ? METRIC_FORMATS[metric] : 'number')
  
  const formattedValue = value === null ? '-' : 
    detectedFormat === 'currency' ? formatCurrency(value, currency) :
    detectedFormat === 'percentage' ? formatPercentage(value) :
    detectedFormat === 'multiplier' ? formatRoas(value) :
    formatNumber(value)

  const hasChange = change !== undefined && change !== null
  const isPositive = change && change > 0
  const isNegative = change && change < 0
  const isNeutral = change === 0

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}
        {hasChange && (
          <div className="flex items-center mt-1">
            {isPositive && <TrendingUp className="h-3 w-3 text-green-600 mr-1" />}
            {isNegative && <TrendingDown className="h-3 w-3 text-red-600 mr-1" />}
            {isNeutral && <Minus className="h-3 w-3 text-gray-600 mr-1" />}
            <span
              className={cn(
                'text-xs font-medium',
                isPositive && 'text-green-600',
                isNegative && 'text-red-600',
                isNeutral && 'text-gray-600'
              )}
            >
              {change > 0 && '+'}
              {formatPercentage(change, 1)}
            </span>
            <span className="text-xs text-muted-foreground ml-1">vs previous</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}





