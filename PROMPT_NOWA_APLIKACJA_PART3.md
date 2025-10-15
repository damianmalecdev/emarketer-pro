# PROMPT: Nowa Aplikacja - Część 3: API, Frontend & MCP

## 📡 Complete API Endpoints Specification

### Authentication Endpoints

```typescript
// POST /api/auth/register
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
// Response: { "success": true, "userId": "uuid" }

// POST /api/auth/[...nextauth]
// NextAuth.js handles: signin, signout, session, callback, csrf, providers
```

### Integration Endpoints

#### GET /api/integrations
```typescript
// Query: none (returns all integrations for user's companies)
// Response:
{
  "integrations": [
    {
      "id": "uuid",
      "companyId": "uuid",
      "platform": "google-ads",
      "accountId": "1234567890",
      "accountName": "My Ad Account",
      "isActive": true,
      "createdAt": "2025-10-15T10:00:00Z"
    }
  ]
}
```

#### Google Ads OAuth Flow
```typescript
// 1. GET /api/integrations/google-ads?action=auth-url&companyId={uuid}
// Response: { "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..." }

// 2. GET /api/integrations/google-ads/callback?code={code}&state={json}
// Redirects to: /settings?success=google_ads_connected

// 3. POST /api/integrations/google-ads/sync
{
  "companyId": "uuid"
}
// Response: { "success": true, "campaigns": 25 }
```

#### Meta Ads OAuth Flow
```typescript
// 1. GET /api/integrations/meta?action=auth-url&companyId={uuid}
// Response: { "authUrl": "https://www.facebook.com/v18.0/dialog/oauth?..." }

// 2. GET /api/integrations/meta/callback?code={code}&state={json}
// Redirects to: /settings?success=meta_connected

// 3. POST /api/integrations/meta/sync
{
  "companyId": "uuid"
}
// Response: { "success": true, "campaigns": 15, "insights": 105 }
```

#### GA4 OAuth Flow
```typescript
// 1. POST /api/integrations/ga4
{
  "action": "auth-url",
  "companyId": "uuid"
}
// Response: { "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?..." }

// 2. GET /api/integrations/ga4/callback?code={code}&state={json}
// Redirects to: /settings?success=ga4_connected

// 3. POST /api/integrations/ga4/sync
{
  "companyId": "uuid"
}
// Response: { "success": true, "events": 5420 }
```

### Campaign & Metrics Endpoints

#### GET /api/campaigns
```typescript
// Query: ?companyId={uuid}&platform={platform}&days={7}
// Response:
{
  "campaigns": [
    {
      "id": "uuid",
      "name": "Summer Sale 2025",
      "platform": "google-ads",
      "platformCampaignId": "123456789",
      "status": "ENABLED",
      "metrics": [
        {
          "date": "2025-10-15",
          "spend": 150.50,
          "revenue": 620.00,
          "roas": 412.0,
          "conversions": 12
        }
      ]
    }
  ]
}
```

#### GET /api/metrics
```typescript
// Query: ?companyId={uuid}&platform={platform}&range={7}&type={overview|campaigns}

// Type: overview
{
  "data": {
    "metrics": {
      "totalSpend": 5420.50,
      "totalRevenue": 18250.00,
      "roas": 336.7,
      "totalConversions": 245,
      "totalImpressions": 125000,
      "totalClicks": 3500,
      "ctr": 2.8,
      "cpc": 1.55,
      "cos": 29.7,
      "engagementRate": 4.2
    }
  }
}

// Type: campaigns
{
  "data": {
    "campaigns": [
      {
        "campaignId": "uuid",
        "campaignName": "Campaign A",
        "totalSpend": 1200.00,
        "totalRevenue": 5400.00,
        "roas": 450.0,
        "totalConversions": 45,
        "totalImpressions": 25000,
        "totalClicks": 750,
        "ctr": 3.0,
        "cpc": 1.60,
        "cos": 22.2,
        "engagementRate": 5.1
      }
    ]
  }
}
```

### AI Chat Endpoints

