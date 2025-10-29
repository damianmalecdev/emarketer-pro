// Customer selector dropdown component
'use client'

import { useGoogleAdsCustomers } from '@/hooks/google-ads/useGoogleAdsCustomers'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Building2 } from 'lucide-react'

interface CustomerSelectorProps {
  companyId: string
  value: string | null
  onChange: (customerId: string) => void
}

export function CustomerSelector({ companyId, value, onChange }: CustomerSelectorProps) {
  const { data, isLoading } = useGoogleAdsCustomers(companyId)

  const customers = data?.data || []

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading customers...</span>
      </div>
    )
  }

  if (customers.length === 0) {
    return (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">No customers found</span>
      </div>
    )
  }

  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="w-[280px]">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <SelectValue placeholder="Select a customer account" />
        </div>
      </SelectTrigger>
      <SelectContent>
        {customers.map((customer) => (
          <SelectItem key={customer.id} value={customer.id}>
            <div className="flex flex-col">
              <span className="font-medium">{customer.name}</span>
              <span className="text-xs text-muted-foreground">
                ID: {customer.customerId} • {customer.currency}
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}





