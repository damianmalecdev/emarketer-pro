// src/hooks/useCompany.tsx
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEffect } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'

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
  refreshCompanies: () => Promise<void>
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set, get) => ({
      activeCompany: null,
      companies: [],
      loading: true,
      setActiveCompany: (company) => set({ activeCompany: company }),
      setCompanies: (companies) => set({ companies }),
      setLoading: (loading) => set({ loading }),
      refreshCompanies: async () => {
        try {
          set({ loading: true })
          const res = await fetch('/api/companies')
          const data = await res.json()
          
          set({ companies: data })
          
          // Keep current active company if it still exists
          const currentActive = get().activeCompany
          if (currentActive && !data.find((c: Company) => c.id === currentActive.id)) {
            // If current active company no longer exists, set first one as active
            if (data.length > 0) {
              set({ activeCompany: data[0] })
            } else {
              set({ activeCompany: null })
            }
          }
        } catch (error) {
          console.error('Error refreshing companies:', error)
        } finally {
          set({ loading: false })
        }
      },
    }),
    {
      name: 'company-storage',
    }
  )
)

export function useCompany() {
  const { user } = useAuth()
  const { activeCompany, companies, loading, setActiveCompany, setCompanies, setLoading, refreshCompanies } = useCompanyStore()

  useEffect(() => {
    if (user?.id && companies.length === 0) {
      fetchCompanies()
    }
  }, [user])

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/companies')
      const data = await res.json()
      
      console.log('🔍 Fetched companies:', data)
      setCompanies(data)
      
      // Set first company as active if none selected or if current active company doesn't exist
      const currentActive = useCompanyStore.getState().activeCompany
      console.log('🔍 Current active company:', currentActive)
      
      if (!currentActive || !data.find((c: Company) => c.id === currentActive.id)) {
        if (data.length > 0) {
          console.log('🔍 Setting new active company:', data[0])
          setActiveCompany(data[0])
        }
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
    refreshCompanies,
  }
}

