// src/app/dashboard/page.tsx
'use client'

import { useCompany } from '@/hooks/useCompany'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { BarChart3, TrendingUp, DollarSign, Target, Plus, ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

interface AggregatedMetrics {
  totalSpend: number;
  totalRevenue: number;
  totalConversions: number;
  avgRoas: number;
  totalClicks: number;
  totalImpressions: number;
}

export default function Dashboard() {
  const { activeCompany, loading } = useCompany()
  const [aggregatedMetrics, setAggregatedMetrics] = useState<AggregatedMetrics | null>(null)
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true)
  const [integrations, setIntegrations] = useState<any[]>([])

  // Fetch aggregated metrics across all platforms
  useEffect(() => {
    if (activeCompany) {
      fetchAggregatedMetrics()
      fetchIntegrations()
    }
  }, [activeCompany])

  const fetchAggregatedMetrics = async () => {
    if (!activeCompany) return
    
    setIsLoadingMetrics(true)
    try {
      // Fetch metrics from all platforms for this company
      const response = await fetch(`/api/metrics?companyId=${activeCompany.id}`)
      const data = await response.json()
      
      if (response.ok && data.metrics) {
        // Aggregate metrics across all platforms
        const aggregated = data.metrics.reduce((acc: any, metric: any) => {
          acc.totalSpend += metric.cost
          acc.totalRevenue += metric.revenue
          acc.totalConversions += metric.conversions
          acc.totalClicks += metric.clicks
          acc.totalImpressions += metric.impressions
          return acc
        }, {
          totalSpend: 0,
          totalRevenue: 0,
          totalConversions: 0,
          totalClicks: 0,
          totalImpressions: 0
        })

        // Calculate average ROAS
        aggregated.avgRoas = aggregated.totalSpend > 0 ? aggregated.totalRevenue / aggregated.totalSpend : 0

        setAggregatedMetrics(aggregated)
      }
    } catch (error) {
      console.error('Error fetching aggregated metrics:', error)
    } finally {
      setIsLoadingMetrics(false)
    }
  }

  const fetchIntegrations = async () => {
    if (!activeCompany) return
    
    try {
      const response = await fetch('/api/integrations')
      const data = await response.json()
      
      if (response.ok) {
        setIntegrations(data.integrations || [])
      }
    } catch (error) {
      console.error('Error fetching integrations:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here&apos;s an overview of your marketing performance.
          </p>
        </div>
        <Link href="/dashboard/settings">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Connect Platform
          </Button>
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingMetrics ? (
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
              ) : (
                `$${aggregatedMetrics?.totalSpend.toFixed(2) || '0.00'}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {aggregatedMetrics?.totalSpend > 0 
                ? `${integrations.length} platform${integrations.length !== 1 ? 's' : ''} connected`
                : 'Connect platforms to see data'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingMetrics ? (
                <div className="animate-pulse bg-gray-200 h-8 w-20 rounded"></div>
              ) : (
                `$${aggregatedMetrics?.totalRevenue.toFixed(2) || '0.00'}`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {aggregatedMetrics?.totalRevenue > 0 
                ? `Generated from campaigns`
                : 'Connect platforms to see data'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROAS</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingMetrics ? (
                <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
              ) : (
                `${aggregatedMetrics?.avgRoas.toFixed(2) || '0.00'}x`
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {aggregatedMetrics?.avgRoas > 0 
                ? `Return on ad spend`
                : 'Connect platforms to see data'
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoadingMetrics ? (
                <div className="animate-pulse bg-gray-200 h-8 w-12 rounded"></div>
              ) : (
                aggregatedMetrics?.totalConversions || '0'
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {aggregatedMetrics?.totalConversions > 0 
                ? `Across all platforms`
                : 'Connect platforms to see data'
              }
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Marketing Platforms</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              Navigate to your platform-specific dashboards or connect new integrations:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { 
                  name: 'Google Ads', 
                  href: '/dashboard/google-ads', 
                  platform: 'google-ads', 
                  icon: BarChart3 
                },
                { 
                  name: 'Meta Ads', 
                  href: '/dashboard/meta', 
                  platform: 'meta', 
                  icon: Target 
                },
                { 
                  name: 'Google Analytics', 
                  href: '/dashboard/ga4', 
                  platform: 'ga4', 
                  icon: BarChart3 
                },
                { 
                  name: 'TikTok Ads', 
                  href: '/dashboard/tiktok', 
                  platform: 'tiktok', 
                  icon: TrendingUp 
                }
              ].map((platform) => {
                const isConnected = integrations.some(integration => 
                  integration.platform === platform.platform && integration.isActive
                )
                
                return (
                  <div key={platform.platform} className="flex flex-col gap-2">
                    <Link href={platform.href}>
                      <Button 
                        variant={isConnected ? "default" : "outline"} 
                        className="w-full"
                      >
                        <platform.icon className="mr-2 h-4 w-4" />
                        {platform.name}
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                    <Link href="/dashboard/settings">
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="w-full text-xs"
                      >
                        {isConnected ? 'Manage' : 'Connect'}
                      </Button>
                    </Link>
                    {isConnected && (
                      <div className="flex items-center justify-center">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="ml-1 text-xs text-green-600">Connected</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          {integrations.length > 0 ? (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Charts and detailed analytics coming soon</p>
                <p className="text-sm mt-2">
                  {integrations.length} platform{integrations.length !== 1 ? 's' : ''} connected
                </p>
              </div>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-400">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p>Connect platforms to view performance charts</p>
                <Link href="/dashboard/settings">
                  <Button className="mt-4" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Connect Your First Platform
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

