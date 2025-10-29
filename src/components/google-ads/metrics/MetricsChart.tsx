// Metrics chart component using Recharts
'use client'

import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TimeSeriesMetrics } from '@/types/google-ads'
import { formatCurrency, formatNumber, formatDate } from '@/lib/google-ads/formatting'

interface MetricsChartProps {
  data: TimeSeriesMetrics[]
  metrics?: Array<'clicks' | 'impressions' | 'cost' | 'conversions' | 'ctr' | 'cpc' | 'roas'>
  type?: 'line' | 'area'
  currency?: string
  height?: number
}

const metricConfig = {
  clicks: { color: '#3b82f6', label: 'Clicks' },
  impressions: { color: '#8b5cf6', label: 'Impressions' },
  cost: { color: '#ef4444', label: 'Cost' },
  conversions: { color: '#10b981', label: 'Conversions' },
  ctr: { color: '#f59e0b', label: 'CTR %' },
  cpc: { color: '#ec4899', label: 'CPC' },
  roas: { color: '#06b6d4', label: 'ROAS' },
}

export function MetricsChart({
  data,
  metrics = ['clicks', 'cost'],
  type = 'line',
  currency = 'USD',
  height = 300,
}: MetricsChartProps) {
  const chartData = data.map(d => ({
    date: formatDate(d.date),
    ...metrics.reduce((acc, metric) => ({
      ...acc,
      [metric]: d[metric] || 0,
    }), {}),
  }))

  const formatValue = (value: number, metric: string) => {
    if (metric === 'cost' || metric === 'cpc') {
      return formatCurrency(value, currency, 2)
    }
    if (metric === 'ctr') {
      return `${value.toFixed(2)}%`
    }
    if (metric === 'roas') {
      return `${value.toFixed(2)}x`
    }
    return formatNumber(value)
  }

  const Chart = type === 'area' ? AreaChart : LineChart

  return (
    <ResponsiveContainer width="100%" height={height}>
      <Chart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis 
          dataKey="date" 
          className="text-xs"
          tick={{ fontSize: 12 }}
        />
        <YAxis 
          className="text-xs"
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            border: '1px solid hsl(var(--border))',
            borderRadius: '6px',
          }}
          formatter={(value: number, name: string) => [
            formatValue(value, name),
            metricConfig[name as keyof typeof metricConfig]?.label || name,
          ]}
        />
        <Legend />
        {metrics.map((metric) => {
          const config = metricConfig[metric]
          
          if (type === 'area') {
            return (
              <Area
                key={metric}
                type="monotone"
                dataKey={metric}
                stroke={config.color}
                fill={config.color}
                fillOpacity={0.2}
                name={config.label}
              />
            )
          }
          
          return (
            <Line
              key={metric}
              type="monotone"
              dataKey={metric}
              stroke={config.color}
              strokeWidth={2}
              name={config.label}
              dot={false}
            />
          )
        })}
      </Chart>
    </ResponsiveContainer>
  )
}





