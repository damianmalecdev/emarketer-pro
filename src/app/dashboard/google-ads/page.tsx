"use client"

import { useState, useEffect } from 'react'
import { useCompany } from '@/hooks/useCompany'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  RefreshCw, 
  Settings,
  AlertCircle 
} from 'lucide-react'
import Link from 'next/link'

// Google Ads hooks
import { useGoogleAdsCustomers } from '@/hooks/google-ads/useGoogleAdsCustomers'
import { useGoogleAdsCampaigns } from '@/hooks/google-ads/useGoogleAdsCampaigns'
import { useGoogleAdsAdGroups } from '@/hooks/google-ads/useGoogleAdsAdGroups'
import { useGoogleAdsAds } from '@/hooks/google-ads/useGoogleAdsAds'
import { useGoogleAdsKeywords } from '@/hooks/google-ads/useGoogleAdsKeywords'
import { useGoogleAdsMetrics } from '@/hooks/google-ads/useGoogleAdsMetrics'
import { useGoogleAdsSync } from '@/hooks/google-ads/useGoogleAdsSync'

// Components
import { CustomerSelector } from '@/components/google-ads/shared/CustomerSelector'
import { MetricCard } from '@/components/google-ads/shared/MetricCard'
import { LoadingTable } from '@/components/google-ads/shared/LoadingTable'
import { EmptyState } from '@/components/google-ads/shared/EmptyState'
import { CampaignList } from '@/components/google-ads/campaigns/CampaignList'
import { AdGroupList } from '@/components/google-ads/adgroups/AdGroupList'
import { AdList } from '@/components/google-ads/ads/AdList'
import { KeywordTable } from '@/components/google-ads/keywords/KeywordTable'
import { MetricsChart } from '@/components/google-ads/metrics/MetricsChart'

// Utils
import { getLastNDays } from '@/lib/google-ads/date-utils'
import { formatRelativeTime } from '@/lib/google-ads/formatting'

