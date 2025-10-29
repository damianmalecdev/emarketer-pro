// Ad Group list component
'use client'

import { GoogleAdsAdGroupWithMetrics } from '@/types/google-ads'
import { StatusBadge } from '../shared/StatusBadge'
import { MetricValue } from '../shared/MetricValue'
import { formatMicros } from '@/lib/google-ads/formatting'

interface AdGroupListProps {
  adGroups: GoogleAdsAdGroupWithMetrics[]
  currency?: string
  onAdGroupClick?: (adGroupId: string) => void
}

export function AdGroupList({
  adGroups,
  currency = 'USD',
  onAdGroupClick,
}: AdGroupListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr>
            <th className="text-left py-2 px-2 font-medium">Ad Group Name</th>
            <th className="text-left py-2 px-2 font-medium">Status</th>
            <th className="text-left py-2 px-2 font-medium">CPC Bid</th>
            <th className="text-right py-2 px-2 font-medium">Ads</th>
            <th className="text-right py-2 px-2 font-medium">Keywords</th>
            <th className="text-right py-2 px-2 font-medium">Clicks</th>
            <th className="text-right py-2 px-2 font-medium">CTR</th>
            <th className="text-right py-2 px-2 font-medium">Conv.</th>
          </tr>
        </thead>
        <tbody>
          {adGroups.map((adGroup) => (
            <tr
              key={adGroup.id}
              className="border-b hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() => onAdGroupClick?.(adGroup.id)}
            >
              <td className="py-2 px-2 font-medium">{adGroup.name}</td>
              <td className="py-2 px-2">
                <StatusBadge status={adGroup.status} />
              </td>
              <td className="py-2 px-2">
                {adGroup.cpcBidMicros ? formatMicros(BigInt(adGroup.cpcBidMicros), currency) : '-'}
              </td>
              <td className="py-2 px-2 text-right">{adGroup.adCount}</td>
              <td className="py-2 px-2 text-right">{adGroup.keywordCount}</td>
              <td className="py-2 px-2 text-right">
                <MetricValue value={adGroup.metrics?.clicks || 0} format="number" />
              </td>
              <td className="py-2 px-2 text-right">
                <MetricValue value={adGroup.metrics?.ctr || 0} format="percentage" />
              </td>
              <td className="py-2 px-2 text-right">
                <MetricValue value={adGroup.metrics?.conversions || 0} format="number" decimals={1} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}