```typescript
// POST /api/chat
{
  "message": "What's the best performing campaign this week?",
  "companyId": "uuid"
}
// Response:
{
  "message": "Based on your data, 'Summer Sale 2025' is your top performer with a ROAS of 450% and $5,400 in revenue from just $1,200 spend. It's driving 45 conversions with a 3% CTR, which is above your account average...",
  "timestamp": "2025-10-15T14:30:00Z"
}

// GET /api/chat
// Response: { "messages": [...conversation history...] }
```

### Reports Endpoints

```typescript
// GET /api/reports
// Response:
{
  "reports": [
    {
      "id": "uuid",
      "title": "Weekly Performance Report",
      "type": "weekly",
      "period": "Oct 8-15, 2025",
      "summary": "This week showed strong growth...",
      "aiComment": "Key insight: Google Ads outperformed Meta by 25%...",
      "fileUrl": "/reports/weekly-2025-10-15.pdf",
      "createdAt": "2025-10-15T09:00:00Z"
    }
  ]
}

// POST /api/reports
{
  "type": "weekly",
  "period": "2025-10-08_2025-10-15",
  "companyId": "uuid"
}
// Response:
{
  "success": true,
  "report": { ...report object... },
  "pdfUrl": "/reports/weekly-2025-10-15.pdf"
}
```

### Alerts Endpoints

```typescript
// GET /api/alerts
// Response:
{
  "alerts": [
    {
      "id": "uuid",
      "message": "Campaign 'Summer Sale' ROAS dropped by 35% (450% → 292%)",
      "type": "anomaly",
      "severity": "high",
      "isRead": false,
      "metadata": {
        "campaignId": "uuid",
        "metric": "roas",
        "previousValue": 450,
        "currentValue": 292,
        "deviation": -35
      },
      "createdAt": "2025-10-15T08:30:00Z"
    }
  ]
}

// PATCH /api/alerts
{
  "alertIds": ["uuid1", "uuid2"],
  "isRead": true
}
// Response: { "success": true, "updated": 2 }
```

### Cron Endpoints (Protected by CRON_SECRET)

```typescript
// POST /api/cron/sync-all
// Headers: { "Authorization": "Bearer {CRON_SECRET}" }
// Response:
{
  "success": true,
  "syncedCompanies": 15,
  "totalCampaigns": 245,
  "errors": []
}

// POST /api/cron/run
// Same as sync-all (manual trigger)
```

---

## 🎨 Frontend Components

### 1. Main Layout Component

```typescript
// src/components/layout/dashboard-layout.tsx
'use client'

import { useSession, signOut } from 'next-auth/react'
import { useCompany } from '@/hooks/useCompany'
import { Button } from '@/components/ui/button'
import { 
  LayoutDashboard, 
  BarChart3, 
  MessageSquare, 
  FileText, 
  Bell, 
  Settings 
} from 'lucide-react'
import Link from 'next/link'

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const { activeCompany, companies, setActiveCompany } = useCompany()

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Google Ads', href: '/dashboard/google-ads', icon: BarChart3 },
    { name: 'Meta Ads', href: '/dashboard/meta', icon: BarChart3 },
    { name: 'GA4', href: '/dashboard/ga4', icon: BarChart3 },
    { name: 'AI Chat', href: '/chat', icon: MessageSquare },
    { name: 'Reports', href: '/reports', icon: FileText },
    { name: 'Alerts', href: '/alerts', icon: Bell },
    { name: 'Settings', href: '/settings', icon: Settings },
  ]

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 text-white">
        <div className="p-4">
          <h1 className="text-2xl font-bold">eMarketer.pro</h1>
        </div>
        
        <nav className="mt-8">
          {navigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center px-4 py-3 hover:bg-gray-800"
            >
              <item.icon className="mr-3 h-5 w-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-0 w-64 p-4 border-t border-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">{session?.user?.name}</p>
              <p className="text-xs text-gray-400">{activeCompany?.name}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => signOut()}>
              Logout
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-8">
        {children}
      </main>
    </div>
  )
}
```

### 2. Platform Dashboard Component

