// React Query hook for Google Ads campaigns
import { useQuery } from '@tanstack/react-query'
import { CACHE_TIMES } from '@/lib/google-ads/constants'
import type { GoogleAdsCampaignWithMetrics, ListResponse } from '@/types/google-ads'

interface FetchCampaignsParams {
  companyId: string
  customerId?: string
  status?: string
  type?: string
}

async function fetchCampaigns(
  params: FetchCampaignsParams
): Promise<ListResponse<GoogleAdsCampaignWithMetrics>> {
  const queryParams = new URLSearchParams({
    companyId: params.companyId,
    ...(params.customerId && { customerId: params.customerId }),
    ...(params.status && { status: params.status }),
    ...(params.type && { type: params.type }),
  })
  
  const response = await fetch(`/api/google-ads/campaigns?${queryParams}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch Google Ads campaigns')
  }
  
  return response.json()
}

export function useGoogleAdsCampaigns(
  companyId: string | null,
  options?: {
    customerId?: string
    status?: string
    type?: string
  }
) {
  return useQuery({
    queryKey: ['google-ads', 'campaigns', companyId, options],
    queryFn: () => fetchCampaigns({
      companyId: companyId!,
      ...options,
    }),
    enabled: !!companyId,
    staleTime: CACHE_TIMES.campaigns,
    retry: 2,
  })
}





