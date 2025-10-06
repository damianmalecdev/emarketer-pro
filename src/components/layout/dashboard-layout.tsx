'use client'

import { useState, useEffect } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet'
import {
  BarChart3,
  FileText,
  Bell,
  Settings,
  Menu,
  Home,
  MessageSquare,
  Zap,
  LogOut,
  User
} from 'lucide-react'
import { useLanguage } from '@/hooks/useLanguage'
import { LanguageSwitcher } from '@/components/language-switcher'

interface DashboardLayoutProps {
  children: React.ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { t } = useLanguage()
  const pathname = usePathname()

  const navigation = [
    { name: t.nav.dashboard, href: '/dashboard', icon: Home },
    { name: t.nav.reports, href: '/reports', icon: FileText },
    { name: t.nav.alerts, href: '/alerts', icon: Bell },
    { name: t.nav.aiAssistant, href: '/chat', icon: MessageSquare },
    { name: t.nav.settings, href: '/settings', icon: Settings },
  ]

  const handleSignOut = async () => {
    await signOut({ callbackUrl: '/' })
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    }
  }, [status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar */}
      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h1 className="text-xl font-bold text-gray-900">eMarketer.pro</h1>
            </div>
            <nav className="flex-1 px-4 py-4 space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <Link
                    key={item.name}
                    href={item.href as any}
                    className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200">
          <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">eMarketer.pro</h1>
          </div>
          <nav className="flex-1 px-4 py-4 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  href={item.href as any}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:bg-gray-100 hover:text-gray-900"
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        {/* Top navigation */}
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="md:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <h2 className="ml-2 text-lg font-semibold text-gray-900">
                Marketing Dashboard
              </h2>
            </div>

            <div className="flex items-center space-x-4">
              {/* Language Switcher */}
              <LanguageSwitcher />

              {/* Notifications */}
              <Button variant="ghost" size="sm">
                <Bell className="h-5 w-5" />
              </Button>

              {/* User menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={session.user?.image || ''} alt={session.user?.name || ''} />
                      <AvatarFallback>
                        {session.user?.name?.charAt(0) || session.user?.email?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {session.user?.name || 'User'}
                      </p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {session.user?.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <User className="mr-2 h-4 w-4" />
                      <span>{t.settings.profile}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/settings" className="flex items-center">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>{t.nav.settings}</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut} className="flex items-center">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t.nav.signOut}</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          {/* Platform sub-navigation */}
          <div className="px-4 pb-3 border-t border-gray-200">
            <div className="flex gap-2">
              <Link
                href="/dashboard/google-ads"
                className={`px-3 py-1.5 text-sm rounded-md ${pathname.startsWith('/dashboard/google-ads') ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              >
                Google Ads
              </Link>
              <Link
                href="/dashboard/meta"
                className={`px-3 py-1.5 text-sm rounded-md ${pathname.startsWith('/dashboard/meta') ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              >
                Meta
              </Link>
              <Link
                href="/dashboard/ga4"
                className={`px-3 py-1.5 text-sm rounded-md ${pathname.startsWith('/dashboard/ga4') ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
              >
                GA4
              </Link>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