```typescript
// src/components/dashboard/PlatformDashboard.tsx
'use client'

import { useState, useEffect } from 'react'
import { useCompany } from '@/hooks/useCompany'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PlatformDashboardProps {
  platform: 'google-ads' | 'meta' | 'tiktok' | 'ga4'
}

export function PlatformDashboard({ platform }: PlatformDashboardProps) {
  const { activeCompany } = useCompany()
  const [selectedRange, setSelectedRange] = useState('7')
  const [metrics, setMetrics] = useState<any>(null)
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [platform, selectedRange, activeCompany])

  const fetchMetrics = async () => {
    if (!activeCompany?.id) return
    
    setLoading(true)
    try {
      const [overviewRes, campaignsRes] = await Promise.all([
        fetch(`/api/metrics?companyId=${activeCompany.id}&platform=${platform}&range=${selectedRange}&type=overview`),
        fetch(`/api/metrics?companyId=${activeCompany.id}&platform=${platform}&range=${selectedRange}&type=campaigns`),
      ])

      const overviewData = await overviewRes.json()
      const campaignsData = await campaignsRes.json()
      
      setMetrics(overviewData.data.metrics)
      setCampaigns(campaignsData.data.campaigns)
    } catch (error) {
      console.error('Error fetching metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">
          {platform === 'google-ads' ? 'Google Ads' : 
           platform === 'meta' ? 'Meta Ads' : 
           platform === 'ga4' ? 'Google Analytics 4' : 'TikTok Ads'}
        </h1>
        
        <Select value={selectedRange} onValueChange={setSelectedRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">7 days</SelectItem>
            <SelectItem value="14">14 days</SelectItem>
            <SelectItem value="30">30 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Spend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics.totalSpend.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${metrics.totalRevenue.toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">ROAS</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.roas.toFixed(2)}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics.totalConversions.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Campaign</th>
                <th className="text-right p-2">Spend</th>
                <th className="text-right p-2">Revenue</th>
                <th className="text-right p-2">ROAS</th>
                <th className="text-right p-2">Conversions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => (
                <tr key={campaign.campaignId} className="border-b hover:bg-gray-50">
                  <td className="p-2">{campaign.campaignName}</td>
                  <td className="text-right p-2">${campaign.totalSpend.toFixed(2)}</td>
                  <td className="text-right p-2">${campaign.totalRevenue.toFixed(2)}</td>
                  <td className="text-right p-2">{campaign.roas.toFixed(2)}%</td>
                  <td className="text-right p-2">{campaign.totalConversions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 3. useCompany Hook (Multi-Tenant)

```typescript
// src/hooks/useCompany.tsx
'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Company {
  id: string
  name: string
}

interface CompanyState {
  activeCompany: Company | null
  companies: Company[]
  loading: boolean
  setActiveCompany: (company: Company) => void
  setCompanies: (companies: Company[]) => void
  setLoading: (loading: boolean) => void
}

export const useCompanyStore = create<CompanyState>()(
  persist(
    (set) => ({
      activeCompany: null,
      companies: [],
      loading: true,
      setActiveCompany: (company) => set({ activeCompany: company }),
      setCompanies: (companies) => set({ companies }),
      setLoading: (loading) => set({ loading }),
    }),
    {
      name: 'company-storage',
    }
  )
)

export function useCompany() {
  const { data: session } = useSession()
  const { activeCompany, companies, loading, setActiveCompany, setCompanies, setLoading } = useCompanyStore()

  useEffect(() => {
    if (session?.user?.id && companies.length === 0) {
      fetchCompanies()
    }
  }, [session])

  const fetchCompanies = async () => {
    try {
      const res = await fetch('/api/companies')
      const data = await res.json()
      
      setCompanies(data.companies)
      
      // Set first company as active if none selected
      if (!activeCompany && data.companies.length > 0) {
        setActiveCompany(data.companies[0])
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    activeCompany,
    companies,
    loading,
    setActiveCompany,
  }
}
```

---

## 🔧 MCP Servers Implementation

### MCP Server Architecture

**Pattern for all MCP tools:**
1. Accept `userId` + optional `companyId`
2. Call `getCompanyFromUser(userId, companyId)` for validation
3. Use returned `companyId` in all Prisma queries
4. Return `{ success: boolean, ...data/error }`

### 1. Google Ads/GA4 MCP Server

```javascript
// mcp-server.js
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Multi-tenant helper
async function getCompanyFromUser(userId, companyId) {
  if (companyId) {
    // Verify user has access to this company
    const membership = await prisma.membership.findUnique({
      where: { userId_companyId: { userId, companyId } },
      include: { company: true }
    })
    
    if (!membership) {
      throw new Error('Access denied to company')
    }
    
    return membership.company
  }
  
  // Get first company
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: { company: true }
  })
  
  if (!membership) {
    throw new Error('No company found for user')
  }
  
  return membership.company
}

