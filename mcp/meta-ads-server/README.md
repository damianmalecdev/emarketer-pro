# Meta Ads MCP Server

Model Context Protocol (MCP) Server for Meta Ads (Facebook & Instagram Ads) - Complete integration with Meta Marketing API v21.0+

## Overview

This MCP server provides a comprehensive interface to Meta Ads, enabling:
- Campaign, Ad Set, and Ad management
- Real-time metrics and insights
- Custom audience management
- Lead Ads integration
- Product catalogs (Dynamic Ads)
- Automated synchronization with time-series metrics aggregation
- Bulk operations and batch requests

## Architecture

### Database Structure
- **PostgreSQL** with native Decimal and JSON support
- **40+ models** covering the complete Meta Ads hierarchy
- **Time-series metrics** with three aggregation levels (hourly, daily, monthly)
- **Automatic partitioning** hints for optimal query performance
- **Comprehensive indexing** for fast lookups

### Key Components

```
mcp/meta-ads-server/
├── src/
│   ├── index.ts                 # Main server entry point
│   ├── resources/               # MCP resources (read operations)
│   │   ├── account.ts
│   │   ├── campaign.ts
│   │   └── metrics.ts
│   ├── tools/                   # MCP tools (write operations)
│   │   ├── campaign-management.ts
│   │   ├── sync.ts
│   │   └── bulk-operations.ts
│   ├── services/                # Business logic
│   │   ├── meta-api.service.ts
│   │   ├── sync.service.ts
│   │   ├── cache.service.ts
│   │   └── metrics-aggregation.service.ts
│   ├── types/                   # TypeScript types
│   ├── utils/                   # Utilities
│   └── cron/                    # Scheduled jobs
└── package.json
```

## Installation

1. Install dependencies:
```bash
cd mcp/meta-ads-server
npm install
```

2. Set up environment variables (in root `.env`):
```env
DATABASE_URL="postgresql://user:password@localhost:5432/emarketer"
META_APP_ID="your_app_id"
META_APP_SECRET="your_app_secret"
MCP_META_ADS_PORT=8923
```

3. Run Prisma migration to create tables:
```bash
# From project root
npm run db:migrate:dev
```

4. Generate Prisma client:
```bash
npm run db:generate
```

## Running the Server

### Development Mode

**Start the MCP server:**
```bash
npm run mcp:meta-ads
```

**Start the aggregation cron jobs:**
```bash
npm run mcp:meta-ads:cron
```

### Production Mode

Build and run:
```bash
cd mcp/meta-ads-server
npm run build
npm start
```

## API Endpoints

### Health & Status

- `GET /health` - Health check
- `GET /info` - Server capabilities and information
- `GET /status` - System status with database and cache stats

### MCP Resources (Read Operations)

#### Accounts
- `GET /resources/accounts?company_id={id}` - List all Meta Ad Accounts
- `GET /resources/accounts/:accountId?company_id={id}` - Get account details

#### Campaigns
- `GET /resources/campaigns?account_id={id}&status={status}` - List campaigns
- `GET /resources/campaigns/:campaignId` - Get campaign details

#### Metrics
- `GET /resources/metrics/campaign/:campaignId?date_start={date}&date_end={date}&timeframe={hourly|daily|monthly}` - Campaign metrics
- `GET /resources/metrics/adset/:adSetId?date_start={date}&date_end={date}&timeframe={hourly|daily|monthly}` - Ad Set metrics
- `GET /resources/metrics/ad/:adId?date_start={date}&date_end={date}` - Ad metrics

### MCP Tools (Write Operations)

#### Campaign Management
- `POST /tools/create_campaign` - Create new campaign
- `POST /tools/update_campaign` - Update campaign
- `POST /tools/pause_campaign` - Pause campaign
- `POST /tools/resume_campaign` - Resume campaign
- `POST /tools/delete_campaign` - Delete (archive) campaign

#### Sync Operations
- `POST /tools/sync_account` - Full account synchronization
- `POST /tools/sync_metrics` - Sync metrics for date range
- `POST /tools/force_refresh` - Force refresh cache
- `GET /tools/sync_status/:accountId` - Get sync status

#### Bulk Operations
- `POST /tools/bulk_update_status` - Update status for multiple entities (up to 50)
- `POST /tools/bulk_update_budgets` - Update budgets for multiple entities (up to 50)

## Usage Examples

### Create a Campaign

```bash
curl -X POST http://localhost:8923/tools/create_campaign \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "uuid-here",
    "name": "My Campaign",
    "objective": "OUTCOME_SALES",
    "status": "PAUSED",
    "dailyBudget": 100.00,
    "startTime": "2025-01-01T00:00:00Z"
  }'
```

### Sync Account Data

```bash
curl -X POST http://localhost:8923/tools/sync_account \
  -H "Content-Type: application/json" \
  -d '{
    "accountId": "uuid-here"
  }'
```

### Get Campaign Metrics

```bash
curl "http://localhost:8923/resources/metrics/campaign/uuid-here?date_start=2025-01-01&date_end=2025-01-31&timeframe=daily"
```

### Bulk Update Status

