// React Query hook for single Google Ads customer
import { useQuery } from '@tanstack/react-query'
import { CACHE_TIMES } from '@/lib/google-ads/constants'
import type { GoogleAdsCustomer, DetailResponse } from '@/types/google-ads'

async function fetchCustomer(
  customerId: string,
  companyId: string
): Promise<DetailResponse<GoogleAdsCustomer>> {
  const response = await fetch(
    `/api/google-ads/customers/${customerId}?companyId=${companyId}`
  )
  
  if (!response.ok) {
    throw new Error('Failed to fetch Google Ads customer')
  }
  
  return response.json()
}

export function useGoogleAdsCustomer(
  customerId: string | null,
  companyId: string | null
) {
  return useQuery({
    queryKey: ['google-ads', 'customer', customerId, companyId],
    queryFn: () => fetchCustomer(customerId!, companyId!),
    enabled: !!customerId && !!companyId,
    staleTime: CACHE_TIMES.customers,
    retry: 2,
  })
}





