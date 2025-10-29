// Campaign list component
'use client'

import { useState } from 'react'
import { GoogleAdsCampaignWithMetrics } from '@/types/google-ads'
import { StatusBadge } from '../shared/StatusBadge'
import { MetricValue } from '../shared/MetricValue'
import { CAMPAIGN_TYPE_LABELS } from '@/lib/google-ads/constants'
import { formatMicros } from '@/lib/google-ads/formatting'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CampaignListProps {
  campaigns: GoogleAdsCampaignWithMetrics[]
  currency?: string
  onCampaignClick?: (campaignId: string) => void
  expandedCampaignId?: string | null
  children?: (campaign: GoogleAdsCampaignWithMetrics) => React.ReactNode
}

export function CampaignList({
  campaigns,
  currency = 'USD',
  onCampaignClick,
  expandedCampaignId,
  children,
}: CampaignListProps) {
  const [sortField, setSortField] = useState<string>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedCampaigns = [...campaigns].sort((a, b) => {
    let aValue: any = a[sortField as keyof typeof a]
    let bValue: any = b[sortField as keyof typeof b]

    // Handle nested metrics
    if (sortField.startsWith('metrics.')) {
      const metricField = sortField.split('.')[1]
      aValue = a.metrics?.[metricField as keyof typeof a.metrics] || 0
      bValue = b.metrics?.[metricField as keyof typeof b.metrics] || 0
    }

    if (aValue === null || aValue === undefined) return 1
    if (bValue === null || bValue === undefined) return -1

    if (typeof aValue === 'string') {
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue)
    }

    return sortDirection === 'asc'
      ? Number(aValue) - Number(bValue)
      : Number(bValue) - Number(aValue)
  })

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr>
            <th className="text-left py-3 px-2 font-medium w-8"></th>
            <th
              className="text-left py-3 px-2 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => handleSort('name')}
            >
              Campaign Name {sortField === 'name' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th className="text-left py-3 px-2 font-medium">Type</th>
            <th className="text-left py-3 px-2 font-medium">Status</th>
            <th className="text-left py-3 px-2 font-medium">Budget</th>
            <th
              className="text-right py-3 px-2 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => handleSort('metrics.cost')}
            >
              Spend {sortField === 'metrics.cost' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th
              className="text-right py-3 px-2 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => handleSort('metrics.impressions')}
            >
              Impr. {sortField === 'metrics.impressions' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th
              className="text-right py-3 px-2 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => handleSort('metrics.clicks')}
            >
              Clicks {sortField === 'metrics.clicks' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th
              className="text-right py-3 px-2 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => handleSort('metrics.ctr')}
            >
              CTR {sortField === 'metrics.ctr' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th
              className="text-right py-3 px-2 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => handleSort('metrics.conversions')}
            >
              Conv. {sortField === 'metrics.conversions' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
            <th
              className="text-right py-3 px-2 font-medium cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              onClick={() => handleSort('metrics.roas')}
            >
              ROAS {sortField === 'metrics.roas' && (sortDirection === 'asc' ? '↑' : '↓')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sortedCampaigns.map((campaign) => {
            const isExpanded = expandedCampaignId === campaign.id
            
            return (
              <>
                <tr
                  key={campaign.id}
                  className={cn(
                    'border-b hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors',
                    isExpanded && 'bg-gray-50 dark:bg-gray-800'
                  )}
                >
                  <td className="py-3 px-2">
                    {children && (
                      <button
                        onClick={() => onCampaignClick?.(campaign.id)}
                        className="hover:bg-gray-200 dark:hover:bg-gray-700 rounded p-1"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-2 font-medium">
                    <div className="flex flex-col">
                      <span>{campaign.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {campaign.adGroupCount} ad groups
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">
                    {CAMPAIGN_TYPE_LABELS[campaign.type]}
                  </td>
                  <td className="py-3 px-2">
                    <StatusBadge status={campaign.status} />
                  </td>
                  <td className="py-3 px-2">
                    {campaign.budget ? formatMicros(campaign.budget.amountMicros, currency) : '-'}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <MetricValue value={campaign.metrics?.cost || 0} format="currency" currency={currency} />
                  </td>
                  <td className="py-3 px-2 text-right">
                    <MetricValue value={campaign.metrics?.impressions || 0} format="number" />
                  </td>
                  <td className="py-3 px-2 text-right">
                    <MetricValue value={campaign.metrics?.clicks || 0} format="number" />
                  </td>
                  <td className="py-3 px-2 text-right">
                    <MetricValue value={campaign.metrics?.ctr || 0} format="percentage" />
                  </td>
                  <td className="py-3 px-2 text-right">
                    <MetricValue value={campaign.metrics?.conversions || 0} format="number" decimals={1} />
                  </td>
                  <td className="py-3 px-2 text-right">
                    <MetricValue value={campaign.metrics?.roas || 0} format="multiplier" />
                  </td>
                </tr>
                {isExpanded && children && (
                  <tr>
                    <td colSpan={11} className="p-0">
                      <div className="bg-gray-50 dark:bg-gray-900 p-4 border-b">
                        {children(campaign)}
                      </div>
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}





