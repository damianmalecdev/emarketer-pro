// React Query hook for Google Ads ad groups
import { useQuery } from '@tanstack/react-query'
import { CACHE_TIMES } from '@/lib/google-ads/constants'
import type { GoogleAdsAdGroupWithMetrics, ListResponse } from '@/types/google-ads'

interface FetchAdGroupsParams {
  companyId: string
  campaignId: string
  status?: string
}

async function fetchAdGroups(
  params: FetchAdGroupsParams
): Promise<ListResponse<GoogleAdsAdGroupWithMetrics>> {
  const queryParams = new URLSearchParams({
    companyId: params.companyId,
    campaignId: params.campaignId,
    ...(params.status && { status: params.status }),
  })
  
  const response = await fetch(`/api/google-ads/adgroups?${queryParams}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch Google Ads ad groups')
  }
  
  return response.json()
}

export function useGoogleAdsAdGroups(
  companyId: string | null,
  campaignId: string | null,
  options?: {
    status?: string
  }
) {
  return useQuery({
    queryKey: ['google-ads', 'adgroups', companyId, campaignId, options],
    queryFn: () => fetchAdGroups({
      companyId: companyId!,
      campaignId: campaignId!,
      ...options,
    }),
    enabled: !!companyId && !!campaignId,
    staleTime: CACHE_TIMES.adGroups,
    retry: 2,
  })
}





