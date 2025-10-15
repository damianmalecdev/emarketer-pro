# PROMPT: Stworzenie Aplikacji Marketing Analytics SaaS od Zera

## 📋 Executive Summary

### Cel Aplikacji
Zbuduj zaawansowaną platformę SaaS do analizy marketingu cyfrowego **eMarketer.pro**, która agreguje dane z wielu platform reklamowych (Google Ads, Meta Ads, TikTok Ads, Google Analytics 4), oferuje dashboardy analityczne w czasie rzeczywistym, asystenta AI oraz automatyczne generowanie raportów.

### Kluczowe Funkcjonalności
1. **Real-time Analytics Dashboard** - Monitoring kampanii z live data visualization
2. **Multi-Platform Integration** - OAuth połączenia z Google Ads, Meta, GA4, TikTok
3. **AI-Powered Insights** - Chat assistant (GPT-4) z kontekstem danych marketingowych
4. **Automated Reports** - Generowanie raportów PDF z AI summaries
5. **Smart Alerts** - Wykrywanie anomalii i powiadomienia o zmianach wydajności
6. **Multi-Tenant Architecture** - Wsparcie dla wielu firm/klientów na jednego użytkownika
7. **ETL System** - Extract-Transform-Load pipeline dla normalizacji danych
8. **MCP Servers** - 3 dedykowane serwery Model Context Protocol (30+ tools)

### Architektura High-Level

```
┌─────────────────────────────────────────────────────┐
│           Frontend (Next.js 15 + React 19)          │
│  - Server Components & Client Components            │
│  - TailwindCSS + shadcn/ui                         │
│  - React Query (data fetching)                     │
│  - Zustand (global state)                          │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│          API Layer (Next.js API Routes)             │
│  - Authentication (NextAuth.js)                     │
│  - OAuth Flows (Google, Meta, TikTok)              │
│  - Rate Limiting                                    │
│  - Multi-tenant Validation                         │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│              Business Logic Layer                    │
│  - ETL System (Extract, Transform, Load)           │
│  - AI Integration (OpenAI GPT-4o-mini)             │
│  - PDF Generation (PDFKit)                         │
│  - Metrics Calculation                             │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│           Data Access (Prisma ORM)                  │
│  - Type-safe queries                               │
│  - Multi-tenant isolation                          │
│  - Connection pooling                              │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│              PostgreSQL Database                     │
│  - Relational data                                 │
│  - JSONB for flexible fields                       │
│  - Time-series metrics                             │
└─────────────────────────────────────────────────────┘

        External APIs:                MCP Servers (3):
┌──────────────────────────┐    ┌────────────────────────┐
│ • Google Ads API         │    │ • emarketer-google     │
│ • Meta Marketing API     │    │ • emarketer-meta       │
│ • TikTok Ads API        │    │ • emarketer-tiktok     │
│ • GA4 Data API          │    │   (30 tools total)     │
└──────────────────────────┘    └────────────────────────┘
```

---

## 🛠 Tech Stack & Dependencies

### Frontend Stack
```json
{
  "framework": "Next.js 15.5.4 (App Router)",
  "react": "19.2.0",
  "typescript": "5.x",
  "styling": "TailwindCSS 4.x",
  "ui_library": "shadcn/ui + Radix UI",
  "charts": "Recharts 3.2.1",
  "icons": "Lucide React 0.545.0",
  "state_management": {
    "global": "Zustand 5.0.8",
    "server_state": "@tanstack/react-query 5.90.2"
  },
  "forms": "React Hook Form + Zod",
  "themes": "next-themes 0.4.6"
}
```

### Backend Stack
```json
{
  "runtime": "Node.js 20+",
  "framework": "Next.js API Routes",
  "orm": "Prisma 6.16.3",
  "database": "PostgreSQL 14+",
  "auth": "NextAuth.js 4.24.11",
  "auth_adapter": "@auth/prisma-adapter 2.10.0",
  "validation": "Zod 3.25.76",
  "hashing": "bcryptjs 3.0.2"
}
```

### External Integrations
```json
{
  "ai": "OpenAI GPT-4o-mini (openai 6.1.0)",
  "google_ads": "Google Ads API v16",
  "meta_ads": "facebook-nodejs-business-sdk 23.0.2",
  "ga4": "@google-analytics/data 5.2.0",
  "tiktok": "TikTok Marketing API v1.3",
  "pdf": "pdfkit 0.17.2",
  "mcp": "@modelcontextprotocol/sdk 1.19.1"
}
```

