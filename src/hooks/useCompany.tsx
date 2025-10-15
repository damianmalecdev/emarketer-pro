// src/hooks/useCompany.tsx
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Company {
  id: string
  name: string
  domain?: string | null
}

interface CompanyState {
  activeCompany: Company | null
  companies: Company[]
  loading: boolean
  setActiveCompany: (company: Company) => void
  setCompanies: (companies: Company[]) => void
  setLoading: (loading: boolean) => void
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      activeCompany: null,
      companies: [],
      loading: true,
      setActiveCompany: (company) => set({ activeCompany: company }),
      setCompanies: (companies) => set({ companies }),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'company-storage',
    }
  )
)

export function useCompany() {
  const { data: session } = useSession()
  const { activeCompany, companies, loading, setActiveCompany, setCompanies, setLoading } = useCompanyStore()

  useEffect(() => {
    if (session?.user?.id && companies.length === 0) {
      fetchCompanies()
    }
  }, [session])

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/companies')
      const data = await res.json()
      
      setCompanies(data.companies)
      
      // Set first company as active if none selected
      if (!activeCompany && data.companies.length > 0) {
        setActiveCompany(data.companies[0])
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    activeCompany,
    companies,
    loading,
    setActiveCompany,
  }
}

