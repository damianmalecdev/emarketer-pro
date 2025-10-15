// src/app/dashboard/settings/page.tsx
'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useCompany } from '@/hooks/useCompany'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'

interface Integration {
  id: string
  companyId: string
  platform: string
  accountName?: string | null
  isActive: boolean
}

export default function Settings() {
  const { activeCompany } = useCompany()
  const searchParams = useSearchParams()
  const [integrations, setIntegrations] = useState<Integration[]>([])
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState<string | null>(null)

  useEffect(() => {
    if (activeCompany?.id) {
      fetchIntegrations()
    }
  }, [activeCompany])

  useEffect(() => {
    // Check for OAuth success/error messages
    const success = searchParams.get('success')
    const error = searchParams.get('error')
    
    if (success) {
      // Refresh integrations list after successful connection
      setTimeout(() => fetchIntegrations(), 1000)
    }
  }, [searchParams])

  const fetchIntegrations = async () => {
    try {
      const res = await fetch('/api/integrations')
      const data = await res.json()
      setIntegrations(data.integrations || [])
    } catch (error) {
      console.error('Error fetching integrations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnect = async (platform: string) => {
    if (!activeCompany?.id) return
    
    setConnecting(platform)

    try {
      const endpoint = `/api/integrations/${platform}?action=auth-url&companyId=${activeCompany.id}`
      const res = await fetch(endpoint)
      const data = await res.json()

      if (data.authUrl) {
        window.location.href = data.authUrl
      }
    } catch (error) {
      console.error(`Error connecting ${platform}:`, error)
    } finally {
      setConnecting(null)
    }
  }

  const getIntegrationStatus = (platform: string) => {
    return integrations.find(
      i => i.platform === platform && activeCompany && i.companyId === activeCompany.id
    )
  }

  const platforms = [
    {
      id: 'google-ads',
      name: 'Google Ads',
      description: 'Connect your Google Ads campaigns'
    },
    {
      id: 'meta',
      name: 'Meta Ads',
      description: 'Facebook and Instagram advertising'
    },
    {
      id: 'ga4',
      name: 'Google Analytics 4',
      description: 'Website analytics and conversions (Coming Soon)'
    },
    {
      id: 'tiktok',
      name: 'TikTok Ads',
      description: 'TikTok advertising campaigns (Coming Soon)'
    }
  ]

  const success = searchParams.get('success')
  const error = searchParams.get('error')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your platform integrations and preferences
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          <p>Successfully connected {success.replace('_connected', '').replace('_', ' ')}</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <XCircle className="h-5 w-5" />
          <p>Connection failed: {error.replace('_', ' ')}</p>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Platform Integrations</CardTitle>
          <CardDescription>
            Connect your marketing platforms to start analyzing data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            platforms.map((platform) => {
              const integration = getIntegrationStatus(platform.id)
              const isConnected = integration?.isActive
              const isComingSoon = platform.id === 'ga4' || platform.id === 'tiktok'

              return (
                <div key={platform.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{platform.name}</h3>
                    <p className="text-sm text-gray-600">
                      {isConnected 
                        ? `Connected${integration.accountName ? `: ${integration.accountName}` : ''}`
                        : platform.description
                      }
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {isConnected && (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    )}
                    <Button
                      onClick={() => handleConnect(platform.id)}
                      disabled={isComingSoon || connecting === platform.id}
                      variant={isConnected ? 'outline' : 'default'}
                    >
                      {connecting === platform.id ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Connecting...
                        </>
                      ) : isComingSoon ? (
                        'Coming Soon'
                      ) : isConnected ? (
                        'Reconnect'
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  </div>
                </div>
              )
            })
          )}
        </CardContent>
      </Card>
    </div>
  )
}

