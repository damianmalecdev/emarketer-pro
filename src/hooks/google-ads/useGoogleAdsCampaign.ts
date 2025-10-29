// React Query hook for single Google Ads campaign
import { useQuery } from '@tanstack/react-query'
import { CACHE_TIMES } from '@/lib/google-ads/constants'
import type { GoogleAdsCampaignWithDetails, DetailResponse } from '@/types/google-ads'

async function fetchCampaign(
  campaignId: string,
  companyId: string
): Promise<DetailResponse<GoogleAdsCampaignWithDetails>> {
  const response = await fetch(
    `/api/google-ads/campaigns/${campaignId}?companyId=${companyId}`
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch Google Ads campaign')
  }
  
  return response.json()
}

export function useGoogleAdsCampaign(
  campaignId: string | null,
  companyId: string | null
) {
  return useQuery({
    queryKey: ['google-ads', 'campaign', campaignId, companyId],
    queryFn: () => fetchCampaign(campaignId!, companyId!),
    enabled: !!campaignId && !!companyId,
    staleTime: CACHE_TIMES.campaigns,
    retry: 2,
  })
}





