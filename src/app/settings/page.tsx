'use client'
export const dynamic = 'force-dynamic'

import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  User, 
  Mail, 
  Calendar,
  Settings as SettingsIcon,
  Shield,
  CreditCard,
  RefreshCw,
  Loader2
} from 'lucide-react'
import { useState } from 'react'
import { useLanguage } from '@/hooks/useLanguage'

interface Integration {
  id: string
  platform: string
  isActive: boolean
  accountId?: string
  accountName?: string
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const { t } = useLanguage()
  const [isSyncing, setIsSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')

  const { data: integrations = [] } = useQuery<Integration[]>({
    queryKey: ['integrations'],
    queryFn: async () => {
      const response = await fetch('/api/integrations')
      const data = await response.json()
      return data.integrations || []
    }
  })

  const handleConnectMeta = async () => {
    try {
      // Redirect to Meta OAuth
      const response = await fetch('/api/integrations/meta?action=auth-url')
      const data = await response.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Error connecting Meta:', error)
    }
  }

  const handleReconnectMeta = async () => {
    try {
      // Remove existing integration first
      const existingIntegration = integrations.find(i => i.platform === 'meta' && i.isActive)
      if (existingIntegration) {
        await fetch(`/api/integrations?id=${existingIntegration.id}`, {
          method: 'DELETE'
        })
      }

      // Redirect to Meta OAuth (same as Connect)
      const response = await fetch('/api/integrations/meta?action=auth-url')
      const data = await response.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Error reconnecting Meta:', error)
    }
  }

  const handleDisconnectMeta = async () => {
    try {
      const existingIntegration = integrations.find(i => i.platform === 'meta' && i.isActive)
      if (existingIntegration) {
        await fetch(`/api/integrations?id=${existingIntegration.id}`, {
          method: 'DELETE'
        })
        // Refresh integrations
        window.location.reload()
      }
    } catch (error) {
      console.error('Error disconnecting Meta:', error)
    }
  }

  const handleSyncMeta = async () => {
    try {
      setIsSyncing(true)
      setSyncMessage('Syncing data from Meta Ads API...')

      const response = await fetch('/api/integrations/meta/sync', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        setSyncMessage(`✅ Successfully synced ${data.campaigns} campaigns with ${data.insights} insights from Meta!`)
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setSyncMessage(`❌ ${data.error || 'Sync failed'}`)
        setTimeout(() => setSyncMessage(''), 8000)
      }
    } catch (error) {
      console.error('Error syncing Meta:', error)
      setSyncMessage('❌ Sync failed: ' + String(error))
      setTimeout(() => setSyncMessage(''), 8000)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleConnectGoogleAds = async () => {
    try {
      const response = await fetch('/api/integrations/google-ads?action=auth-url')
      const data = await response.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Error connecting Google Ads:', error)
    }
  }

  const handleSyncGoogleAds = async () => {
    try {
      setIsSyncing(true)
      setSyncMessage('Syncing data from Google Ads API...')

      const response = await fetch('/api/integrations/google-ads/sync', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        setSyncMessage(`✅ Successfully synced ${data.campaigns} campaigns from Google Ads!`)
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setSyncMessage(`❌ ${data.error || 'Sync failed'}`)
        setTimeout(() => setSyncMessage(''), 8000)
      }
    } catch (error) {
      console.error('Error syncing Google Ads:', error)
      setSyncMessage('❌ Sync failed: ' + String(error))
      setTimeout(() => setSyncMessage(''), 8000)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDisconnectGoogleAds = async () => {
    try {
      const existingIntegration = integrations.find(i => i.platform === 'google-ads' && i.isActive)
      if (existingIntegration) {
        await fetch(`/api/integrations?id=${existingIntegration.id}`, {
          method: 'DELETE'
        })
        window.location.reload()
      }
    } catch (error) {
      console.error('Error disconnecting Google Ads:', error)
    }
  }

  // GA4 handlers
  const handleConnectGA4 = async () => {
    try {
      const response = await fetch('/api/integrations/ga4', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'auth-url' })
      })
      const data = await response.json()
      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error('Error connecting GA4:', error)
    }
  }

  const handleSyncGA4 = async () => {
    try {
      setIsSyncing(true)
      setSyncMessage('Syncing data from Google Analytics 4...')

      const response = await fetch('/api/integrations/ga4/sync', {
        method: 'POST'
      })

      const data = await response.json()

      if (response.ok) {
        setSyncMessage(`✅ Successfully synced ${data.events} events from GA4!`)
        setTimeout(() => {
          window.location.reload()
        }, 2000)
      } else {
        setSyncMessage(`❌ ${data.error || 'Sync failed'}`)
        setTimeout(() => setSyncMessage(''), 8000)
      }
    } catch (error) {
      console.error('Error syncing GA4:', error)
      setSyncMessage('❌ Sync failed: ' + String(error))
      setTimeout(() => setSyncMessage(''), 8000)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleDisconnectGA4 = async () => {
    try {
      const existingIntegration = integrations.find(i => i.platform === 'ga4' && i.isActive)
      if (existingIntegration) {
        await fetch(`/api/integrations?id=${existingIntegration.id}`, {
          method: 'DELETE'
        })
        window.location.reload()
      }
    } catch (error) {
      console.error('Error disconnecting GA4:', error)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t.settings.title}</h1>
          <p className="text-gray-600">{t.settings.subtitle}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Integrations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <SettingsIcon className="mr-2 h-5 w-5" />
                  {t.settings.integrations}
                </CardTitle>
                <CardDescription>
                  {t.settings.integrationsDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Meta Ads */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">M</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{t.settings.platforms.meta.name}</h3>
                        <p className="text-sm text-gray-600">{t.settings.platforms.meta.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {integrations.find(i => i.platform === 'meta' && i.isActive) ? (
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {t.settings.connected}
                          </Badge>
                          <Button 
                            onClick={handleSyncMeta} 
                            size="sm" 
                            variant="outline"
                            disabled={isSyncing}
                          >
                            {isSyncing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            <span className="ml-2">{isSyncing ? t.settings.syncing : t.settings.syncData}</span>
                          </Button>
                          <Button onClick={handleReconnectMeta} size="sm" variant="outline">
                            {t.settings.reconnect}
                          </Button>
                          <Button onClick={handleDisconnectMeta} size="sm" variant="destructive">
                            {t.settings.disconnect}
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={handleConnectMeta} size="sm">
                          {t.settings.connect}
                        </Button>
                      )}
                    </div>
                  </div>
                  {syncMessage && (
                    <div className="text-sm p-2 bg-blue-50 text-blue-900 rounded">
                      {syncMessage}
                    </div>
                  )}
                </div>

                {/* Google Ads */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">G</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{t.settings.platforms.googleAds.name}</h3>
                        <p className="text-sm text-gray-600">{t.settings.platforms.googleAds.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {integrations.find(i => i.platform === 'google-ads' && i.isActive) ? (
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {t.settings.connected}
                          </Badge>
                          <Button 
                            onClick={handleSyncGoogleAds} 
                            size="sm" 
                            variant="outline"
                            disabled={isSyncing}
                          >
                            {isSyncing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            <span className="ml-2">{isSyncing ? t.settings.syncing : t.settings.syncData}</span>
                          </Button>
                          <Button onClick={handleDisconnectGoogleAds} size="sm" variant="destructive">
                            {t.settings.disconnect}
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={handleConnectGoogleAds} size="sm">
                          {t.settings.connect}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* GA4 */}
                <div className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">GA</span>
                      </div>
                      <div>
                        <h3 className="font-medium">{t.settings.platforms.ga4.name}</h3>
                        <p className="text-sm text-gray-600">{t.settings.platforms.ga4.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {integrations.find(i => i.platform === 'ga4' && i.isActive) ? (
                        <div className="flex items-center space-x-2">
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            {t.settings.connected}
                          </Badge>
                          <Button 
                            onClick={handleSyncGA4} 
                            size="sm" 
                            variant="outline"
                            disabled={isSyncing}
                          >
                            {isSyncing ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <RefreshCw className="h-4 w-4" />
                            )}
                            <span className="ml-2">{isSyncing ? t.settings.syncing : t.settings.syncData}</span>
                          </Button>
                          <Button onClick={handleDisconnectGA4} size="sm" variant="destructive">
                            {t.settings.disconnect}
                          </Button>
                        </div>
                      ) : (
                        <Button onClick={handleConnectGA4} size="sm">
                          {t.settings.connect}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  {t.settings.profile}
                </CardTitle>
                <CardDescription>
                  {t.settings.profileDescription}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={session?.user?.image || ''} alt={session?.user?.name || ''} />
                    <AvatarFallback className="text-lg">
                      {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button variant="outline" size="sm">
                      Change Avatar
                    </Button>
                    <p className="text-xs text-gray-500 mt-1">
                      JPG, PNG or GIF. Max size 2MB.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">{t.settings.name}</Label>
                    <Input
                      id="name"
                      defaultValue={session?.user?.name || ''}
                      placeholder={t.settings.name}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">{t.settings.email}</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={session?.user?.email || ''}
                      placeholder={t.settings.email}
                    />
                  </div>
                </div>

                <Button>{t.settings.saveChanges}</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="mr-2 h-5 w-5" />
                  Security
                </CardTitle>
                <CardDescription>
                  Manage your password and security settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    placeholder="Enter current password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    placeholder="Enter new password"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    placeholder="Confirm new password"
                  />
                </div>
                <Button>Update Password</Button>
              </CardContent>
            </Card>
          </div>

          {/* Account Info Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <SettingsIcon className="mr-2 h-5 w-5" />
                  Account Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Plan</span>
                  <Badge variant="secondary">Free</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Role</span>
                  <Badge variant="outline">User</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Member since</span>
                  <span className="text-sm text-gray-900">
                    {session?.user ? new Date().toLocaleDateString() : 'N/A'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <CreditCard className="mr-2 h-5 w-5" />
                  Billing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center">
                  <h3 className="text-lg font-medium">Free Plan</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    You're currently on the free plan
                  </p>
                  <Button className="mt-4" variant="outline">
                    Upgrade to Pro
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Mail className="mr-2 h-4 w-4" />
                  Export Data
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Calendar className="mr-2 h-4 w-4" />
                  Download Reports
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="mr-2 h-4 w-4" />
                  Privacy Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
