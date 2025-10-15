// src/app/dashboard/layout.tsx
'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useCompany } from '@/hooks/useCompany'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  BarChart3, 
  MessageSquare, 
  FileText, 
  Bell, 
  Settings,
  LogOut
} from 'lucide-react'
import Link from 'next/link'
import { useEffect } from 'react'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { activeCompany, companies, setActiveCompany } = useCompany()

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Google Ads', href: '/dashboard/google-ads', icon: BarChart3 },
    { name: 'Meta Ads', href: '/dashboard/meta', icon: BarChart3 },
    { name: 'Google Analytics 4', href: '/dashboard/ga4', icon: BarChart3 },
    { name: 'TikTok Ads', href: '/dashboard/tiktok', icon: BarChart3 },
    { name: 'AI Chat', href: '/dashboard/chat', icon: MessageSquare },
    { name: 'Reports', href: '/dashboard/reports', icon: FileText },
    { name: 'Alerts', href: '/dashboard/alerts', icon: Bell },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  ]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-800">
          <h1 className="text-2xl font-bold">eMarketer.pro</h1>
        </div>
        
        <nav className="flex-1 overflow-y-auto py-4">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-4 py-3 hover:bg-gray-800 transition-colors"
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-800">
          {/* Company Selector */}
          {companies.length > 1 && (
            <div className="mb-4">
              <select
                value={activeCompany?.id || ''}
                onChange={(e) => {
                  const company = companies.find(c => c.id === e.target.value)
                  if (company) setActiveCompany(company)
                }}
                className="w-full bg-gray-800 text-white rounded px-3 py-2 text-sm"
              >
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{session.user.name}</p>
              <p className="text-xs text-gray-400 truncate">{activeCompany?.name}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => signOut({ callbackUrl: '/' })}
              className="flex-shrink-0 ml-2"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  )
}

