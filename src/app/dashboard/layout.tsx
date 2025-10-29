// src/app/dashboard/layout.tsx
'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useCompany } from '@/hooks/useCompany'
import { Button } from '@/components/ui/button'
import { CompanySwitcher } from '@/components/CompanySwitcher'
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
  const { user, loading } = useAuth()
  const router = useRouter()
  const { activeCompany, companies, setActiveCompany } = useCompany()
  const supabase = createClient()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin')
    }
  }, [user, loading, router])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/auth/signin')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user) {
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
        
        {/* Company Switcher */}
        <div className="p-4 border-b border-gray-800" suppressHydrationWarning>
          <CompanySwitcher className="text-white" />
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
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{user.user_metadata?.full_name || user.email}</p>
              <p className="text-xs text-gray-400 truncate">{activeCompany?.name}</p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleSignOut}
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

