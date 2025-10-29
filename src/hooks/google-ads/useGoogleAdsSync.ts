// React Query mutation hook for Google Ads sync
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { SyncResponse } from '@/types/google-ads'

interface SyncParams {
  companyId: string
}

async function triggerSync(params: SyncParams): Promise<SyncResponse> {
  const response = await fetch('/api/integrations/google-ads/sync', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  })
  
  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to sync Google Ads')
  }
  
  return response.json()
}

export function useGoogleAdsSync() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: triggerSync,
    onSuccess: (_, variables) => {
      // Invalidate all Google Ads queries to refetch updated data
      queryClient.invalidateQueries({
        queryKey: ['google-ads'],
      })
    },
    retry: 1,
  })
}





