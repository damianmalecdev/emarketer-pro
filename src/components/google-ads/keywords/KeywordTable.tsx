// Keyword table component
'use client'

import { GoogleAdsKeywordWithMetrics } from '@/types/google-ads'
import { StatusBadge } from '../shared/StatusBadge'
import { MetricValue } from '../shared/MetricValue'
import { MATCH_TYPE_LABELS, MATCH_TYPE_SYMBOLS } from '@/lib/google-ads/constants'
import { formatMicros, formatQualityScore } from '@/lib/google-ads/formatting'
import { cn } from '@/lib/utils'

interface KeywordTableProps {
  keywords: GoogleAdsKeywordWithMetrics[]
  currency?: string
}

export function KeywordTable({ keywords, currency = 'USD' }: KeywordTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr>
            <th className="text-left py-2 px-2 font-medium">Keyword</th>
            <th className="text-left py-2 px-2 font-medium">Match Type</th>
            <th className="text-left py-2 px-2 font-medium">Status</th>
            <th className="text-center py-2 px-2 font-medium">QS</th>
            <th className="text-right py-2 px-2 font-medium">Max CPC</th>
            <th className="text-right py-2 px-2 font-medium">Impr.</th>
            <th className="text-right py-2 px-2 font-medium">Clicks</th>
            <th className="text-right py-2 px-2 font-medium">CTR</th>
            <th className="text-right py-2 px-2 font-medium">Cost</th>
            <th className="text-right py-2 px-2 font-medium">Conv.</th>
          </tr>
        </thead>
        <tbody>
          {keywords.map((keyword) => {
            const qsFormatted = formatQualityScore(keyword.qualityScore)
            
            return (
              <tr key={keyword.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="py-2 px-2 font-medium">{keyword.text}</td>
                <td className="py-2 px-2">
                  <span className="text-xs">
                    {MATCH_TYPE_SYMBOLS[keyword.matchType]} {MATCH_TYPE_LABELS[keyword.matchType]}
                  </span>
                </td>
                <td className="py-2 px-2">
                  <StatusBadge status={keyword.status} />
                </td>
                <td className="py-2 px-2 text-center">
                  <span
                    className={cn(
                      'inline-flex items-center justify-center h-6 w-6 rounded-full text-xs font-semibold',
                      qsFormatted.color === 'green' && 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
                      qsFormatted.color === 'yellow' && 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
                      qsFormatted.color === 'red' && 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
                      qsFormatted.color === 'gray' && 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                    )}
                  >
                    {qsFormatted.text}
                  </span>
                </td>
                <td className="py-2 px-2 text-right">
                  {keyword.cpcBidMicros ? formatMicros(BigInt(keyword.cpcBidMicros), currency) : '-'}
                </td>
                <td className="py-2 px-2 text-right">
                  <MetricValue value={keyword.metrics?.impressions || 0} format="number" />
                </td>
                <td className="py-2 px-2 text-right">
                  <MetricValue value={keyword.metrics?.clicks || 0} format="number" />
                </td>
                <td className="py-2 px-2 text-right">
                  <MetricValue value={keyword.metrics?.ctr || 0} format="percentage" />
                </td>
                <td className="py-2 px-2 text-right">
                  <MetricValue value={keyword.metrics?.cost || 0} format="currency" currency={currency} />
                </td>
                <td className="py-2 px-2 text-right">
                  <MetricValue value={keyword.metrics?.conversions || 0} format="number" decimals={1} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}