### Development Tools
```json
{
  "build_tool": "Turbopack (Next.js)",
  "linter": "ESLint 9",
  "type_checking": "TypeScript strict mode",
  "process_manager": "PM2 (production)",
  "cron": "node-cron 4.2.1"
}
```

### Package.json Scripts
```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack",
    "start": "next start",
    "lint": "eslint",
    "db:generate": "prisma generate",
    "db:push": "prisma db push",
    "db:studio": "prisma studio",
    "db:seed": "node prisma/seed.js"
  }
}
```

---

## 🗄️ Database Schema (Prisma)

### Multi-Tenant Architecture

**Kluczowy przepływ danych:**
```
User → Membership → Company → Integration → Campaign → CampaignMetric
```

**Zasady:**
- WSZYSTKIE resources (Integration, Campaign, Event) należą do `Company`
- User ma dostęp do wielu Companies przez `Membership`
- Każda operacja MUSI używać `companyId` (NIGDY userId dla company resources)

### Pełny Schema Prisma

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// AUTHENTICATION MODELS (NextAuth.js)
// ============================================

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}

// ============================================
// CORE MODELS
// ============================================

model User {
  id            String        @id @default(uuid())
  email         String        @unique
  name          String?
  image         String?
  emailVerified DateTime?
  password      String?       // bcrypt hashed
  plan          String        @default("free")  // 'free' | 'pro' | 'enterprise'
  role          String        @default("user")  // 'admin' | 'manager' | 'viewer'
  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt
  
  accounts      Account[]
  sessions      Session[]
  memberships   Membership[]  // Multi-tenant access
  alerts        Alert[]
  messages      ChatMessage[]
  preferences   UserPreference[]
  reports       Report[]
}

model Company {
  id           String          @id @default(uuid())
  name         String
  domain       String?
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  
  members      Membership[]
  integrations Integration[]
  campaigns    Campaign[]
  events       Event[]
  reports      Report[]
}

model Membership {
  id         String   @id @default(uuid())
  userId     String
  companyId  String
  role       String   @default("owner")  // 'owner' | 'manager' | 'analyst'
  createdAt  DateTime @default(now())

  user     User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  company  Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@unique([userId, companyId])
}

// ============================================
// INTEGRATION & CAMPAIGN MODELS
// ============================================

model Integration {
  id              String     @id @default(uuid())
  company         Company    @relation(fields: [companyId], references: [id], onDelete: Cascade)
  companyId       String
  platform        String     // 'google-ads' | 'meta' | 'tiktok' | 'ga4'
  accessToken     String?    @db.Text
  refreshToken    String?    @db.Text
  expiresAt       DateTime?
  accountId       String?
  accountName     String?
  currency        String?    @default("USD")
  isActive        Boolean    @default(true)
  
  // Google Ads specific
  loginCustomerId String?
  customerIds     Json?      // Array of accessible customer IDs
  
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  campaigns       Campaign[]

  @@unique([companyId, platform, accountId])
}

model Campaign {
  id                 String            @id @default(uuid())
  company            Company           @relation(fields: [companyId], references: [id], onDelete: Cascade)
  companyId          String
  integration        Integration?      @relation(fields: [integrationId], references: [id], onDelete: SetNull)
  integrationId      String?
  name               String            @db.VarChar(255)
  platform           String            @db.VarChar(50)
  platformCampaignId String            @db.VarChar(255)  // ID from platform API
  status             String?           @db.VarChar(50)
  createdAt          DateTime          @default(now())
  updatedAt          DateTime          @updatedAt
  
  events             Event[]
  metrics            CampaignMetric[]  // Time-series metrics
  anomalies          AnomalyDetection[]

  @@index([companyId, platform])
  @@index([platform])
  @@index([platformCampaignId])
}

// Time-series metrics table (daily snapshots)
model CampaignMetric {
  id          String   @id @default(uuid())
  campaign    Campaign @relation(fields: [campaignId], references: [id], onDelete: Cascade)
  campaignId  String
  
  date        DateTime @db.Date
  spend       Float    @default(0)
  impressions Int      @default(0)
  clicks      Int      @default(0)
  conversions Float    @default(0)
  revenue     Float    @default(0)
  
  // Calculated metrics
  ctr         Float    @default(0)  // Click-through rate (%)
  cpc         Float    @default(0)  // Cost per click
  roas        Float    @default(0)  // Return on ad spend
  cpa         Float    @default(0)  // Cost per acquisition
  
  createdAt   DateTime @default(now())
  
  @@unique([campaignId, date])
  @@index([date])
  @@index([campaignId, date])
}