export default function GoogleAdsPage() {
  const { activeCompany } = useCompany()
  
  // State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [expandedCampaignId, setExpandedCampaignId] = useState<string | null>(null)
  const [selectedAdGroupId, setSelectedAdGroupId] = useState<string | null>(null)
  
  // Date range for metrics (last 30 days)
  const { startDate, endDate } = getLastNDays(30)

  // Load selected customer from localStorage
  useEffect(() => {
    if (activeCompany) {
      const savedCustomerId = localStorage.getItem(`google-ads-customer-${activeCompany.id}`)
      if (savedCustomerId) {
        setSelectedCustomerId(savedCustomerId)
      }
    }
  }, [activeCompany])

  // Save selected customer to localStorage
  const handleCustomerChange = (customerId: string) => {
    setSelectedCustomerId(customerId)
    if (activeCompany) {
      localStorage.setItem(`google-ads-customer-${activeCompany.id}`, customerId)
    }
    // Reset expanded state when changing customers
    setExpandedCampaignId(null)
    setSelectedAdGroupId(null)
  }

  // Queries
  const { data: customersData, isLoading: isLoadingCustomers } = useGoogleAdsCustomers(activeCompany?.id || null)
  const { data: campaignsData, isLoading: isLoadingCampaigns } = useGoogleAdsCampaigns(
    activeCompany?.id || null,
    { customerId: selectedCustomerId || undefined }
  )
  const { data: adGroupsData, isLoading: isLoadingAdGroups } = useGoogleAdsAdGroups(
    activeCompany?.id || null,
    expandedCampaignId,
    { status: 'ENABLED' }
  )
  const { data: adsData, isLoading: isLoadingAds } = useGoogleAdsAds(
    activeCompany?.id || null,
    selectedAdGroupId
  )
  const { data: keywordsData, isLoading: isLoadingKeywords } = useGoogleAdsKeywords(
    activeCompany?.id || null,
    { adGroupId: selectedAdGroupId || undefined }
  )
  const { data: metricsData } = useGoogleAdsMetrics(
    activeCompany?.id || null,
    {
      entityType: 'CAMPAIGN',
      customerId: selectedCustomerId || undefined,
      startDate,
      endDate,
      granularity: 'daily',
    }
  )

  // Sync mutation
  const syncMutation = useGoogleAdsSync()

  const handleSync = () => {
    if (activeCompany) {
      syncMutation.mutate({ companyId: activeCompany.id })
    }
  }

  const handleCampaignClick = (campaignId: string) => {
    if (expandedCampaignId === campaignId) {
      setExpandedCampaignId(null)
      setSelectedAdGroupId(null)
    } else {
      setExpandedCampaignId(campaignId)
      setSelectedAdGroupId(null)
    }
  }

  const handleAdGroupClick = (adGroupId: string) => {
    setSelectedAdGroupId(selectedAdGroupId === adGroupId ? null : adGroupId)
  }

  // Data
  const customers = customersData?.data || []
  const campaigns = campaignsData?.data || []
  const adGroups = adGroupsData?.data || []
  const ads = adsData?.data || []
  const keywords = keywordsData?.data || []
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId)
  const aggregated = metricsData?.aggregated
  const metrics = metricsData?.metrics || []

  // Loading state
  if (!activeCompany) {
    return (
      <EmptyState
        icon={BarChart3}
        title="No Company Selected"
        description="Please select a company to view Google Ads data."
      />
    )
  }

  // No customers state
  if (!isLoadingCustomers && customers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Google Ads</h1>
            <p className="text-muted-foreground">Connect your Google Ads account to get started</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Connect Google Ads</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Connect your Google Ads account to start tracking campaigns, keywords, and performance metrics.
            </p>
            <div className="flex gap-4">
              <Button asChild>
                <Link href="/dashboard/settings">
                  Connect Google Ads
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold">Google Ads</h1>
          <p className="text-muted-foreground">Monitor your Google Ads performance and campaigns</p>
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={handleSync} 
            disabled={syncMutation.isPending}
            variant="outline"
            size="default"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Syncing...' : 'Sync Now'}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/settings">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Link>
          </Button>
        </div>
      </div>

      {/* Customer Selector */}
      <div className="flex items-center justify-between">
        <CustomerSelector
          companyId={activeCompany.id}
          value={selectedCustomerId}
          onChange={handleCustomerChange}
        />
        {selectedCustomer?.lastSyncAt && (
          <span className="text-sm text-muted-foreground">
            Last synced {formatRelativeTime(selectedCustomer.lastSyncAt)}
          </span>
        )}
      </div>

      {!selectedCustomerId ? (
        <Card>
          <CardContent className="py-12">
            <EmptyState
              icon={AlertCircle}
              title="Select a Customer Account"
              description="Choose a Google Ads customer account from the dropdown above to view campaigns and metrics."
            />
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard
              title="Total Spend"
              value={aggregated?.totalSpend || 0}
              icon={DollarSign}
              format="currency"
              currency={selectedCustomer?.currency}
              subtitle={`Avg CPC: ${aggregated?.avgCpc.toFixed(2) || '0.00'}`}
            />
            <MetricCard
              title="Impressions"
              value={aggregated?.totalImpressions || 0}
              icon={BarChart3}
              format="number"
              subtitle={`CTR: ${aggregated?.avgCtr.toFixed(2) || '0.00'}%`}
            />
            <MetricCard
              title="Clicks"
              value={aggregated?.totalClicks || 0}
              icon={Users}
              format="number"
              subtitle={`Conv. Rate: ${aggregated?.avgConversionRate.toFixed(2) || '0.00'}%`}
            />
            <MetricCard
              title="Conversions"
              value={aggregated?.totalConversions || 0}
              icon={TrendingUp}
              format="number"
              subtitle={`ROAS: ${aggregated?.avgRoas.toFixed(2) || '0.00'}x`}
            />
          </div>

          {/* Performance Chart */}
          {metrics.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Performance (Last 30 Days)</CardTitle>
              </CardHeader>
              <CardContent>
                <MetricsChart
                  data={metrics}
                  metrics={['clicks', 'cost', 'conversions']}
                  type="area"
                  currency={selectedCustomer?.currency}
                  height={300}
                />
              </CardContent>
            </Card>
          )}

          {/* Campaigns List */}
          <Card>
            <CardHeader>
              <CardTitle>Campaigns ({campaigns.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoadingCampaigns ? (
                <LoadingTable rows={5} columns={11} />
              ) : campaigns.length === 0 ? (
                <EmptyState
                  icon={BarChart3}
                  title="No Campaigns Found"
                  description="No campaigns found for this customer account. Try syncing your account or create a campaign in Google Ads."
                  action={{
                    label: 'Sync Now',
                    onClick: handleSync,
                  }}
                />
              ) : (
                <CampaignList
                  campaigns={campaigns}
                  currency={selectedCustomer?.currency}
                  onCampaignClick={handleCampaignClick}
                  expandedCampaignId={expandedCampaignId}
                >
                  {(campaign) => (
                    <div className="space-y-4">
                      {/* Ad Groups Section */}
                      <div>
                        <h4 className="font-semibold mb-2">Ad Groups ({campaign.adGroupCount})</h4>
                        {isLoadingAdGroups ? (
                          <LoadingTable rows={3} columns={8} />
                        ) : adGroups.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No ad groups found</p>
                        ) : (
                          <AdGroupList
                            adGroups={adGroups}
                            currency={selectedCustomer?.currency}
                            onAdGroupClick={handleAdGroupClick}
                          />
                        )}
                      </div>

                      {/* Ads & Keywords Tabs */}
                      {selectedAdGroupId && (
                        <Tabs defaultValue="ads" className="mt-4">
                          <TabsList>
                            <TabsTrigger value="ads">Ads ({ads.length})</TabsTrigger>
                            <TabsTrigger value="keywords">Keywords ({keywords.length})</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="ads" className="mt-4">
                            {isLoadingAds ? (
                              <LoadingTable rows={3} columns={8} />
                            ) : ads.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No ads found</p>
                            ) : (
                              <AdList ads={ads} currency={selectedCustomer?.currency} />
                            )}
                          </TabsContent>
                          
                          <TabsContent value="keywords" className="mt-4">
                            {isLoadingKeywords ? (
                              <LoadingTable rows={3} columns={10} />
                            ) : keywords.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No keywords found</p>
                            ) : (
                              <KeywordTable keywords={keywords} currency={selectedCustomer?.currency} />
                            )}
                          </TabsContent>
                        </Tabs>
                      )}
                    </div>
                  )}
                </CampaignList>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
