# PROMPT: Nowa Aplikacja - Część 2: Implementacja

## 🔐 Key Features Implementation

### 1. Authentication System (NextAuth.js)

#### NextAuth Configuration
```typescript
// src/lib/auth/nextAuthOptions.ts
import { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@auth/prisma-adapter"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { prisma } from "../prisma"
import bcrypt from "bcryptjs"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        })

        if (!user || !user.password) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password, 
          user.password
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/auth/signin",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
      }
      return session
    },
  },
}
```

#### Registration Route
```typescript
// src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json()

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password required' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'User already exists' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user and default company
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        memberships: {
          create: {
            role: 'owner',
            company: {
              create: {
                name: name ? `${name}'s Company` : 'My Company',
              }
            }
          }
        }
      }
    })

    return NextResponse.json({
      success: true,
      userId: user.id
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    )
  }
}
```

### 2. OAuth Integration Flows

#### Pattern dla wszystkich platform:
1. **Auth URL Generation** - generuj URL z state zawierającym `{userId, companyId}`
2. **OAuth Callback** - parsuj state, waliduj company access
3. **Token Storage** - zapisz w Integration z companyId
4. **Data Sync** - fetch + transform + load

#### Google Ads OAuth Flow

**Step 1: Auth URL**
```typescript
// src/app/api/integrations/google-ads/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextAuthOptions'

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const action = searchParams.get('action')
  const companyId = searchParams.get('companyId')

  if (!companyId) {
    return NextResponse.json(
      { error: 'companyId required' }, 
      { status: 400 }
    )
  }

  if (action === 'auth-url') {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_ADS_CLIENT_ID,
      process.env.GOOGLE_ADS_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/integrations/google-ads/callback`
    )

    // CRITICAL: State MUST contain userId and companyId
    const state = JSON.stringify({
      userId: session.user.id,
      companyId
    })

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/adwords',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      state
    })

    return NextResponse.json({ authUrl })
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
```

**Step 2: Callback**
```typescript
// src/app/api/integrations/google-ads/callback/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get('code')
  const stateStr = searchParams.get('state')

  if (!code || !stateStr) {
    return NextResponse.redirect('/settings?error=oauth_failed')
  }

  try {
    // Parse state
    const state = JSON.parse(stateStr)
    const { userId, companyId } = state

    // Validate company access
    const membership = await prisma.membership.findUnique({
      where: {
        userId_companyId: { userId, companyId }
      }
    })

    if (!membership) {
      return NextResponse.redirect('/settings?error=access_denied')
    }

    // Exchange code for tokens
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_ADS_CLIENT_ID,
      process.env.GOOGLE_ADS_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/integrations/google-ads/callback`
    )

    const { tokens } = await oauth2Client.getToken(code)

    // Save integration to company
    await prisma.integration.upsert({
      where: {
        companyId_platform_accountId: {
          companyId,
          platform: 'google-ads',
          accountId: 'pending' // Will be updated after first sync
        }
      },
      create: {
        companyId,
        platform: 'google-ads',
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        accountId: 'pending',
        isActive: true
      },
      update: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        isActive: true
      }
    })

    return NextResponse.redirect('/settings?success=google_ads_connected')
  } catch (error) {
    console.error('Google Ads callback error:', error)
    return NextResponse.redirect('/settings?error=oauth_failed')
  }
}
```

**Step 3: Sync Data**
```typescript
// src/app/api/integrations/google-ads/sync/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { prisma } from '@/lib/prisma'
import { validateCompanyAccess } from '@/lib/permissions'
import { transformGoogleAdsCampaign } from '@/lib/etl/transformers/google-ads-transformer'
import { loadCampaignWithMetrics } from '@/lib/etl/loaders/campaign-loader'

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { companyId } = await req.json()

  if (!companyId) {
    return NextResponse.json(
      { error: 'companyId required' },
      { status: 400 }
    )
  }

  // Validate access
  await validateCompanyAccess(session.user.id, companyId)

  // Get integration
  const integration = await prisma.integration.findFirst({
    where: {
      companyId,
      platform: 'google-ads',
      isActive: true
    }
  })

  if (!integration) {
    return NextResponse.json(
      { error: 'No Google Ads integration found' },
      { status: 404 }
    )
  }

  try {
    // Fetch campaigns from Google Ads API
    const campaigns = await fetchGoogleAdsCampaigns(
      integration.accessToken,
      integration.loginCustomerId
    )

    let stored = 0
    for (const rawCampaign of campaigns) {
      // Transform to normalized format
      const normalized = transformGoogleAdsCampaign(rawCampaign)
      
      // Load to database
      await loadCampaignWithMetrics(normalized, {
        companyId,
        integrationId: integration.id,
        platform: 'google-ads'
      })
      
      stored++
    }

    return NextResponse.json({
      success: true,
      campaigns: stored
    })
  } catch (error) {
    console.error('Google Ads sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed' },
      { status: 500 }
    )
  }
}
```

### 3. ETL System Implementation

#### Campaign Loader (Central)
```typescript
// src/lib/etl/loaders/campaign-loader.ts
import { prisma } from '@/lib/prisma'

