# Google Ads Integration Setup Guide

Complete guide for setting up Google Ads API integration with MCP Server support.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Google Ads API Setup](#google-ads-api-setup)
3. [Database Migration to PostgreSQL](#database-migration-to-postgresql)
4. [Environment Configuration](#environment-configuration)
5. [MCP Server Setup](#mcp-server-setup)
6. [Testing the Integration](#testing-the-integration)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- Node.js 20+ installed
- PostgreSQL 14+ installed and running
- A Google Ads account with API access
- Google Cloud Console project with OAuth 2.0 credentials
- Google Ads Developer Token (apply at: https://developers.google.com/google-ads/api/docs/get-started/dev-token)

---

## Google Ads API Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google Ads API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google Ads API"
   - Click "Enable"

### Step 2: Configure OAuth 2.0 Credentials

1. In Google Cloud Console, go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "OAuth client ID"
3. Choose "Web application" as application type
4. Configure:
   - **Name**: eMarketer Pro
   - **Authorized JavaScript origins**: `http://localhost:3000` (add production URL later)
   - **Authorized redirect URIs**: 
     - `http://localhost:3000/api/auth/callback/google`
     - `http://localhost:3000/api/integrations/google-ads/callback`
5. Click "Create" and save your **Client ID** and **Client Secret**

### Step 3: Apply for Google Ads Developer Token

1. Log in to your Google Ads account
2. Navigate to **Tools & Settings** > **API Center**
3. Apply for a Developer Token
4. Fill out the form:
   - **Product name**: eMarketer Pro
   - **Description**: Marketing analytics platform with Google Ads integration
   - **Integration type**: Application
5. Submit and wait for approval (usually 24-48 hours)
6. Once approved, copy your **Developer Token**

### Step 4: Get Manager (MCC) Account ID (Optional but Recommended)

If you're managing multiple Google Ads accounts:

1. Create or access your Manager (MCC) account
2. Note your MCC customer ID (format: 123-456-7890)
3. This will be your `GOOGLE_ADS_LOGIN_CUSTOMER_ID`

---

## Database Migration to PostgreSQL

### Step 1: Install PostgreSQL

**macOS (using Homebrew):**
```bash
brew install postgresql@14
brew services start postgresql@14
```

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

**Windows:**
Download and install from [PostgreSQL Downloads](https://www.postgresql.org/download/windows/)

### Step 2: Create Database

```bash
# Connect to PostgreSQL
psql postgres

# Create database
CREATE DATABASE emarketer_pro;

# Create user (if needed)
CREATE USER emarketer_user WITH PASSWORD 'your_secure_password';

# Grant privileges
GRANT ALL PRIVILEGES ON DATABASE emarketer_pro TO emarketer_user;

# Exit psql
\q
```

### Step 3: Update Environment Variables

Update your `.env` file with PostgreSQL connection:

```env
DATABASE_URL="postgresql://emarketer_user:your_secure_password@localhost:5432/emarketer_pro?schema=public"
```

### Step 4: Run Prisma Migration

```bash
# Generate Prisma client
npm run db:generate

# Create initial migration
npm run db:migrate:dev

# Or push schema directly (for development)
npm run db:push
```

---

## Environment Configuration

Create a `.env` file in your project root (or copy from `ENV_EXAMPLE.md`):

```env
# Database
DATABASE_URL="postgresql://emarketer_user:password@localhost:5432/emarketer_pro?schema=public"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="<generate-with-openssl-rand-base64-32>"

# Google OAuth (from Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback/google"

# Google Ads API (from Google Ads API Center)
GOOGLE_ADS_DEVELOPER_TOKEN="your-developer-token"
GOOGLE_ADS_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_ADS_CLIENT_SECRET="your-client-secret"
GOOGLE_ADS_LOGIN_CUSTOMER_ID="1234567890" # Optional: Your MCC ID without dashes

# MCP Server
MCP_GOOGLE_ADS_PORT="8922"

# OpenAI (for AI features)
OPENAI_API_KEY="sk-your-openai-api-key"
```

---

## MCP Server Setup

### Architecture Overview

The Google Ads MCP (Model Context Protocol) Server provides:
- RESTful API for Google Ads data access
- Direct integration with Google Ads API v16
- Caching and rate limiting
- Async operation queue for bulk operations
- Resource-based access pattern

### Start the MCP Server

```bash
# Development mode
npm run mcp:google-ads

# Production mode
NODE_ENV=production npm run mcp:google-ads
```

The server will start on `http://localhost:8922`

### MCP Resources

#### `GET /resources/customers`
List all Google Ads customer accounts

**Query Parameters:**
- `company_id` (required): Your company ID

**Response:**
```json
{
  "customers": [
    {
      "id": "uuid",
      "customerId": "1234567890",
      "name": "My Account",
      "currency": "USD",
      "timezone": "America/New_York",
      "status": "ENABLED"
    }
  ]
}
```

#### `GET /resources/campaigns`
List campaigns for a customer

**Query Parameters:**
- `customer_id` (required): Google Ads customer ID
- `status` (optional): Filter by status (ENABLED, PAUSED, REMOVED)

#### `GET /resources/metrics`
Query time-series metrics

**Query Parameters:**
- `customer_id` (required)
- `entity_type` (default: CAMPAIGN): CAMPAIGN, AD_GROUP, AD, KEYWORD
- `entity_id` (optional): Specific entity ID
- `start_date` (default: 30 days ago)
- `end_date` (default: today)
- `granularity` (default: daily): hourly, daily, monthly

### MCP Tools

#### `POST /tools/sync`
Trigger synchronization from Google Ads API

**Request Body:**
```json
{
  "customerId": "1234567890",
  "accessToken": "ya29.a0...",
  "refreshToken": "1//...",
  "syncType": "FULL",
  "entityType": "CAMPAIGNS"
}
```

#### `POST /tools/campaigns`
Manage campaigns

**Request Body:**
```json
{
  "action": "create",
  "customerId": "1234567890",
  "accessToken": "ya29.a0...",
  "campaignData": {
    "name": "Summer Sale 2024",
    "type": "SEARCH",
    "status": "PAUSED"
  }
}
```

---

## Testing the Integration

### 1. Health Check

```bash
curl http://localhost:8922/health
```

Expected response:
```json
{
  "ok": true,
  "service": "google-ads-mcp"
}
```

### 2. Test OAuth Flow

1. Start your Next.js app: `npm run dev`
2. Navigate to: `http://localhost:3000/api/integrations/google-ads`
3. Click "Connect Google Ads"
4. Authorize the app
5. Check database for new `GoogleAdsCustomer` record

### 3. Test Sync

```bash
curl -X POST http://localhost:8922/tools/sync \
  -H "Content-Type: application/json" \
  -d '{
    "customerId": "1234567890",
    "accessToken": "your-access-token",
    "refreshToken": "your-refresh-token",
    "syncType": "FULL"
  }'
```

### 4. Query Metrics

```bash
curl "http://localhost:8922/resources/metrics?customer_id=1234567890&entity_type=CAMPAIGN&start_date=2024-01-01&end_date=2024-01-31&granularity=daily"
```

---

## Database Schema Overview

### Core Models

- **GoogleAdsCustomer**: Account information and OAuth tokens
- **GoogleAdsCampaign**: Campaign data with budget and targeting
- **GoogleAdsAdGroup**: Ad groups with bidding settings
- **GoogleAdsAd**: Individual ads with creative assets
- **GoogleAdsKeyword**: Keywords with quality scores

### Time-Series Metrics

- **GoogleAdsMetricsHourly**: Hourly metrics (7-day retention)
- **GoogleAdsMetricsDaily**: Daily aggregates (permanent)
- **GoogleAdsMetricsMonthly**: Monthly rollups (permanent)

### MCP Support

- **GoogleAdsSyncLog**: Synchronization history
- **GoogleAdsChangeHistory**: Audit trail
- **GoogleAdsMCPSession**: Active sessions
- **GoogleAdsMCPCache**: Cached data
- **GoogleAdsOperationQueue**: Async operations

---

## Troubleshooting

### Common Issues

#### 1. "Invalid developer token"

**Solution:**
- Verify your developer token is approved (check Google Ads API Center)
- Ensure token is correctly set in `.env`
- Token must be from the same Google Ads account

#### 2. "OAuth authentication failed"

**Solution:**
- Check that redirect URIs match exactly in Google Cloud Console
- Verify `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`
- Clear browser cookies and try again

#### 3. "Database connection failed"

**Solution:**
```bash
# Check PostgreSQL is running
pg_isready

# Test connection
psql "postgresql://emarketer_user:password@localhost:5432/emarketer_pro"

# Reset database (development only!)
npm run db:push --force-reset
```

#### 4. "Rate limit exceeded"

**Solution:**
- Google Ads API has rate limits per customer account
- MCP server includes rate limiting tracking
- Reduce sync frequency
- Use incremental sync instead of full sync

#### 5. "MCP server not responding"

**Solution:**
```bash
# Check if port is in use
lsof -i :8922

# Check logs
npm run mcp:google-ads

# Restart server
pkill -f "mcp/google-ads-server"
npm run mcp:google-ads
```

---

## Advanced Configuration

### Custom Metrics Aggregation

Create a cron job to aggregate hourly metrics into daily:

```typescript
// scripts/aggregate-metrics.ts
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function aggregateHourlyToDaily(date: Date) {
  const hourlyMetrics = await prisma.googleAdsMetricsHourly.findMany({
    where: {
      date: {
        gte: date,
        lt: new Date(date.getTime() + 24 * 60 * 60 * 1000)
      }
    }
  })
  
  // Group by entity and aggregate
  // ... aggregation logic
}
```

### Rate Limiting Strategy

Configure rate limits per customer in `GoogleAdsRateLimit`:

```typescript
await prisma.googleAdsRateLimit.upsert({
  where: {
    customerId_operationType_windowStart: {
      customerId: '1234567890',
      operationType: 'API_READ',
      windowStart: new Date()
    }
  },
  update: {
    requestCount: { increment: 1 }
  },
  create: {
    customerId: '1234567890',
    operationType: 'API_READ',
    requestCount: 1,
    maxRequests: 15000, // Per day
    windowStart: new Date(),
    windowEnd: new Date(Date.now() + 24 * 60 * 60 * 1000)
  }
})
```

---

## Production Deployment

### 1. Environment Variables

Update production environment variables:
- Use production OAuth redirect URIs
- Use production PostgreSQL database
- Enable SSL for database connections
- Set `NODE_ENV=production`

### 2. Database Migrations

```bash
# Run migrations on production
npm run db:migrate:deploy
```

### 3. Process Manager

Use PM2 or similar to manage MCP server:

```bash
# Install PM2
npm install -g pm2

# Start MCP server
pm2 start npm --name "mcp-google-ads" -- run mcp:google-ads

# Save process list
pm2 save

# Setup auto-start on boot
pm2 startup
```

### 4. Monitoring

- Set up error tracking (Sentry)
- Monitor rate limit usage
- Track sync success/failure rates
- Alert on failed operations in queue

---

## API Version Updates

This integration uses **Google Ads API v16**. To update:

1. Check [Google Ads API changelog](https://developers.google.com/google-ads/api/docs/release-notes)
2. Update endpoint URLs in `googleAdsClient.ts`
3. Update field mappings if changed
4. Test thoroughly in staging
5. Update documentation

---

## Support & Resources

- [Google Ads API Documentation](https://developers.google.com/google-ads/api/docs/start)
- [Google Ads API Forum](https://groups.google.com/g/adwords-api)
- [Prisma Documentation](https://www.prisma.io/docs)
- [MCP Protocol Specification](https://spec.modelcontextprotocol.io/)

---

## License

This integration is part of eMarketer Pro and follows the same license terms.



