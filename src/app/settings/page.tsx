'use client'

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
  CreditCard
} from 'lucide-react'

export default function SettingsPage() {
  const { data: session } = useSession()

  const { data: integrations = [] } = useQuery({
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

  const handleMockConnectMeta = async () => {
    try {
      // Create mock connection for testing
      const mockIntegration = {
        platform: 'meta',
        accessToken: 'mock_meta_token_' + Date.now(),
        accountId: 'act_123456789',
        accountName: 'Mock Meta Ads Account',
        isActive: true
      }

      const response = await fetch('/api/integrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mockIntegration)
      })

      if (response.ok) {
        // Refresh integrations
        window.location.reload()
      }
    } catch (error) {
      console.error('Error connecting Meta (mock):', error)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your account and preferences</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <div className="lg:col-span-2 space-y-6">
            {/* Integrations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <SettingsIcon className="mr-2 h-5 w-5" />
                  Integrations
                </CardTitle>
                <CardDescription>
                  Connect your marketing platforms to sync data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Meta Ads */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">M</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Meta Ads</h3>
                      <p className="text-sm text-gray-600">Facebook & Instagram campaigns</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {integrations.find(i => i.platform === 'meta' && i.isActive) ? (
                      <div className="flex items-center space-x-2">
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          Connected
                        </Badge>
                        <Button onClick={handleReconnectMeta} size="sm" variant="outline">
                          Reconnect
                        </Button>
                        <Button onClick={handleDisconnectMeta} size="sm" variant="destructive">
                          Disconnect
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center space-x-2">
                        <Button onClick={handleConnectMeta} size="sm">
                          Connect
                        </Button>
                        <Button onClick={handleMockConnectMeta} size="sm" variant="outline">
                          Test Mock
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Google Ads */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">G</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Google Ads</h3>
                      <p className="text-sm text-gray-600">Search & display campaigns</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                </div>

                {/* GA4 */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-orange-600 rounded-lg flex items-center justify-center">
                      <span className="text-white font-bold">GA</span>
                    </div>
                    <div>
                      <h3 className="font-medium">Google Analytics 4</h3>
                      <p className="text-sm text-gray-600">Website analytics & conversions</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Badge variant="outline">Coming Soon</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="mr-2 h-5 w-5" />
                  Profile Information
                </CardTitle>
                <CardDescription>
                  Update your personal information and profile details
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
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      defaultValue={session?.user?.name || ''}
                      placeholder="Enter your full name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={session?.user?.email || ''}
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <Button>Save Changes</Button>
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
