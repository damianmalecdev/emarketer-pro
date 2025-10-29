// React Query hook for Google Ads ads
import { useQuery } from '@tanstack/react-query'
import { CACHE_TIMES } from '@/lib/google-ads/constants'
import type { GoogleAdsAdWithMetrics, ListResponse } from '@/types/google-ads'

interface FetchAdsParams {
  companyId: string
  adGroupId: string
  status?: string
  approvalStatus?: string
}

async function fetchAds(
  params: FetchAdsParams
): Promise<ListResponse<GoogleAdsAdWithMetrics>> {
  const queryParams = new URLSearchParams({
    companyId: params.companyId,
    adGroupId: params.adGroupId,
    ...(params.status && { status: params.status }),
    ...(params.approvalStatus && { approvalStatus: params.approvalStatus }),
  })
  
  const response = await fetch(`/api/google-ads/ads?${queryParams}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch Google Ads ads')
  }
  
  return response.json()
}

export function useGoogleAdsAds(
  companyId: string | null,
  adGroupId: string | null,
  options?: {
    status?: string
    approvalStatus?: string
  }
) {
  return useQuery({
    queryKey: ['google-ads', 'ads', companyId, adGroupId, options],
    queryFn: () => fetchAds({
      companyId: companyId!,
      adGroupId: adGroupId!,
      ...options,
    }),
    enabled: !!companyId && !!adGroupId,
    staleTime: CACHE_TIMES.ads,
    retry: 2,
  })
}





