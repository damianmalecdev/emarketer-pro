# Google Ads Integration - Quick Start Guide

## 🚀 Getting Started

### 1. Access the Dashboard

Navigate to: `http://localhost:3000/dashboard/google-ads`

### 2. First-Time Setup

If you don't have any customers connected:
1. Click "Connect Google Ads" button
2. Follow OAuth flow to connect your Google Ads account
3. Return to dashboard to see your accounts

### 3. Using the Dashboard

**Select Customer:**
- Use the dropdown at the top to select a Google Ads customer account
- Your selection is saved automatically

**View Metrics:**
- Top cards show aggregated metrics for last 30 days
- Performance chart visualizes trends

**Browse Campaigns:**
- Click the arrow (▶) next to campaign name to expand
- View ad groups within campaign
- Click ad group to see ads and keywords in tabs

**Sync Data:**
- Click "Sync Now" button to fetch latest data from Google Ads
- Sync status shows last sync time

## 📖 API Endpoints

### Customers
```typescript
GET /api/google-ads/customers?companyId=xxx
GET /api/google-ads/customers/[customerId]?companyId=xxx
```

### Campaigns
```typescript
GET /api/google-ads/campaigns?companyId=xxx&customerId=xxx&status=ENABLED
GET /api/google-ads/campaigns/[campaignId]?companyId=xxx
```

### Ad Groups
```typescript
GET /api/google-ads/adgroups?companyId=xxx&campaignId=xxx
```

### Ads
```typescript
GET /api/google-ads/ads?companyId=xxx&adGroupId=xxx
```

### Keywords
```typescript
GET /api/google-ads/keywords?companyId=xxx&adGroupId=xxx
```

### Metrics
```typescript
GET /api/google-ads/metrics?companyId=xxx&entityType=CAMPAIGN&entityId=xxx&startDate=2024-01-01&endDate=2024-01-31&granularity=daily
```

## 💻 Code Examples

### Using React Query Hooks

```typescript
import { useGoogleAdsCampaigns } from '@/hooks/google-ads/useGoogleAdsCampaigns'

function MyCampaignsComponent() {
  const { data, isLoading, error } = useGoogleAdsCampaigns(companyId, {
    customerId: selectedCustomerId,
    status: 'ENABLED'
  })

  if (isLoading) return <LoadingTable />
  if (error) return <div>Error: {error.message}</div>

  const campaigns = data?.data || []
  
  return <CampaignList campaigns={campaigns} />
}
```

### Formatting Utilities

```typescript
import { 
  formatCurrency, 
  formatPercentage, 
  formatMicros 
} from '@/lib/google-ads/formatting'

// Currency
formatCurrency(1234.56, 'USD') // "$1,234.56"

// Percentage
formatPercentage(12.5) // "12.50%"

// Google Ads micros (amount × 1,000,000)
formatMicros(1000000n, 'USD') // "$1.00"
```

### Metric Calculations

```typescript
import { 
  calculateCTR, 
  calculateROAS 
} from '@/lib/google-ads/calculations'

const ctr = calculateCTR(clicks, impressions)
const roas = calculateROAS(revenue, cost)
```

### Date Utilities

```typescript
import { getLastNDays, formatDateToISO } from '@/lib/google-ads/date-utils'

const { startDate, endDate } = getLastNDays(30)
const isoDate = formatDateToISO(new Date()) // "2024-01-15"
```

## 🎨 Using Components

### Status Badge
```typescript
import { StatusBadge } from '@/components/google-ads/shared/StatusBadge'

<StatusBadge status="ENABLED" />
```

### Metric Card
```typescript
import { MetricCard } from '@/components/google-ads/shared/MetricCard'
import { DollarSign } from 'lucide-react'

<MetricCard
  title="Total Spend"
  value={1234.56}
  format="currency"
  currency="USD"
  icon={DollarSign}
  change={12.5}
  subtitle="Last 30 days"
/>
```

### Metric Value
```typescript
import { MetricValue } from '@/components/google-ads/shared/MetricValue'

<MetricValue 
  value={1234.56} 
  format="currency" 
  currency="USD" 
/>
```