interface NormalizedCampaign {
  platformCampaignId: string
  name: string
  status: string
}

interface NormalizedMetrics {
  date: Date
  spend: number
  impressions: number
  clicks: number
  conversions: number
  revenue: number
}

interface LoadConfig {
  companyId: string
  integrationId: string
  platform: string
}

export async function loadCampaignWithMetrics(
  campaign: NormalizedCampaign & { metrics: NormalizedMetrics[] },
  config: LoadConfig
) {
  const { companyId, integrationId, platform } = config

  // 1. Upsert Campaign (master record)
  const campaignRecord = await prisma.campaign.upsert({
    where: {
      companyId_platform_platformCampaignId: {
        companyId,
        platform,
        platformCampaignId: campaign.platformCampaignId
      }
    },
    create: {
      companyId,
      integrationId,
      platform,
      platformCampaignId: campaign.platformCampaignId,
      name: campaign.name,
      status: campaign.status
    },
    update: {
      name: campaign.name,
      status: campaign.status,
      updatedAt: new Date()
    }
  })

  // 2. Upsert Metrics (daily snapshots)
  for (const metric of campaign.metrics) {
    // Normalize date to midnight UTC
    const date = new Date(metric.date)
    date.setUTCHours(0, 0, 0, 0)

    // Calculate derived metrics
    const ctr = metric.impressions > 0 
      ? (metric.clicks / metric.impressions) * 100 
      : 0
    const cpc = metric.clicks > 0 
      ? metric.spend / metric.clicks 
      : 0
    const roas = metric.spend > 0 
      ? (metric.revenue / metric.spend) * 100 
      : 0
    const cpa = metric.conversions > 0 
      ? metric.spend / metric.conversions 
      : 0

    await prisma.campaignMetric.upsert({
      where: {
        campaignId_date: {
          campaignId: campaignRecord.id,
          date
        }
      },
      create: {
        campaignId: campaignRecord.id,
        date,
        spend: metric.spend,
        impressions: metric.impressions,
        clicks: metric.clicks,
        conversions: metric.conversions,
        revenue: metric.revenue,
        ctr,
        cpc,
        roas,
        cpa
      },
      update: {
        spend: metric.spend,
        impressions: metric.impressions,
        clicks: metric.clicks,
        conversions: metric.conversions,
        revenue: metric.revenue,
        ctr,
        cpc,
        roas,
        cpa
      }
    })
  }

  return { success: true, campaignId: campaignRecord.id }
}
```

#### Platform Transformers

**Google Ads Transformer**
```typescript
// src/lib/etl/transformers/google-ads-transformer.ts

