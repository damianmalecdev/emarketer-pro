'use client'

import { useQuery } from '@tanstack/react-query'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  MousePointer, 
  Target, 
  Zap,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

// Mock data for demonstration
const mockKpiData = {
  totalSpend: 15420.50,
  totalRevenue: 45680.25,
  totalClicks: 12540,
  totalConversions: 342,
  avgCTR: 2.4,
  avgCPC: 1.23,
  avgROAS: 2.96
}

const mockChartData = [
  { date: '2024-01-01', spend: 1200, revenue: 3600, clicks: 800 },
  { date: '2024-01-02', spend: 1350, revenue: 4200, clicks: 920 },
  { date: '2024-01-03', spend: 1100, revenue: 3100, clicks: 750 },
  { date: '2024-01-04', spend: 1600, revenue: 4800, clicks: 1100 },
  { date: '2024-01-05', spend: 1450, revenue: 4100, clicks: 980 },
  { date: '2024-01-06', spend: 1800, revenue: 5200, clicks: 1200 },
  { date: '2024-01-07', spend: 1650, revenue: 4600, clicks: 1050 },
]

const mockAlerts = [
  {
    id: '1',
    message: 'CTR dropped by 25% in "Summer Sale 2024" campaign',
    type: 'warning',
    severity: 'medium',
    createdAt: new Date()
  },
  {
    id: '2',
    message: 'ROAS below target (2.5x) for "Black Friday Campaign"',
    type: 'error',
    severity: 'high',
    createdAt: new Date()
  },
  {
    id: '3',
    message: 'New high-performing campaign detected: "Holiday Shopping"',
    type: 'info',
    severity: 'low',
    createdAt: new Date()
  }
]

const mockTopCampaigns = [
  { name: 'Holiday Shopping', platform: 'Meta', spend: 2500, revenue: 8500, roas: 3.4 },
  { name: 'Black Friday Campaign', platform: 'Google', spend: 3200, revenue: 9600, roas: 3.0 },
  { name: 'Summer Sale 2024', platform: 'Meta', spend: 1800, revenue: 5400, roas: 3.0 },
  { name: 'Lead Generation', platform: 'Google', spend: 1200, revenue: 3600, roas: 3.0 },
]

export default function DashboardPage() {
  const { data: alerts = [] } = useQuery({
    queryKey: ['alerts'],
    queryFn: async () => {
      const response = await fetch('/api/alerts?limit=5')
      const data = await response.json()
      return data.alerts || mockAlerts
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600">Overview of your marketing performance</p>
          </div>
          <Button onClick={() => fetch('/api/mock-data', { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'create-mock-campaigns' })
          })}>
            <Zap className="mr-2 h-4 w-4" />
            Generate Mock Data
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${mockKpiData.totalSpend.toLocaleString()}</div>
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
              <div className="text-2xl font-bold">${mockKpiData.totalRevenue.toLocaleString()}</div>
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
              <div className="text-2xl font-bold">{mockKpiData.totalClicks.toLocaleString()}</div>
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
              <div className="text-2xl font-bold">{mockKpiData.avgROAS.toFixed(2)}x</div>
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
              <CardDescription>Daily performance over the last 7 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockChartData}>
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
              <CardDescription>Best performing campaigns this month</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={mockTopCampaigns}>
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
                {mockTopCampaigns.map((campaign, index) => (
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
