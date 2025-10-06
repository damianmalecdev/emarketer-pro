# 🔄 ETL Layer Documentation

## Overview

The ETL (Extract, Transform, Load) layer provides a clean separation of concerns for data ingestion from advertising platforms.

## Architecture

```
┌─────────────────┐
│  API Endpoints  │  ← Extract (fetch raw data from Meta/Google APIs)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Transformers   │  ← Transform (normalize & validate)
│  - meta         │
│  - google-ads   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│    Loaders      │  ← Load (save to database)
│  - campaign     │
└─────────────────┘
```

## Directory Structure

```
src/lib/etl/
├── transformers/
│   ├── meta-transformer.ts         # Meta Ads data transformer
│   └── google-ads-transformer.ts   # Google Ads data transformer
├── loaders/
│   └── campaign-loader.ts          # Database loader
├── utils/
│   └── retry.ts                    # Retry logic with backoff
└── index.ts                        # Central exports
```

---

## 📦 Transformers

### Meta Ads Transformer

**File:** `src/lib/etl/transformers/meta-transformer.ts`

#### Usage:

```typescript
import { transformMetaCampaign } from '@/lib/etl'

const rawCampaign = {
  id: '123456',
  name: 'Summer Sale 2024',
  status: 'ACTIVE',
}

const rawInsights = {
  spend: '1250.50',
  impressions: '50000',
  clicks: '1200',
  ctr: '2.4',
  cpc: '1.04',
  actions: [
    { action_type: 'purchase', value: '25' }
  ]
}

const { campaign, metrics } = transformMetaCampaign(
  rawCampaign,
  rawInsights,
  {
    userId: 'user-123',
    integrationId: 'integration-456',
    revenuePerConversion: 50, // Optional, default: 50
  }
)

// Output:
// campaign: { platformCampaignId, name, platform, status }
// metrics: { date, spend, impressions, clicks, conversions, revenue, ctr, cpc, roas, cpa }
```

#### Features:
- ✅ Extracts conversions from `actions` array
- ✅ Calculates ROAS and CPA
- ✅ Validates negative numbers
- ✅ Batch transformation support

---

### Google Ads Transformer

**File:** `src/lib/etl/transformers/google-ads-transformer.ts`

#### Usage:

```typescript
import { transformGoogleAdsCampaign, aggregateGoogleAdsCampaigns } from '@/lib/etl'

const rawResults = [
  {
    campaign: { id: '789', name: 'Holiday Campaign', status: 'ENABLED' },
    metrics: {
      impressions: '10000',
      clicks: '250',
      costMicros: '1250000000', // = $1,250
      conversions: '12',
      conversionsValue: '3600'
    }
  }
]

// Step 1: Aggregate (Google Ads returns daily rows)
const campaignMap = aggregateGoogleAdsCampaigns(rawResults)

// Step 2: Transform
const transformed = transformGoogleAdsCampaignsBatch(campaignMap, {
  userId: 'user-123',
  integrationId: 'integration-456',
})
```

#### Features:
- ✅ Converts `costMicros` to currency
- ✅ Aggregates daily data by campaign
- ✅ Calculates all derived metrics
- ✅ Batch processing

---

## 💾 Loader

**File:** `src/lib/etl/loaders/campaign-loader.ts`

#### Usage:

```typescript
import { loadCampaignWithMetrics } from '@/lib/etl'

const result = await loadCampaignWithMetrics(
  campaign,  // NormalizedCampaign
  metrics,   // NormalizedMetrics
  {
    userId: 'user-123',
    integrationId: 'integration-456',
  }
)

if (result.success) {
  console.log('Loaded campaign:', result.campaignId)
} else {
  console.error('Failed:', result.error)
}
```

#### Features:
- ✅ Upserts Campaign (master data)
- ✅ Upserts CampaignMetric (daily snapshot)
- ✅ Normalizes date to midnight
- ✅ Batch loading support
- ✅ Error handling per campaign

---

## 🔁 Retry Utility

**File:** `src/lib/etl/utils/retry.ts`

#### Usage:

```typescript
import { retryWithBackoff, isRetryableError } from '@/lib/etl'

const data = await retryWithBackoff(
  async () => {
    return await fetch('https://api.example.com/data')
  },
  {
    maxAttempts: 3,
    initialDelay: 1000,      // 1 second
    maxDelay: 30000,         // 30 seconds
    backoffMultiplier: 2,    // Exponential backoff
    onRetry: (attempt, error) => {
      console.log(`Retry ${attempt}:`, error.message)
    },
  }
)
```