export function transformGoogleAdsCampaign(rawCampaign: any) {
  return {
    platformCampaignId: rawCampaign.campaign.id,
    name: rawCampaign.campaign.name,
    status: rawCampaign.campaign.status,
    metrics: rawCampaign.segments.map((segment: any) => ({
      date: new Date(segment.date),
      spend: segment.metrics.cost_micros / 1_000_000,
      impressions: segment.metrics.impressions,
      clicks: segment.metrics.clicks,
      conversions: segment.metrics.conversions,
      revenue: segment.metrics.conversions_value || 0
    }))
  }
}
```

**Meta Ads Transformer**
```typescript
// src/lib/etl/transformers/meta-transformer.ts

export function transformMetaCampaign(rawCampaign: any) {
  return {
    platformCampaignId: rawCampaign.id,
    name: rawCampaign.name,
    status: rawCampaign.status,
    metrics: rawCampaign.insights.data.map((insight: any) => ({
      date: new Date(insight.date_start),
      spend: parseFloat(insight.spend),
      impressions: parseInt(insight.impressions),
      clicks: parseInt(insight.clicks),
      conversions: parseInt(insight.actions?.find(
        (a: any) => a.action_type === 'purchase'
      )?.value || 0),
      revenue: parseFloat(insight.action_values?.find(
        (a: any) => a.action_type === 'purchase'
      )?.value || 0)
    }))
  }
}
```

### 4. AI Chat Assistant (OpenAI)

```typescript
// src/app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { OpenAI } from 'openai'
import { prisma } from '@/lib/prisma'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { message, companyId } = await req.json()

  // Build context from user's data
  const context = await buildMarketingContext(session.user.id, companyId)

  // Get conversation history
  const history = await prisma.chatMessage.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'asc' },
    take: 10
  })

  const messages = [
    {
      role: 'system',
      content: `You are eMarketer.pro AI Assistant, an expert marketing analytics assistant specialized in Meta Ads, Google Ads, and Google Analytics.

Current user context:
${context}

Provide actionable insights, explain metrics clearly, and help optimize campaigns.`
    },
    ...history.map(h => ({ role: h.role, content: h.content })),
    { role: 'user', content: message }
  ]

  // Call OpenAI
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: messages as any,
    temperature: 0.7,
    max_tokens: 1000
  })

  const assistantMessage = completion.choices[0].message.content

  // Save messages
  await prisma.chatMessage.createMany({
    data: [
      {
        userId: session.user.id,
        role: 'user',
        content: message
      },
      {
        userId: session.user.id,
        role: 'assistant',
        content: assistantMessage || ''
      }
    ]
  })

  return NextResponse.json({
    message: assistantMessage,
    timestamp: new Date().toISOString()
  })
}

async function buildMarketingContext(userId: string, companyId?: string) {
  // Get user's companies
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { company: true }
  })

  const targetCompanyId = companyId || memberships[0]?.companyId

  if (!targetCompanyId) {
    return 'No data available yet. Connect your marketing platforms first.'
  }

  // Get integrations
  const integrations = await prisma.integration.findMany({
    where: { companyId: targetCompanyId, isActive: true }
  })

  // Get last 7 days metrics
  const last7Days = new Date()
  last7Days.setDate(last7Days.getDate() - 7)

  const campaigns = await prisma.campaign.findMany({
    where: { companyId: targetCompanyId },
    include: {
      metrics: {
        where: { date: { gte: last7Days } }
      }
    }
  })

  // Aggregate metrics
  const totalMetrics = campaigns.reduce((acc, campaign) => {
    campaign.metrics.forEach(m => {
      acc.spend += m.spend
      acc.revenue += m.revenue
      acc.conversions += m.conversions
      acc.impressions += m.impressions
      acc.clicks += m.clicks
    })
    return acc
  }, { spend: 0, revenue: 0, conversions: 0, impressions: 0, clicks: 0 })

  const roas = totalMetrics.spend > 0 
    ? (totalMetrics.revenue / totalMetrics.spend) * 100 
    : 0

  return `
Connected Platforms: ${integrations.map(i => i.platform).join(', ')}

Last 7 Days Performance:
- Total Spend: $${totalMetrics.spend.toFixed(2)}
- Total Revenue: $${totalMetrics.revenue.toFixed(2)}
- ROAS: ${roas.toFixed(2)}%
- Conversions: ${totalMetrics.conversions}
- CTR: ${((totalMetrics.clicks / totalMetrics.impressions) * 100).toFixed(2)}%

Top Campaigns by Revenue:
${campaigns
  .sort((a, b) => {
    const aRev = a.metrics.reduce((sum, m) => sum + m.revenue, 0)
    const bRev = b.metrics.reduce((sum, m) => sum + m.revenue, 0)
    return bRev - aRev
  })
  .slice(0, 5)
  .map(c => `- ${c.name}: $${c.metrics.reduce((sum, m) => sum + m.revenue, 0).toFixed(2)}`)
  .join('\n')}
`.trim()
}
```

### 5. PDF Report Generation

```typescript
// src/lib/pdf/generateReport.ts
import PDFDocument from 'pdfkit'
import { Readable } from 'stream'
import fs from 'fs'

