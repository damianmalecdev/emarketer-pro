// React Query hook for Google Ads keywords
import { useQuery } from '@tanstack/react-query'
import { CACHE_TIMES } from '@/lib/google-ads/constants'
import type { GoogleAdsKeywordWithMetrics, ListResponse } from '@/types/google-ads'

interface FetchKeywordsParams {
  companyId: string
  adGroupId?: string
  campaignId?: string
  status?: string
  matchType?: string
}

async function fetchKeywords(
  params: FetchKeywordsParams
): Promise<ListResponse<GoogleAdsKeywordWithMetrics>> {
  const queryParams = new URLSearchParams({
    companyId: params.companyId,
    ...(params.adGroupId && { adGroupId: params.adGroupId }),
    ...(params.campaignId && { campaignId: params.campaignId }),
    ...(params.status && { status: params.status }),
    ...(params.matchType && { matchType: params.matchType }),
  })
  
  const response = await fetch(`/api/google-ads/keywords?${queryParams}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch Google Ads keywords')
  }
  
  return response.json()
}

export function useGoogleAdsKeywords(
  companyId: string | null,
  options: {
    adGroupId?: string
    campaignId?: string
    status?: string
    matchType?: string
  }
) {
  return useQuery({
    queryKey: ['google-ads', 'keywords', companyId, options],
    queryFn: () => fetchKeywords({
      companyId: companyId!,
      ...options,
    }),
    enabled: !!companyId && (!!options.adGroupId || !!options.campaignId),
    staleTime: CACHE_TIMES.keywords,
    retry: 2,
  })
}





