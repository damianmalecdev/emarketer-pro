# MCP (Model Context Protocol) Architecture

Complete documentation for the MCP Server architecture in eMarketer Pro.

## Table of Contents

1. [Overview](#overview)
2. [Architecture Diagram](#architecture-diagram)
3. [MCP Servers](#mcp-servers)
4. [Resource Pattern](#resource-pattern)
5. [Tool Pattern](#tool-pattern)
6. [Data Flow](#data-flow)
7. [Implementation Guide](#implementation-guide)
8. [Best Practices](#best-practices)

---

## Overview

### What is MCP?

Model Context Protocol (MCP) is an architectural pattern that:
- Separates data access from business logic
- Provides standardized resource access patterns
- Enables AI agents to interact with data sources
- Supports caching, rate limiting, and async operations

### Why MCP for eMarketer Pro?

- **Unified Interface**: Consistent API across Google Ads, Meta, TikTok, GA4
- **AI Integration**: LLMs can query marketing data through standardized resources
- **Scalability**: Each platform has dedicated server, scales independently
- **Maintainability**: Clear separation of concerns, easier to debug
- **Performance**: Built-in caching and rate limiting per platform

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                       Next.js Application                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Dashboard │  │  Chat AI │  │ Reports  │  │ Settings │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘  │
│       │             │              │              │         │
│       └─────────────┴──────────────┴──────────────┘         │
│                          │                                   │
│                   API Routes Layer                           │
│                          │                                   │
└──────────────────────────┼───────────────────────────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌────────────────┐  ┌────────────────┐  ┌────────────────┐
│ Google Ads MCP │  │   Meta MCP     │  │  TikTok MCP    │
│  Port: 8922    │  │  Port: 8921    │  │  Port: 8923    │
├────────────────┤  ├────────────────┤  ├────────────────┤
│  Resources:    │  │  Resources:    │  │  Resources:    │
│  - customers   │  │  - accounts    │  │  - accounts    │
│  - campaigns   │  │  - campaigns   │  │  - campaigns   │
│  - adgroups    │  │  - adsets      │  │  - adgroups    │
│  - ads         │  │  - ads         │  │  - ads         │
│  - keywords    │  │  - insights    │  │  - videos      │
│  - metrics     │  │  - audiences   │  │  - metrics     │
│  - insights    │  │                │  │                │
├────────────────┤  ├────────────────┤  ├────────────────┤
│  Tools:        │  │  Tools:        │  │  Tools:        │
│  - sync        │  │  - sync        │  │  - sync        │
│  - create      │  │  - create      │  │  - create      │
│  - update      │  │  - update      │  │  - update      │
│  - bulkOps     │  │  - insights    │  │  - analytics   │
└───────┬────────┘  └───────┬────────┘  └───────┬────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
                  ┌──────────────────┐
                  │  PostgreSQL DB   │
                  │                  │
                  │  - Core Models   │
                  │  - Google Ads    │
                  │  - Meta Ads      │
                  │  - Metrics       │
                  │  - MCP Cache     │
                  │  - Sync Logs     │
                  └──────────────────┘
                            │
                            ▼
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────┐                      ┌───────────────┐
│ Google Ads API│                      │  Meta Graph   │
│   (v16)       │                      │   API (v19)   │
└───────────────┘                      └───────────────┘
```

---

## MCP Servers

### 1. Google Ads MCP Server

**Location**: `/mcp/google-ads-server/`

**Port**: 8922 (configurable via `MCP_GOOGLE_ADS_PORT`)

**Purpose**: Interface for Google Ads API v16

**Key Features**:
- Customer account management
- Campaign/AdGroup/Ad CRUD operations
- Keyword management with quality scores
- Multi-level metrics (hourly, daily, monthly)
- Bulk operations queue
- Rate limiting per customer

**Start Command**:
```bash
npm run mcp:google-ads
```

### 2. Meta MCP Server

**Location**: `/mcp/meta-server/`

**Port**: 8921 (configurable via `MCP_META_PORT`)

**Purpose**: Interface for Meta Graph API v19

**Key Features**:
- Ad account management
- Campaign/AdSet/Ad operations
- Insights and analytics
- Audience management

**Start Command**:
```bash
npm run mcp:meta
```

### 3. Future MCP Servers

#### TikTok MCP Server (Planned)
- Port: 8923
- TikTok Ads API integration

#### GA4 MCP Server (Planned)
- Port: 8924
- Google Analytics 4 Data API

---

## Resource Pattern

### What are Resources?

Resources are **read-only data access patterns** following REST principles:

```
GET /resources/{resource_type}
GET /resources/{resource_type}/{id}
```

### Resource URI Scheme

Each MCP server provides resource URIs for different entity types:

**Google Ads**:
- `customer://` - Customer accounts
- `campaign://` - Campaigns
- `adgroup://` - Ad groups
- `ad://` - Ads
- `keyword://` - Keywords
- `metrics://` - Time-series metrics
- `insights://` - Aggregated insights

**Meta**:
- `account://` - Ad accounts
- `campaign://` - Campaigns
- `adset://` - Ad sets
- `ad://` - Ads
- `insights://` - Insights

### Resource Implementation Example

**Google Ads - List Campaigns**:

```typescript
// GET /resources/campaigns?customer_id=1234567890&status=ENABLED

app.get('/resources/campaigns', async (req, res) => {
  try {
    const customerId = String(req.query.customer_id || '')
    const status = req.query.status as string | undefined
    
    if (!customerId) {
      return res.status(400).json({ error: 'Missing customer_id' })
    }

    const campaigns = await prisma.googleAdsCampaign.findMany({
      where: {
        customerId,
        ...(status && { status: status as any }),
      },
      include: {
        budget: true,
        _count: { select: { adGroups: true } },
      },
      orderBy: { updatedAt: 'desc' },
    })

    res.json({ campaigns })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Unknown error' })
  }
})
```

### Resource Query Parameters

**Standard Parameters** (all resources):
- `page` - Pagination page number
- `limit` - Items per page (default: 50, max: 1000)
- `sort` - Sort field
- `order` - Sort order (asc/desc)

**Filter Parameters** (entity-specific):
- `status` - Filter by status
- `type` - Filter by type
- `start_date` / `end_date` - Date range filters

**Metrics Parameters**:
- `granularity` - hourly, daily, monthly
- `entity_type` - CAMPAIGN, AD_GROUP, AD, KEYWORD
- `entity_id` - Specific entity ID

---

## Tool Pattern

### What are Tools?

Tools are **action-oriented operations** that modify data or trigger processes:

```
POST /tools/{tool_name}
```

### Available Tools

#### Google Ads MCP Server

**`POST /tools/customers`**
```typescript
// List accessible customers from Google Ads API
{
  "accessToken": "ya29.a0...",
  "refreshToken": "1//...",
  "companyId": "uuid"
}
```

**`POST /tools/sync`**
```typescript
// Trigger sync from Google Ads API
{
  "customerId": "1234567890",
  "accessToken": "ya29.a0...",
  "refreshToken": "1//...",
  "syncType": "FULL" | "INCREMENTAL" | "METRICS",
  "entityType": "CAMPAIGNS" | "AD_GROUPS" | "KEYWORDS" | etc
}
```

**`POST /tools/campaigns`**
```typescript
// Create/Update campaigns
{
  "action": "create" | "update" | "list",
  "customerId": "1234567890",
  "accessToken": "ya29.a0...",
  "campaignData": {
    "name": "Summer Sale 2024",
    "type": "SEARCH",
    "status": "PAUSED"
  }
}
```

**`POST /tools/metrics`**
```typescript
// Query metrics from Google Ads API
{
  "customerId": "1234567890",
  "accessToken": "ya29.a0...",
  "startDate": "2024-01-01",
  "endDate": "2024-01-31",
  "entityType": "CAMPAIGN",
  "entityId": "campaign_123"
}
```

**`POST /tools/bulkOperations`**
```typescript
// Queue bulk operations
{
  "customerId": "1234567890",
  "accessToken": "ya29.a0...",
  "operations": [
    {
      "type": "UPDATE_CAMPAIGN",
      "entityType": "CAMPAIGN",
      "entityId": "campaign_123",
      "data": { "status": "PAUSED" }
    }
  ]
}
```

#### Meta MCP Server

**`GET /tools/accounts`**
```typescript
// List ad accounts
{
  "access_token": "your-meta-access-token"
}
```

**`GET /tools/campaigns`**
```typescript
// List campaigns
{
  "access_token": "your-meta-access-token",
  "account_id": "act_123456789"
}
```

**`GET /tools/insights`**
```typescript
// Get insights
{
  "access_token": "your-meta-access-token",
  "account_id": "act_123456789",
  "since": "2024-01-01",
  "until": "2024-01-31"
}
```

---

## Data Flow

### 1. User Initiates Action (Next.js App)

```typescript
// app/dashboard/google-ads/page.tsx
const syncCampaigns = async () => {
  const response = await fetch('/api/integrations/google-ads/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ customerId, syncType: 'FULL' })
  })
  
  const result = await response.json()
}
```

### 2. API Route Processes Request

```typescript
// app/api/integrations/google-ads/sync/route.ts
export async function POST(request: Request) {
  const { customerId, syncType } = await request.json()
  
  // Get customer with tokens
  const customer = await prisma.googleAdsCustomer.findFirst({
    where: { customerId, companyId: session.user.companyId }
  })
  
  // Call MCP server
  const response = await fetch('http://localhost:8922/tools/sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId,
      accessToken: customer.accessToken,
      refreshToken: customer.refreshToken,
      syncType
    })
  })
  
  return Response.json(await response.json())
}
```

### 3. MCP Server Executes Operation

```typescript
// mcp/google-ads-server/index.ts
app.post('/tools/sync', async (req, res) => {
  // Create sync log
  const syncLog = await prisma.googleAdsSyncLog.create({
    data: {
      customerId,
      syncType,
      status: 'IN_PROGRESS',
      startedAt: new Date()
    }
  })
  
  // Call Google Ads API
  const client = new GoogleAdsClient({ accessToken, refreshToken, customerId })
  const campaigns = await client.listCampaigns()
  
  // Save to database
  for (const campaign of campaigns) {
    await prisma.googleAdsCampaign.upsert({
      where: { customerId_campaignId: { customerId, campaignId: campaign.id } },
      update: { ...campaign, lastSyncAt: new Date() },
      create: { customerId, ...campaign }
    })
  }
  
  // Update sync log
  await prisma.googleAdsSyncLog.update({
    where: { id: syncLog.id },
    data: { status: 'SUCCESS', completedAt: new Date() }
  })
  
  res.json({ success: true })
})
```

### 4. Google Ads API Returns Data

```typescript
// mcp/google-ads-server/googleAdsClient.ts
async listCampaigns(): Promise<GoogleAdsCampaignInfo[]> {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type
    FROM campaign
    WHERE campaign.status != 'REMOVED'
  `
  
  // Execute GAQL query
  const response = await this.searchStream(query)
  return response
}
```

### 5. Data Flows Back to User

```
Google Ads API → MCP Server → PostgreSQL → API Route → UI Component → User
```

---

## Implementation Guide

### Adding a New Resource

**Step 1**: Define resource endpoint

```typescript
// mcp/google-ads-server/index.ts
app.get('/resources/extensions', async (req, res) => {
  try {
    const customerId = String(req.query.customer_id || '')
    const type = req.query.type as string | undefined
    
    if (!customerId) {
      return res.status(400).json({ error: 'Missing customer_id' })
    }

    const extensions = await prisma.googleAdsExtension.findMany({
      where: {
        customerId,
        ...(type && { type: type as any })
      }
    })

    res.json({ extensions })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Unknown error' })
  }
})
```

**Step 2**: Add TypeScript types

```typescript
// mcp/google-ads-server/types.ts
export interface GoogleAdsExtensionInfo {
  id: string
  type: GoogleAdsExtensionType
  status: GoogleAdsCampaignStatus
  sitelinkData?: { linkText: string; finalUrls: string[] }
  // ... other fields
}
```

**Step 3**: Create API route

```typescript
// app/api/integrations/google-ads/extensions/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const customerId = searchParams.get('customerId')
  
  const response = await fetch(
    `http://localhost:8922/resources/extensions?customer_id=${customerId}`
  )
  
  return Response.json(await response.json())
}
```

**Step 4**: Use in UI

```typescript
// app/dashboard/google-ads/extensions/page.tsx
const { data: extensions } = useQuery({
  queryKey: ['extensions', customerId],
  queryFn: async () => {
    const res = await fetch(`/api/integrations/google-ads/extensions?customerId=${customerId}`)
    return res.json()
  }
})
```

### Adding a New Tool

**Step 1**: Define tool endpoint

```typescript
// mcp/google-ads-server/index.ts
app.post('/tools/createKeyword', async (req, res) => {
  try {
    const { customerId, accessToken, adGroupId, keywordData } = req.body
    
    // Validate
    if (!customerId || !accessToken || !adGroupId || !keywordData) {
      return res.status(400).json({ error: 'Missing parameters' })
    }
    
    // Call Google Ads API
    const client = new GoogleAdsClient({ accessToken, customerId })
    const keyword = await client.createKeyword(adGroupId, keywordData)
    
    // Save to database
    await prisma.googleAdsKeyword.create({
      data: {
        customerId,
        adGroupId,
        keywordId: keyword.id,
        text: keywordData.text,
        matchType: keywordData.matchType,
        status: 'ENABLED'
      }
    })
    
    // Log change
    await prisma.googleAdsChangeHistory.create({
      data: {
        campaignId: keyword.campaignId,
        entityType: 'KEYWORD',
        entityId: keyword.id,
        changeType: 'CREATE',
        changedBy: 'MCP',
        changedVia: 'API'
      }
    })
    
    res.json({ success: true, keyword })
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Unknown error' })
  }
})
```

**Step 2**: Implement in Google Ads client

```typescript
// mcp/google-ads-server/googleAdsClient.ts
async createKeyword(adGroupId: string, data: GoogleAdsKeywordData) {
  const operation = {
    create: {
      adGroup: `customers/${this.customerId}/adGroups/${adGroupId}`,
      text: data.text,
      matchType: data.matchType,
      cpcBidMicros: data.cpcBidMicros
    }
  }
  
  const response = await this.mutateKeywords([operation])
  return response
}
```

---

## Best Practices

### 1. Error Handling

Always wrap operations in try-catch:

```typescript
app.post('/tools/sync', async (req, res) => {
  try {
    // Operation logic
  } catch (error: any) {
    console.error('Sync error:', error)
    
    // Log error to database
    await prisma.googleAdsSyncLog.update({
      where: { id: syncLogId },
      data: {
        status: 'FAILED',
        error: error.message,
        errorDetails: { stack: error.stack }
      }
    })
    
    res.status(500).json({ 
      error: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    })
  }
})
```

### 2. Rate Limiting

Track and enforce API rate limits:

```typescript
async function checkRateLimit(customerId: string, operationType: string) {
  const window = await prisma.googleAdsRateLimit.findFirst({
    where: {
      customerId,
      operationType,
      windowEnd: { gt: new Date() }
    }
  })
  
  if (window && window.requestCount >= window.maxRequests) {
    throw new Error('Rate limit exceeded')
  }
  
  await prisma.googleAdsRateLimit.upsert({
    where: { /* composite key */ },
    update: { requestCount: { increment: 1 } },
    create: { /* new window */ }
  })
}
```

### 3. Caching

Use MCP cache for frequently accessed data:

```typescript
async function getCachedResource(key: string) {
  const cached = await prisma.googleAdsMCPCache.findUnique({
    where: { cacheKey: key }
  })
  
  if (cached && cached.expiresAt > new Date()) {
    await prisma.googleAdsMCPCache.update({
      where: { id: cached.id },
      data: { hitCount: { increment: 1 }, lastAccessedAt: new Date() }
    })
    return cached.data
  }
  
  return null
}

async function setCachedResource(key: string, data: any, ttl = 3600) {
  await prisma.googleAdsMCPCache.upsert({
    where: { cacheKey: key },
    update: { data, expiresAt: new Date(Date.now() + ttl * 1000) },
    create: {
      cacheKey: key,
      resourceType: 'CAMPAIGN', // or appropriate type
      data,
      expiresAt: new Date(Date.now() + ttl * 1000)
    }
  })
}
```

### 4. Async Operations

Use operation queue for long-running tasks:

```typescript
async function queueOperation(operation: any) {
  return await prisma.googleAdsOperationQueue.create({
    data: {
      operationType: operation.type,
      entityType: operation.entityType,
      payload: operation.data,
      status: 'PENDING',
      nextAttemptAt: new Date()
    }
  })
}

// Process queue with worker
async function processQueue() {
  const pending = await prisma.googleAdsOperationQueue.findMany({
    where: {
      status: 'PENDING',
      nextAttemptAt: { lte: new Date() },
      attempts: { lt: 3 }
    },
    take: 10
  })
  
  for (const op of pending) {
    try {
      // Execute operation
      await executeOperation(op)
      
      await prisma.googleAdsOperationQueue.update({
        where: { id: op.id },
        data: { status: 'COMPLETED', completedAt: new Date() }
      })
    } catch (error: any) {
      await prisma.googleAdsOperationQueue.update({
        where: { id: op.id },
        data: {
          attempts: { increment: 1 },
          lastAttemptAt: new Date(),
          nextAttemptAt: new Date(Date.now() + 60000 * Math.pow(2, op.attempts)),
          error: error.message
        }
      })
    }
  }
}
```

### 5. Logging

Comprehensive logging for debugging:

```typescript
const logger = {
  info: (message: string, meta?: any) => {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || '')
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, error || '')
  }
}

// Usage
logger.info('Starting sync', { customerId, syncType })
logger.error('Sync failed', error)
```

---

## Monitoring & Debugging

### Health Checks

Each MCP server provides health endpoint:

```bash
# Google Ads MCP
curl http://localhost:8922/health

# Meta MCP
curl http://localhost:8921/health
```

### Sync Logs

Query sync history:

```typescript
const recentSyncs = await prisma.googleAdsSyncLog.findMany({
  where: { customerId },
  orderBy: { startedAt: 'desc' },
  take: 10,
  include: {
    customer: { select: { name: true } }
  }
})
```

### Performance Monitoring

Track response times:

```typescript
app.use((req, res, next) => {
  const start = Date.now()
  
  res.on('finish', () => {
    const duration = Date.now() - start
    logger.info('Request completed', {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`
    })
  })
  
  next()
})
```

---

## Future Enhancements

### Planned Features

1. **WebSocket Support**: Real-time updates for metrics
2. **GraphQL API**: Alternative to REST for complex queries
3. **Event Streaming**: Kafka/Redis for event-driven architecture
4. **Multi-region Support**: Deploy MCP servers in multiple regions
5. **Advanced Caching**: Redis integration for distributed caching
6. **AI Agent Integration**: Direct LLM access to MCP resources

### Contributing

To add a new MCP server or enhance existing ones:

1. Follow the established patterns
2. Add comprehensive error handling
3. Include TypeScript types
4. Document resources and tools
5. Add tests
6. Update this documentation

---

## Conclusion

The MCP architecture provides a robust, scalable foundation for multi-platform marketing data integration. By following these patterns and best practices, you can extend the system to support new platforms while maintaining consistency and reliability.

For platform-specific setup guides:
- [Google Ads Setup](./GOOGLE_ADS_SETUP.md)
- [PostgreSQL Migration](./POSTGRESQL_MIGRATION_GUIDE.md)