### Campaign List
```typescript
import { CampaignList } from '@/components/google-ads/campaigns/CampaignList'

<CampaignList
  campaigns={campaigns}
  currency="USD"
  onCampaignClick={(id) => console.log('Clicked:', id)}
  expandedCampaignId={selectedCampaignId}
>
  {(campaign) => (
    <div>Expanded content for {campaign.name}</div>
  )}
</CampaignList>
```

### Metrics Chart
```typescript
import { MetricsChart } from '@/components/google-ads/metrics/MetricsChart'

<MetricsChart
  data={timeSeriesData}
  metrics={['clicks', 'cost', 'conversions']}
  type="area"
  currency="USD"
  height={300}
/>
```

## 🔧 Configuration

### Cache Times (Stale Times)

Defined in `/src/lib/google-ads/constants.ts`:

```typescript
export const CACHE_TIMES = {
  customers: 10 * 60 * 1000,      // 10 minutes
  campaigns: 5 * 60 * 1000,       // 5 minutes
  adGroups: 5 * 60 * 1000,        // 5 minutes
  ads: 3 * 60 * 1000,             // 3 minutes
  keywords: 3 * 60 * 1000,        // 3 minutes
  metrics: 2 * 60 * 1000,         // 2 minutes
}
```

### Status Colors

```typescript
export const STATUS_COLORS = {
  ENABLED: 'green',
  PAUSED: 'yellow',
  REMOVED: 'red',
  UNKNOWN: 'gray',
}
```

## 📊 Understanding Metrics

### Core Metrics
- **Impressions**: Number of times ads were shown
- **Clicks**: Number of clicks on ads
- **Cost**: Total spend
- **Conversions**: Number of conversions
- **Conversion Value**: Total revenue from conversions

### Calculated Metrics
- **CTR** (Click-Through Rate): (Clicks / Impressions) × 100
- **CPC** (Cost Per Click): Cost / Clicks
- **CPM** (Cost Per Mille): (Cost / Impressions) × 1000
- **Conversion Rate**: (Conversions / Clicks) × 100
- **CPA** (Cost Per Acquisition): Cost / Conversions
- **ROAS** (Return on Ad Spend): Revenue / Cost

## 🐞 Troubleshooting

### No customers showing
- Check if Google Ads integration is connected in Settings
- Try syncing manually with "Sync Now" button
- Verify OAuth tokens haven't expired

### Metrics not loading
- Check date range (default: last 30 days)
- Verify customer account has campaigns
- Try refreshing the page

### Slow performance
- React Query caching should handle most cases
- Check network tab for slow API calls
- Consider implementing virtual scrolling for large lists

## 🔐 Permissions

API routes check:
1. **Authentication**: User must be logged in
2. **Company Access**: User must have access to the company
3. **Data Scope**: Only return data for authorized company

## 📈 Performance Tips

1. **Use pagination** when implementing list views with 100+ items
2. **Implement virtual scrolling** for very long tables
3. **Debounce search inputs** to avoid excessive API calls
4. **Cache aggressively** for data that doesn't change often
5. **Load on-demand** for child entities (already implemented)

## 🎯 Common Tasks

### Add a new metric to dashboard
1. Add to `MetricsChart` metrics array
2. Configure color in `metricConfig`
3. Ensure metric is in time-series data

### Add filtering UI
1. Create filter state
2. Pass to `useGoogleAdsCampaigns` hook options
3. API already supports status/type filters

### Export data
1. Fetch data with appropriate hook
2. Transform to CSV/Excel format
3. Use file download utility

## 🚦 Next Steps

Ready to extend? Consider:
1. **Add CRUD operations** for campaigns
2. **Implement search** across entities
3. **Add date range picker** for metrics
4. **Create custom dashboards** with widget system
5. **Add bulk operations** for efficiency

---

**Need Help?**
- Check the comprehensive docs: `GOOGLE_ADS_FRONTEND_IMPLEMENTATION.md`
- Review Prisma schema: `prisma/schema.prisma`
- Browse component examples in dashboard: `src/app/dashboard/google-ads/page.tsx`