model Event {
  id         String    @id @default(uuid())
  company    Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
  companyId  String
  campaign   Campaign? @relation(fields: [campaignId], references: [id], onDelete: SetNull)
  campaignId String?
  eventName  String
  eventValue Float?
  eventTime  DateTime
  source     String    @default("ga4")
  
  // GA4 specific
  sessionId       String?
  userPseudoId    String?
  eventParams     Json?
  userProperties  Json?
  
  createdAt  DateTime  @default(now())
  
  @@index([companyId, eventTime])
  @@index([eventName, eventTime])
  @@index([source, eventTime])
}

// ============================================
// AI & REPORTING MODELS
// ============================================

model Alert {
  id        String   @id @default(uuid())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  message   String   @db.Text
  type      String   // 'anomaly' | 'performance' | 'budget' | 'opportunity'
  severity  String   // 'low' | 'medium' | 'high' | 'critical'
  isRead    Boolean  @default(false)
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Report {
  id        String   @id @default(uuid())
  company   Company  @relation(fields: [companyId], references: [id], onDelete: Cascade)
  companyId String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  title     String
  type      String   // 'weekly' | 'monthly' | 'custom'
  period    String
  summary   String   @db.Text
  aiComment String?  @db.Text
  fileUrl   String?
  data      Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ChatMessage {
  id        String   @id @default(uuid())
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String
  role      String   // 'user' | 'assistant' | 'system'
  content   String   @db.Text
  metadata  Json?
  createdAt DateTime @default(now())
}

model UserPreference {
  id                String   @id @default(uuid())
  user              User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId            String
  platform          String   // 'google-ads' | 'meta' | 'ga4' | 'tiktok'
  selectedAccountId String?
  currency          String?  // ISO currency override
  updatedAt         DateTime @updatedAt

  @@unique([userId, platform])
}

model AnomalyDetection {
  id            String     @id @default(uuid())
  campaign      Campaign?  @relation(fields: [campaignId], references: [id], onDelete: SetNull)
  campaignId    String?
  metricType    String     // 'spend' | 'roas' | 'ctr' | 'conversions'
  previousValue Float
  currentValue  Float
  deviation     Float      // Percentage deviation
  threshold     Float
  direction     String     // 'increase' | 'decrease'
  detectedAt    DateTime   @default(now())
  isCritical    Boolean    @default(false)
  resolved      Boolean    @default(false)
}
```

### Key Database Relationships

```
User (1) ←→ (N) Membership (N) ←→ (1) Company
                                         ↓
                                    Integration (1:N)
                                         ↓
                                    Campaign (1:N)
                                         ↓
                                  CampaignMetric (1:N) [Time-series]
```

**Unique Constraints (Krytyczne!):**
- `Integration`: `(companyId, platform, accountId)` - jeden account per platform per company
- `Campaign`: Implied przez `companyId + platformCampaignId` (dodać w logice)
- `CampaignMetric`: `(campaignId, date)` - jeden snapshot per day
- `Membership`: `(userId, companyId)` - user może być w company tylko raz

---

## 🏗️ Core Architecture

### Directory Structure

```
emarketer.pro/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── api/                      # API Routes
│   │   │   ├── auth/
│   │   │   │   ├── [...nextauth]/route.ts    # NextAuth endpoints
│   │   │   │   └── register/route.ts          # User registration
│   │   │   ├── integrations/
│   │   │   │   ├── google-ads/
│   │   │   │   │   ├── route.ts               # OAuth URL
│   │   │   │   │   ├── callback/route.ts      # OAuth callback
│   │   │   │   │   └── sync/route.ts          # Data sync
│   │   │   │   ├── meta/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   ├── callback/route.ts
│   │   │   │   │   └── sync/route.ts
│   │   │   │   ├── ga4/
│   │   │   │   │   ├── route.ts
│   │   │   │   │   ├── callback/route.ts
│   │   │   │   │   └── sync/route.ts
│   │   │   │   └── route.ts               # List integrations
│   │   │   ├── campaigns/route.ts         # Campaign queries
│   │   │   ├── metrics/route.ts           # Metrics aggregation
│   │   │   ├── chat/route.ts              # AI Chat
│   │   │   ├── reports/route.ts           # Report generation
│   │   │   ├── alerts/route.ts            # Alerts management
│   │   │   └── cron/
│   │   │       ├── sync-all/route.ts      # Automated sync
│   │   │       └── run/route.ts           # Manual cron trigger
│   │   ├── dashboard/                     # Dashboard pages
│   │   │   ├── page.tsx                   # Main dashboard
│   │   │   ├── google-ads/page.tsx
│   │   │   ├── meta/page.tsx
│   │   │   ├── ga4/page.tsx
│   │   │   └── tiktok/page.tsx
│   │   ├── auth/
│   │   │   ├── signin/page.tsx
│   │   │   └── signup/page.tsx
│   │   ├── chat/page.tsx
│   │   ├── reports/page.tsx
│   │   ├── alerts/page.tsx
│   │   ├── settings/page.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx                       # Landing page
│   ├── components/
│   │   ├── ui/                            # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── table.tsx
│   │   │   └── ...
│   │   ├── dashboard/
│   │   │   ├── PlatformDashboard.tsx
│   │   │   ├── PerformanceTable.tsx
│   │   │   └── ROASTrendChart.tsx
│   │   ├── layout/
│   │   │   └── dashboard-layout.tsx
│   │   ├── providers.tsx
│   │   └── ErrorBoundary.tsx
│   ├── lib/
│   │   ├── auth/
│   │   │   └── nextAuthOptions.ts
│   │   ├── etl/
│   │   │   ├── index.ts
│   │   │   ├── loaders/
│   │   │   │   └── campaign-loader.ts
│   │   │   ├── transformers/
│   │   │   │   ├── meta-transformer.ts
│   │   │   │   └── google-ads-transformer.ts
│   │   │   └── utils/
│   │   │       └── retry.ts
│   │   ├── i18n/
│   │   │   └── translations.ts
│   │   ├── pdf/
│   │   │   └── generateReport.ts
│   │   ├── openai.ts
│   │   ├── prisma.ts
│   │   ├── metrics.ts
│   │   ├── permissions.ts
│   │   ├── rate-limit.ts
│   │   └── validation.ts
│   ├── hooks/
│   │   ├── useCompany.tsx                 # Multi-tenant hook
│   │   ├── useLanguage.ts
│   │   └── use-mobile.ts
│   ├── context/
│   │   └── theme-provider.tsx
│   └── types/
│       └── index.ts
├── prisma/
│   ├── schema.prisma
│   └── seed.js
├── scripts/
│   ├── deploy.sh
│   └── setup-google-ads-credentials.sh
├── mcp-server.js                          # MCP: Google Ads/GA4
├── mcp-meta-server.js                     # MCP: Meta Ads
├── mcp-tiktok-server.js                   # MCP: TikTok Ads
├── ecosystem.config.js                    # PM2 config
├── .env.local                             # Environment variables
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

### Design Patterns

#### 1. Multi-Tenant Isolation Pattern
```typescript
// ZAWSZE używaj tego wzorca w API routes
async function validateCompanyAccess(userId: string, companyId: string) {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_companyId: { userId, companyId }
    },
    include: { company: true }
  })
  
  if (!membership) {
    throw new Error('Access denied to company')
  }
  
  return membership
}

// Przykład użycia
export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  const { searchParams } = new URL(req.url)
  const companyId = searchParams.get('companyId')
  
  if (!companyId) {
    return NextResponse.json({ error: 'companyId required' }, { status: 400 })
  }
  
  await validateCompanyAccess(session.user.id, companyId)
  
  // Query MUSI używać companyId
  const campaigns = await prisma.campaign.findMany({
    where: { companyId }
  })
  
  return NextResponse.json({ campaigns })
}
```

#### 2. ETL Pattern
```typescript
// Extract → Transform → Load

// 1. Extract (from platform API)
const rawCampaigns = await fetchGoogleAdsCampaigns(customerId)

// 2. Transform (normalize)
const normalized = rawCampaigns.map(transformGoogleAdsCampaign)

// 3. Load (upsert to DB)
for (const campaign of normalized) {
  await loadCampaignWithMetrics(campaign, companyId)
}
```

#### 3. Repository Pattern (Prisma)
```typescript
// lib/prisma.ts - Singleton pattern
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
```

---

_**Dokument kontynuowany w części 2...**_

