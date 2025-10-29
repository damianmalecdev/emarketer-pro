// Ad list component
'use client'

import { GoogleAdsAdWithMetrics } from '@/types/google-ads'
import { StatusBadge } from '../shared/StatusBadge'
import { MetricValue } from '../shared/MetricValue'
import { AD_TYPE_LABELS } from '@/lib/google-ads/constants'

interface AdListProps {
  ads: GoogleAdsAdWithMetrics[]
  currency?: string
}

export function AdList({ ads, currency = 'USD' }: AdListProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b">
          <tr>
            <th className="text-left py-2 px-2 font-medium">Ad</th>
            <th className="text-left py-2 px-2 font-medium">Type</th>
            <th className="text-left py-2 px-2 font-medium">Status</th>
            <th className="text-left py-2 px-2 font-medium">Approval</th>
            <th className="text-right py-2 px-2 font-medium">Impr.</th>
            <th className="text-right py-2 px-2 font-medium">Clicks</th>
            <th className="text-right py-2 px-2 font-medium">CTR</th>
            <th className="text-right py-2 px-2 font-medium">Conv.</th>
          </tr>
        </thead>
        <tbody>
          {ads.map((ad) => {
            // Extract first headline for display
            const firstHeadline = ad.headlines && Array.isArray(ad.headlines) 
              ? ad.headlines[0]?.text || ad.headlines[0] 
              : null

            return (
              <tr key={ad.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
                <td className="py-2 px-2">
                  <div className="flex flex-col">
                    <span className="font-medium">{ad.name || firstHeadline || 'Unnamed Ad'}</span>
                    {ad.rsaStrength && (
                      <span className="text-xs text-muted-foreground">
                        Strength: {ad.rsaStrength}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-2 px-2 text-muted-foreground text-xs">
                  {AD_TYPE_LABELS[ad.type]}
                </td>
                <td className="py-2 px-2">
                  <StatusBadge status={ad.status} />
                </td>
                <td className="py-2 px-2">
                  <StatusBadge status={ad.approvalStatus} />
                </td>
                <td className="py-2 px-2 text-right">
                  <MetricValue value={ad.metrics?.impressions || 0} format="number" />
                </td>
                <td className="py-2 px-2 text-right">
                  <MetricValue value={ad.metrics?.clicks || 0} format="number" />
                </td>
                <td className="py-2 px-2 text-right">
                  <MetricValue value={ad.metrics?.ctr || 0} format="percentage" />
                </td>
                <td className="py-2 px-2 text-right">
                  <MetricValue value={ad.metrics?.conversions || 0} format="number" decimals={1} />
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}