#### Features:
- ✅ Exponential backoff
- ✅ Configurable max attempts
- ✅ Retry only on network/rate-limit errors
- ✅ Custom retry callbacks

---

## 🔧 Example: Full ETL Pipeline

### Meta Ads Sync (Refactored)

```typescript
import {
  transformMetaCampaign,
  loadCampaignWithMetrics,
  retryWithBackoff,
} from '@/lib/etl'

export async function syncMetaAds(userId: string, integration: any) {
  // 1. EXTRACT
  const campaigns = await retryWithBackoff(async () => {
    const response = await fetch(
      `https://graph.facebook.com/v18.0/${accountId}/campaigns?...`
    )
    return await response.json()
  })

  // 2. TRANSFORM
  const transformed = campaigns.data.map((campaign: any) => {
    return transformMetaCampaign(
      campaign,
      campaign.insights?.[0] || {},
      {
        userId,
        integrationId: integration.id,
        revenuePerConversion: 50,
      }
    )
  })

  // 3. LOAD
  let successCount = 0
  for (const item of transformed) {
    const result = await loadCampaignWithMetrics(
      item.campaign,
      item.metrics,
      { userId, integrationId: integration.id }
    )
    if (result.success) successCount++
  }

  return { success: true, loaded: successCount }
}
```

---

## 📊 Benefits of ETL Layer

### Before (Inline):
```typescript
// ❌ All logic mixed in API route
await prisma.campaign.upsert({
  where: { ... },
  update: {
    spend: parseFloat(insights.spend || 0),
    conversions: parseFloat(conversions),
    revenue: conversions * 50, // Hardcoded
    roas: spend > 0 ? revenue / spend : 0,
    // ... 20 more lines
  }
})
```

### After (ETL):
```typescript
// ✅ Clean separation
const { campaign, metrics } = transformMetaCampaign(raw, insights, config)
await loadCampaignWithMetrics(campaign, metrics, config)
```

### Advantages:
- ✅ **Testable** - Each function can be unit tested
- ✅ **Reusable** - Use transformers in sync endpoints + cron jobs
- ✅ **Maintainable** - Business logic in one place
- ✅ **Type-safe** - Clear interfaces between layers
- ✅ **Error handling** - Centralized retry logic

---

## 🧪 Testing

```typescript
import { transformMetaCampaign } from '@/lib/etl'

describe('transformMetaCampaign', () => {
  it('should calculate ROAS correctly', () => {
    const { metrics } = transformMetaCampaign(
      { id: '1', name: 'Test', status: 'ACTIVE' },
      { spend: '100', actions: [{ action_type: 'purchase', value: '2' }] },
      { userId: 'u1', integrationId: 'i1', revenuePerConversion: 50 }
    )
    
    expect(metrics.revenue).toBe(100) // 2 conversions * $50
    expect(metrics.roas).toBe(1.0)    // $100 revenue / $100 spend
  })
})
```

---

## 🚀 Migration Path

### Phase 1: Create ETL layer (✅ Done)
- ✅ Transformers created
- ✅ Loaders created
- ✅ Utils created

### Phase 2: Refactor sync endpoints (Optional)
- 🔲 Update `/api/integrations/meta/sync` to use ETL
- 🔲 Update `/api/integrations/google-ads/sync` to use ETL
- 🔲 Update `/api/cron/sync-all` to use ETL

### Phase 3: Add more features
- 🔲 Data validation schemas (Zod)
- 🔲 Rate limiting per platform
- 🔲 Queue system (BullMQ)

---

## 📝 Notes

- ETL layer is **ready to use** but not yet integrated into sync endpoints
- Current sync endpoints work fine with inline logic
- Use ETL for **new integrations** (e.g., GA4)
- Gradually migrate existing endpoints when needed

---

## 🔗 Related Files

- `/src/app/api/integrations/meta/sync/route.ts` - Meta Ads sync endpoint
- `/src/app/api/integrations/google-ads/sync/route.ts` - Google Ads sync endpoint
- `/src/app/api/cron/sync-all/route.ts` - Cron job for all platforms
- `/src/lib/prisma.ts` - Prisma client
- `/prisma/schema.prisma` - Database schema

---

**Documentation created:** 2025-10-06
**Version:** 1.0
**Status:** ✅ Production Ready

