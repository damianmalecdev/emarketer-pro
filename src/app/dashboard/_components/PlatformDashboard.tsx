'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '@/components/ui/select'
import { 
  TrendingUp, 
  DollarSign, 
  MousePointer, 
  Target, 
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

type Platform = 'google-ads' | 'meta' | 'ga4'

export function PlatformDashboard({ platform }: { platform: Platform }) {
  const [accountId, setAccountId] = React.useState<string | undefined>(undefined)
  const [startDate, setStartDate] = React.useState<string>("")
  const [endDate, setEndDate] = React.useState<string>("")

  const { data: integrationsData } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const res = await fetch('/api/integrations')
      const json = await res.json()
      return json.integrations || []
    },
  })

  const platformAccounts = React.useMemo(
    () => (integrationsData || []).filter((i: any) => i.platform === platform),
    [integrationsData, platform]
  )

  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await fetch('/api/alerts?limit=5')
      const data = await response.json()
      return data.alerts || []
    }
  })

  const { data: analytics } = useQuery({
    queryKey: ['dashboard-analytics', { platform, accountId, startDate, endDate }],
    queryFn: async () => {
      const params = new URLSearchParams()
      params.set('platform', platform)
      if (platform === 'google-ads' && accountId) params.set('googleAccountId', accountId)
      if (platform === 'meta' && accountId) params.set('metaAccountId', accountId)
      if (platform === 'ga4' && accountId) params.set('ga4AccountId', accountId)
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      const url = `/api/analytics/dashboard?${params.toString()}`
      const response = await fetch(url)
      const data = await response.json()
      return data
    }
  })

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertTriangle className="h-4 w-4" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />
      case 'success':
        return <CheckCircle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'error':
        return 'destructive'
      case 'warning':
        return 'default'
      case 'success':
        return 'default'
      default:
        return 'default'
    }
  }

  const titles: Record<Platform, string> = {
    'google-ads': 'Dashboard — Google Ads',
    meta: 'Dashboard — Meta',
    ga4: 'Dashboard — GA4',
  }

  const selectLabel: Record<Platform, string> = {
    'google-ads': 'Google Ads',
    meta: 'Meta',
    ga4: 'GA4',
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{titles[platform]}</h1>
            <p className="text-gray-600">Overview of your marketing performance</p>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <div className="flex flex-col gap-2">
            <Label htmlFor="accountSelect">{selectLabel[platform]}</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger id="accountSelect" className="w-full">
                <SelectValue placeholder={`Wybierz konto ${selectLabel[platform]}`} />
              </SelectTrigger>
              <SelectContent>
                {platformAccounts.map((acc: any) => (
                  <SelectItem key={acc.id} value={acc.accountId || 'default'}>
                    {acc.accountName || acc.accountId || 'default'}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="startDate">Od</Label>
            <Input id="startDate" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="endDate">Do</Label>
            <Input id="endDate" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={() => { setStartDate(new Date(Date.now() - 6*24*60*60*1000).toISOString().slice(0,10)); setEndDate(new Date().toISOString().slice(0,10)) }}>7 dni</Button>
            <Button variant="outline" size="sm" onClick={() => { setStartDate(new Date(Date.now() - 29*24*60*60*1000).toISOString().slice(0,10)); setEndDate(new Date().toISOString().slice(0,10)) }}>30 dni</Button>
            <Button variant="outline" size="sm" onClick={() => { setStartDate(new Date(Date.now() - 89*24*60*60*1000).toISOString().slice(0,10)); setEndDate(new Date().toISOString().slice(0,10)) }}>90 dni</Button>
            <Button variant="ghost" size="sm" onClick={() => { setStartDate(""); setEndDate(""); setAccountId(undefined) }}>Wyczyść</Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(analytics?.kpis?.totalSpend || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+12.5%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${(analytics?.kpis?.totalRevenue || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+18.2%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
              <MousePointer className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(analytics?.kpis?.totalClicks || 0).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+8.7%</span> from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average ROAS</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{(analytics?.kpis?.avgROAS || 0).toFixed(2)}x</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">+0.3x</span> from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Spend vs Revenue</CardTitle>
              <CardDescription>Daily performance over the selected period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics?.chartData || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="spend" stroke="#8884d8" strokeWidth={2} />
                  <Line type="monotone" dataKey="revenue" stroke="#82ca9d" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Campaigns by ROAS</CardTitle>
              <CardDescription>Best performing campaigns this period</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics?.topCampaigns || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="roas" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Alerts and Top Campaigns */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Alerts</CardTitle>
              <CardDescription>Important notifications about your campaigns</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {alerts.slice(0, 3).map((alert: any) => (
                <Alert key={alert.id} variant={getAlertVariant(alert.type)}>
                  {getAlertIcon(alert.type)}
                  <AlertDescription>{alert.message}</AlertDescription>
                </Alert>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Top Campaigns</CardTitle>
              <CardDescription>Your best performing campaigns</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(analytics?.topCampaigns || []).map((campaign: any, index: number) => (
                  <div key={index} className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-sm text-gray-600">{campaign.platform}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${campaign.revenue.toLocaleString()}</p>
                      <Badge variant="secondary">{campaign.roas.toFixed(2)}x ROAS</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}

export default PlatformDashboard