interface ReportData {
  title: string
  period: string
  summary: string
  metrics: {
    spend: number
    revenue: number
    roas: number
    conversions: number
  }
  campaigns: Array<{
    name: string
    spend: number
    revenue: number
    roas: number
  }>
}

export async function generatePDFReport(
  data: ReportData,
  outputPath: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument()
    const stream = fs.createWriteStream(outputPath)

    doc.pipe(stream)

    // Header
    doc.fontSize(24).text(data.title, { align: 'center' })
    doc.moveDown()
    doc.fontSize(12).text(data.period, { align: 'center' })
    doc.moveDown(2)

    // Executive Summary
    doc.fontSize(16).text('Executive Summary', { underline: true })
    doc.moveDown()
    doc.fontSize(11).text(data.summary)
    doc.moveDown(2)

    // Key Metrics
    doc.fontSize(16).text('Key Performance Indicators', { underline: true })
    doc.moveDown()
    
    const metrics = [
      ['Total Spend', `$${data.metrics.spend.toLocaleString()}`],
      ['Total Revenue', `$${data.metrics.revenue.toLocaleString()}`],
      ['ROAS', `${data.metrics.roas.toFixed(2)}%`],
      ['Conversions', data.metrics.conversions.toString()]
    ]

    metrics.forEach(([label, value]) => {
      doc.fontSize(11).text(`${label}: `, { continued: true })
      doc.font('Helvetica-Bold').text(value)
      doc.font('Helvetica')
    })

    doc.moveDown(2)

    // Top Campaigns Table
    doc.fontSize(16).text('Top Performing Campaigns', { underline: true })
    doc.moveDown()

    const tableTop = doc.y
    const col1 = 50
    const col2 = 300
    const col3 = 400
    const col4 = 500

    // Table headers
    doc.fontSize(10).font('Helvetica-Bold')
    doc.text('Campaign', col1, tableTop)
    doc.text('Spend', col2, tableTop)
    doc.text('Revenue', col3, tableTop)
    doc.text('ROAS', col4, tableTop)

    doc.font('Helvetica')
    let y = tableTop + 20

    data.campaigns.forEach(campaign => {
      doc.text(campaign.name, col1, y, { width: 230 })
      doc.text(`$${campaign.spend.toLocaleString()}`, col2, y)
      doc.text(`$${campaign.revenue.toLocaleString()}`, col3, y)
      doc.text(`${campaign.roas.toFixed(2)}%`, col4, y)
      y += 20
    })

    // Footer
    doc.fontSize(8).text(
      `Generated by eMarketer.pro on ${new Date().toLocaleDateString()}`,
      50,
      doc.page.height - 50,
      { align: 'center' }
    )

    doc.end()

    stream.on('finish', () => {
      resolve(outputPath)
    })

    stream.on('error', reject)
  })
}
```

_**Dokument kontynuowany w części 3...**_

