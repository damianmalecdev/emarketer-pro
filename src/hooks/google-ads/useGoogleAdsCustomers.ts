// React Query hook for Google Ads customers
import { useQuery } from '@tanstack/react-query'
import { CACHE_TIMES } from '@/lib/google-ads/constants'
import type { GoogleAdsCustomerSummary, ListResponse } from '@/types/google-ads'

async function fetchCustomers(companyId: string): Promise<ListResponse<GoogleAdsCustomerSummary>> {
  const response = await fetch(`/api/google-ads/customers?companyId=${companyId}`)
  
  if (!response.ok) {
    throw new Error('Failed to fetch Google Ads customers')
  }
  
  return response.json()
}

export function useGoogleAdsCustomers(companyId: string | null) {
  return useQuery({
    queryKey: ['google-ads', 'customers', companyId],
    queryFn: () => fetchCustomers(companyId!),
    enabled: !!companyId,
    staleTime: CACHE_TIMES.customers,
    retry: 2,
  })
}