```bash
curl -X POST http://localhost:8923/tools/bulk_update_status \
  -H "Content-Type: application/json" \
  -d '{
    "entityType": "CAMPAIGN",
    "entityIds": ["uuid1", "uuid2", "uuid3"],
    "status": "PAUSED"
  }'
```

## Metrics Aggregation

The server automatically aggregates metrics on a schedule:

- **Hourly → Daily**: Every hour at :05 minutes
- **Daily → Monthly**: Daily at 2:00 AM
- **Rate Limit Cleanup**: Daily at 3:00 AM
- **Cache Cleanup**: Every 6 hours

Manual aggregation:
```typescript
import { metricsAggregationService } from './services/metrics-aggregation.service'

// Aggregate hourly to daily
await metricsAggregationService.aggregateHourlyToDaily(new Date())

// Aggregate daily to monthly
await metricsAggregationService.aggregateDailyToMonthly(2025, 1)
```

## Database Schema Highlights

### Core Models
- `MetaAdsAccount` - Ad accounts with tokens and settings
- `MetaCampaign` - Campaigns with objectives and budgets
- `MetaAdSet` - Ad sets with targeting and optimization
- `MetaAd` - Individual ads with creatives

### Metrics Models (Time-Series)
- `MetaCampaignMetrics{Hourly|Daily|Monthly}`
- `MetaAdSetMetrics{Hourly|Daily|Monthly}`
- `MetaAdMetrics{Hourly|Daily|Monthly}`
- `MetaActionBreakdown` - Action breakdowns by dimension

### Supporting Models
- `MetaCustomAudience` - Custom and lookalike audiences
- `MetaPixel` - Facebook Pixel tracking
- `MetaConversionEvent` - Conversion events
- `MetaLeadForm` & `MetaLead` - Lead Ads
- `MetaProductCatalog` - Product catalogs for Dynamic Ads
- `MetaCreative` - Ad creatives

### MCP Infrastructure
- `MetaSyncLog` - Sync history and status
- `MetaChangeHistory` - Audit log
- `MetaMCPCache` - Resource caching
- `MetaMCPJobQueue` - Async job queue
- `MetaRateLimit` - API rate limiting

## Rate Limiting

The server implements Meta API rate limit tracking:
- **App-level**: 200 calls per hour per user
- **Account-level**: Varies by account
- Automatic tracking and prevention

## Caching Strategy

- **Account data**: 5 minutes TTL
- **Campaign data**: 1 minute TTL
- **Metrics data**: 5 minutes TTL
- Cache invalidation on updates
- Pattern-based cache invalidation

## Error Handling

All errors are logged and returned in a consistent format:
```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message",
  "details": { /* additional context */ }
}
```

### Meta API Error Codes
- `4, 17, 32` - Rate limit errors
- `190, 102` - Authentication errors
- Automatic error classification and handling

## Testing

Check server health:
```bash
curl http://localhost:8923/health
```

Get server info:
```bash
curl http://localhost:8923/info
```

Get system status:
```bash
curl http://localhost:8923/status
```

## Security

1. **Access Tokens** are encrypted in database
2. **MCP Tokens** for controlled access
3. **Permissions system** with granular controls
4. **Audit logging** of all changes
5. **Rate limiting** to prevent abuse

## Meta Marketing API Compatibility

- **API Version**: v21.0+
- **SDK**: facebook-nodejs-business-sdk v23.0.2+
- **Objectives**: Supports all Meta campaign objectives (new and legacy)
- **Optimization Goals**: Comprehensive support for all optimization goals
- **Batch Requests**: Up to 50 operations per request
- **Pagination**: Cursor-based with automatic fetching

## Performance Optimization

1. **Database Indexes**: Composite indexes on frequently queried fields
2. **Partitioning**: Time-series tables partitioned by month
3. **Caching**: Multi-level caching with TTL
4. **Aggregation**: Pre-aggregated metrics for fast queries
5. **Async Jobs**: Background processing for long-running operations

## Monitoring

The `/status` endpoint provides:
- Database connection status
- Cache statistics
- Account and campaign counts
- Recent sync operations
- Memory usage
- Server uptime

## Troubleshooting

### Server won't start
- Check DATABASE_URL is correct
- Ensure Prisma client is generated: `npm run db:generate`
- Check port 8923 is available

### Sync failures
- Verify Meta access tokens are valid
- Check Meta API rate limits
- Review sync logs in database: `MetaSyncLog` table

### Missing metrics
- Ensure aggregation cron is running
- Check if sync completed successfully
- Verify date range parameters

## Development

### Adding New Resources
1. Create handler in `src/resources/`
2. Import in `src/index.ts`
3. Mount with `app.use('/resources', newResource)`

### Adding New Tools
1. Create handler in `src/tools/`
2. Import in `src/index.ts`
3. Mount with `app.use('/tools', newTool)`

### Database Changes
1. Update `prisma/schema.prisma`
2. Run `npm run db:migrate:dev`
3. Generate client: `npm run db:generate`

## License

Part of eMarketer Pro - Advanced Marketing Analytics SaaS Platform

## Support

For issues or questions:
- Check server logs
- Review `/status` endpoint
- Consult Meta Marketing API documentation

