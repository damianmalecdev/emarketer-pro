// React Query hook for Google Ads metrics
import { useQuery } from '@tanstack/react-query'
import { CACHE_TIMES } from '@/lib/google-ads/constants'
import { formatDateToISO } from '@/lib/google-ads/date-utils'
import type { MetricsResponse, EntityType, MetricGranularity } from '@/types/google-ads'

interface FetchMetricsParams {
  companyId: string
  entityType: EntityType
  entityId?: string
  customerId?: string
  startDate: Date
  endDate: Date
  granularity?: MetricGranularity
}

async function fetchMetrics(params: FetchMetricsParams): Promise<MetricsResponse> {
  const queryParams = new URLSearchParams({
    companyId: params.companyId,
    entityType: params.entityType,
    ...(params.entityId && { entityId: params.entityId }),
    ...(params.customerId && { customerId: params.customerId }),
    startDate: formatDateToISO(params.startDate),
    endDate: formatDateToISO(params.endDate),
    granularity: params.granularity || 'daily',
  })
  
  const response = await fetch(`/api/google-ads/metrics?${queryParams}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch Google Ads metrics')
  }
  
  return response.json()
}

export function useGoogleAdsMetrics(
  companyId: string | null,
  options: {
    entityType: EntityType
    entityId?: string
    customerId?: string
    startDate: Date
    endDate: Date
    granularity?: MetricGranularity
  }
) {
  return useQuery({
    queryKey: ['google-ads', 'metrics', companyId, options],
    queryFn: () => fetchMetrics({
      companyId: companyId!,
      ...options,
    }),
    enabled: !!companyId,
    staleTime: CACHE_TIMES.metrics,
    retry: 2,
  })
}