const server = new Server(
  {
    name: 'emarketer-google-apis',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// Tool: Sync Google Ads Campaigns
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params

  if (name === 'sync_google_ads_campaigns') {
    try {
      const { userId, companyId, customerId, days = 7 } = args
      
      // Get company with validation
      const company = await getCompanyFromUser(userId, companyId)
      
      // Get integration
      const integration = await prisma.integration.findFirst({
        where: {
          companyId: company.id,
          platform: 'google-ads',
          isActive: true
        }
      })
      
      if (!integration) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              error: 'No active Google Ads integration found'
            })
          }]
        }
      }
      
      // Fetch campaigns from Google Ads API
      const campaigns = await fetchGoogleAdsCampaigns(
        integration.accessToken,
        customerId,
        days
      )
      
      let stored = 0
      for (const rawCampaign of campaigns) {
        const normalized = transformGoogleAdsCampaign(rawCampaign)
        await loadCampaignWithMetrics(normalized, {
          companyId: company.id,
          integrationId: integration.id,
          platform: 'google-ads'
        })
        stored++
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            customerId,
            campaignsProcessed: campaigns.length,
            campaignsStored: stored,
            dateRange: `LAST_${days}_DAYS`
          })
        }]
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message
          })
        }]
      }
    }
  }
  
  // Add more tools here...
  
  throw new Error(`Unknown tool: ${name}`)
})

// List available tools
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'sync_google_ads_campaigns',
        description: 'Sync Google Ads campaigns to database with daily metrics',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string', description: 'User ID' },
            companyId: { type: 'string', description: 'Company ID (optional)' },
            customerId: { type: 'string', description: 'Google Ads customer ID' },
            days: { type: 'number', description: 'Number of days to sync (default: 7)' }
          },
          required: ['userId', 'customerId']
        }
      },
      // Add more tool definitions...
    ]
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('MCP Google APIs server running on stdio')
}

main().catch(console.error)
```

### 2. Meta Ads MCP Server

```javascript
// mcp-meta-server.js
#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { PrismaClient } from '@prisma/client'
import { FacebookAdsApi, AdAccount } from 'facebook-nodejs-business-sdk'

const prisma = new PrismaClient()

const server = new Server(
  {
    name: 'emarketer-meta-ads',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
)

// Tool: Get Audience Insights
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params

  if (name === 'get_audience_insights') {
    try {
      const { userId, companyId, campaignId, datePreset = 'last_30d' } = args
      
      const company = await getCompanyFromUser(userId, companyId)
      
      const integration = await prisma.integration.findFirst({
        where: {
          companyId: company.id,
          platform: 'meta',
          isActive: true
        }
      })
      
      if (!integration) {
        throw new Error('No active Meta integration found')
      }
      
      // Initialize Facebook API
      FacebookAdsApi.init(integration.accessToken)
      
      // Get insights with demographic breakdown
      const insights = await new AdAccount(integration.accountId).getInsights({
        fields: ['spend', 'impressions', 'clicks', 'conversions'],
        breakdowns: ['age', 'gender'],
        date_preset: datePreset,
        filtering: [{ field: 'campaign.id', operator: 'EQUAL', value: campaignId }]
      })
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            insights: insights.map(i => i._data)
          })
        }]
      }
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message
          })
        }]
      }
    }
  }
  
  throw new Error(`Unknown tool: ${name}`)
})

// Tool definitions
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'get_audience_insights',
        description: 'Get Meta Ads audience insights with demographic breakdown',
        inputSchema: {
          type: 'object',
          properties: {
            userId: { type: 'string' },
            companyId: { type: 'string' },
            campaignId: { type: 'string' },
            datePreset: { type: 'string', default: 'last_30d' }
          },
          required: ['userId', 'campaignId']
        }
      }
    ]
  }
})

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  console.error('MCP Meta Ads server running on stdio')
}

main().catch(console.error)
```

_**Dokument kontynuowany w części 4...**_

