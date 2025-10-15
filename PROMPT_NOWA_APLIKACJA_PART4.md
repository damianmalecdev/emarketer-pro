# PROMPT: Nowa Aplikacja - Część 4: Environment, Deployment & Best Practices

## 🔑 Environment Variables

### Complete .env Template

```bash
# .env.local

# ============================================
# DATABASE
# ============================================
DATABASE_URL="postgresql://username:password@localhost:5432/emarketer?schema=public"

# ============================================
# NEXTAUTH.JS AUTHENTICATION
# ============================================
NEXTAUTH_SECRET="generate-random-32-char-string-here"
NEXTAUTH_URL="http://localhost:3000"

# ============================================
# OPENAI API
# ============================================
OPENAI_API_KEY="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# ============================================
# GOOGLE OAUTH (for NextAuth)
# ============================================
GOOGLE_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxx"

# ============================================
# GOOGLE ADS API
# ============================================
GOOGLE_ADS_DEVELOPER_TOKEN="xxxxxxxxxxxxx"
GOOGLE_ADS_CLIENT_ID="xxxxx.apps.googleusercontent.com"
GOOGLE_ADS_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxx"
GOOGLE_ADS_LOGIN_CUSTOMER_ID="1234567890"  # Manager account (optional)

# ============================================
# GOOGLE ANALYTICS 4
# ============================================
GA4_CLIENT_ID="xxxxx.apps.googleusercontent.com"  # Can be same as GOOGLE_CLIENT_ID
GA4_CLIENT_SECRET="GOCSPX-xxxxxxxxxxxxx"          # Can be same as GOOGLE_CLIENT_SECRET
GOOGLE_PROJECT_ID="your-project-id-123456"

# ============================================
# META ADS API (Facebook/Instagram)
# ============================================
META_APP_ID="1234567890123456"
META_APP_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# ============================================
# TIKTOK ADS API
# ============================================
TIKTOK_APP_ID="1234567890123456"
TIKTOK_APP_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"

# ============================================
# CRON JOBS SECURITY
# ============================================
CRON_SECRET="generate-another-random-secret-for-cron-endpoints"

# ============================================
# OPTIONAL: RATE LIMITING
# ============================================
RATE_LIMIT_MAX_REQUESTS="100"
RATE_LIMIT_WINDOW_MS="60000"  # 1 minute

# ============================================
# OPTIONAL: SENTRY ERROR TRACKING
# ============================================
SENTRY_DSN=""

# ============================================
# PRODUCTION OVERRIDES
# ============================================
NODE_ENV="development"  # "production" in prod
PORT="3000"             # "3200" in prod
```

### How to Generate Secrets

```bash
# Generate NEXTAUTH_SECRET
openssl rand -base64 32

# Generate CRON_SECRET
openssl rand -hex 32
```

### OAuth Setup Instructions

#### Google Ads API
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google Ads API
4. Create OAuth 2.0 credentials (Web application)
5. Add authorized redirect URI: `https://yourdomain.com/api/integrations/google-ads/callback`
6. Apply for Developer Token at [Google Ads API Center](https://developers.google.com/google-ads/api)

#### Meta Ads API
1. Go to [Meta for Developers](https://developers.facebook.com)
2. Create new app → Business type
3. Add "Marketing API" product
4. Get App ID and App Secret from Settings → Basic
5. Add OAuth redirect URI: `https://yourdomain.com/api/integrations/meta/callback`
6. Request permissions: `ads_read`, `ads_management`, `business_management`
7. Submit for App Review (required for production)

#### TikTok Ads API
1. Go to [TikTok for Business](https://ads.tiktok.com/marketing_api)
2. Apply for Marketing API access
3. Create app and get App ID + Secret
4. Configure OAuth redirect: `https://yourdomain.com/api/integrations/tiktok/callback`

---

## 🚀 Deployment Guide

### 1. Prerequisites

```bash
# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL 14+
sudo apt update
sudo apt install postgresql postgresql-contrib

# Install PM2 globally
npm install -g pm2

# Install Git
sudo apt install git
```

### 2. Database Setup

```bash
# Create database and user
sudo -u postgres psql

postgres=# CREATE DATABASE emarketer;
postgres=# CREATE USER emarketer_user WITH PASSWORD 'secure_password';
postgres=# GRANT ALL PRIVILEGES ON DATABASE emarketer TO emarketer_user;
postgres=# \q

# Test connection
psql -h localhost -U emarketer_user -d emarketer
```

### 3. Application Setup

```bash
# Clone repository
git clone https://github.com/yourusername/emarketer.pro.git
cd emarketer.pro

# Install dependencies
npm install

# Copy environment file
cp env.example .env.local

# Edit .env.local with production values
nano .env.local

# Generate Prisma client
npx prisma generate

# Push database schema
npx prisma db push

# Optional: Seed database
npm run db:seed

# Build application
npm run build
```

### 4. PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'emarketer',
    script: 'npm',
    args: 'run start -- -p 3200',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3200
    },
    error_file: './logs/pm2/emarketer-error.log',
    out_file: './logs/pm2/emarketer-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
}
```

```bash
# Create logs directory
mkdir -p logs/pm2

# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup

# Monitor
pm2 monit

# View logs
pm2 logs emarketer --lines 100
```

### 5. Nginx Configuration (Optional - Reverse Proxy)

```nginx
# /etc/nginx/sites-available/emarketer.pro

server {
    listen 80;
    server_name emarketer.pro www.emarketer.pro;

    location / {
        proxy_pass http://localhost:3200;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    client_max_body_size 10M;
}

# Enable site
sudo ln -s /etc/nginx/sites-available/emarketer.pro /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL Certificate (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d emarketer.pro -d www.emarketer.pro

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

### 7. Cron Jobs Setup

```bash
# Edit crontab
crontab -e

# Add sync job (every hour)
0 * * * * curl -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://emarketer.pro/api/cron/sync-all

# Add daily backup
0 2 * * * pg_dump -h localhost -U emarketer_user emarketer > /backups/emarketer_$(date +\%Y\%m\%d).sql
```

### 8. MCP Servers Configuration (Production)

```json
// .cursor-mcp.json (on server)
{
  "mcpServers": {
    "emarketer-google": {
      "command": "node",
      "args": ["/var/www/emarketer.pro/mcp-server.js"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/emarketer",
        "GOOGLE_CLIENT_ID": "...",
        "GOOGLE_CLIENT_SECRET": "...",
        "GOOGLE_ADS_DEVELOPER_TOKEN": "...",
        "GOOGLE_ADS_CLIENT_ID": "...",
        "GOOGLE_ADS_CLIENT_SECRET": "..."
      }
    },
    "emarketer-meta": {
      "command": "node",
      "args": ["/var/www/emarketer.pro/mcp-meta-server.js"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/emarketer",
        "META_APP_ID": "...",
        "META_APP_SECRET": "..."
      }
    },
    "emarketer-tiktok": {
      "command": "node",
      "args": ["/var/www/emarketer.pro/mcp-tiktok-server.js"],
      "env": {
        "DATABASE_URL": "postgresql://user:pass@localhost:5432/emarketer",
        "TIKTOK_APP_ID": "...",
        "TIKTOK_APP_SECRET": "..."
      }
    }
  }
}
```

---

## ✅ Best Practices & Conventions

### 1. Code Organization

```typescript
// ✅ DO: Use barrel exports
// src/lib/etl/index.ts
export * from './loaders/campaign-loader'
export * from './transformers/meta-transformer'
export * from './transformers/google-ads-transformer'

// ✅ DO: Separate concerns
src/
  lib/          # Pure functions, utilities
  hooks/        # React hooks
  components/   # UI components
  app/          # Pages and API routes
  types/        # TypeScript types

// ❌ DON'T: Mix business logic in components
// Bad
function MyComponent() {
  const data = await fetch('/api/data').then(r => r.json())
  const processed = complexCalculation(data)
  return <div>{processed}</div>
}

// Good
function MyComponent() {
  const { data, isLoading } = useMetrics(companyId)
  if (isLoading) return <Loading />
  return <MetricsDisplay data={data} />
}
```

### 2. Multi-Tenant Rules

```typescript
// ✅ ALWAYS validate company access
async function apiHandler(req: Request) {
  const { companyId } = await req.json()
  await validateCompanyAccess(session.user.id, companyId)
  // ... rest of logic
}

// ✅ ALWAYS use companyId in queries
const campaigns = await prisma.campaign.findMany({
  where: { companyId }  // NOT userId!
})

// ✅ ALWAYS pass companyId in OAuth state
const state = JSON.stringify({ userId, companyId })

// ❌ NEVER use userId for company resources
const campaigns = await prisma.campaign.findMany({
  where: { userId }  // WRONG!
})
```

### 3. Error Handling

```typescript
// ✅ DO: Structured error responses
try {
  const result = await operation()
  return NextResponse.json({ success: true, data: result })
} catch (error) {
  console.error('Operation failed:', error)
  return NextResponse.json(
    { 
      success: false, 
      error: error instanceof Error ? error.message : 'Operation failed' 
    },
    { status: 500 }
  )
}

// ✅ DO: Use custom error classes
class CompanyAccessError extends Error {
  constructor(userId: string, companyId: string) {
    super(`User ${userId} has no access to company ${companyId}`)
    this.name = 'CompanyAccessError'
  }
}

// ✅ DO: Log errors with context
import { logger } from '@/lib/logger'

logger.error('Sync failed', {
  error: error.message,
  platform: 'google-ads',
  companyId,
  timestamp: new Date().toISOString()
})
```

### 4. Database Best Practices

```typescript
// ✅ DO: Use transactions for related operations
await prisma.$transaction(async (tx) => {
  const campaign = await tx.campaign.create({ data: campaignData })
  await tx.campaignMetric.createMany({ data: metricsData })
})

// ✅ DO: Use select to limit fields
const campaigns = await prisma.campaign.findMany({
  select: {
    id: true,
    name: true,
    platform: true
  },
  where: { companyId }
})

// ✅ DO: Use indexes for frequent queries
// Already defined in schema:
// @@index([companyId, platform])
// @@index([campaignId, date])

// ❌ DON'T: N+1 queries
for (const campaign of campaigns) {
  const metrics = await prisma.campaignMetric.findMany({
    where: { campaignId: campaign.id }
  })
}

// ✅ DO: Use include or nested queries
const campaigns = await prisma.campaign.findMany({
  where: { companyId },
  include: { metrics: true }
})
```

### 5. Performance Optimizations

```typescript
// ✅ DO: Paginate large datasets
const campaigns = await prisma.campaign.findMany({
  where: { companyId },
  take: 50,
  skip: page * 50,
  orderBy: { createdAt: 'desc' }
})

// ✅ DO: Use React Query for caching
export function useCampaigns(companyId: string) {
  return useQuery({
    queryKey: ['campaigns', companyId],
    queryFn: () => fetchCampaigns(companyId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000  // 10 minutes
  })
}

// ✅ DO: Implement connection pooling
// Already handled by Prisma singleton pattern in lib/prisma.ts

// ✅ DO: Use streaming for large responses
export async function GET(req: Request) {
  const stream = new ReadableStream({
    async start(controller) {
      const data = await fetchLargeDataset()
      controller.enqueue(new TextEncoder().encode(JSON.stringify(data)))
      controller.close()
    }
  })
  
  return new Response(stream, {
    headers: { 'Content-Type': 'application/json' }
  })
}
```

### 6. Security Checklist

```typescript
// ✅ DO: Validate all inputs
import { z } from 'zod'

const syncSchema = z.object({
  companyId: z.string().uuid(),
  platform: z.enum(['google-ads', 'meta', 'ga4', 'tiktok']),
  days: z.number().min(1).max(90).optional()
})

const validated = syncSchema.parse(await req.json())

// ✅ DO: Sanitize user inputs
import { escape } from 'html-escaper'

const sanitized = escape(userInput)

// ✅ DO: Use environment variables for secrets
const apiKey = process.env.OPENAI_API_KEY
// ❌ NEVER hardcode secrets

// ✅ DO: Implement rate limiting
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  await rateLimit(req)
  // ... rest of handler
}

// ✅ DO: Use HTTPS in production
// Already configured in Nginx with Let's Encrypt

// ✅ DO: Implement CSRF protection
// NextAuth.js handles this automatically
```

---

## 📋 Implementation Checklist

### Phase 1: Setup & Authentication (Week 1)
- [ ] Initialize Next.js 15 project with TypeScript
- [ ] Install and configure TailwindCSS 4
- [ ] Setup shadcn/ui components
- [ ] Configure PostgreSQL database
- [ ] Create Prisma schema with all models
- [ ] Run `prisma db push` and `prisma generate`
- [ ] Implement NextAuth.js with Credentials + Google providers
- [ ] Create registration endpoint with auto-company creation
- [ ] Build login/signup pages
- [ ] Test authentication flow

### Phase 2: Multi-Tenant Core (Week 1-2)
- [ ] Implement `validateCompanyAccess()` helper
- [ ] Create `useCompany()` hook with Zustand
- [ ] Build company selector component
- [ ] Create `/api/companies` endpoint
- [ ] Test multi-company switching
- [ ] Implement RBAC permissions system
- [ ] Create permissions middleware

### Phase 3: Platform Integrations (Week 2-3)
**Google Ads:**
- [ ] Setup Google Cloud project and OAuth credentials
- [ ] Implement `/api/integrations/google-ads` (auth URL)
- [ ] Implement `/api/integrations/google-ads/callback`
- [ ] Implement `/api/integrations/google-ads/sync`
- [ ] Create Google Ads transformer
- [ ] Test OAuth flow end-to-end

**Meta Ads:**
- [ ] Setup Meta for Developers app
- [ ] Implement `/api/integrations/meta` routes
- [ ] Create Meta transformer
- [ ] Test Facebook/Instagram connection

**Google Analytics 4:**
- [ ] Setup GA4 OAuth credentials
- [ ] Implement `/api/integrations/ga4` routes
- [ ] Create GA4 event importer
- [ ] Test GA4 sync

**TikTok Ads:**
- [ ] Apply for TikTok Marketing API
- [ ] Implement `/api/integrations/tiktok` routes
- [ ] Create TikTok transformer
- [ ] Test TikTok connection

### Phase 4: ETL System (Week 3)
- [ ] Create `campaign-loader.ts` with upsert logic
- [ ] Implement platform transformers (all platforms)
- [ ] Add retry logic with exponential backoff
- [ ] Create time-series metrics normalization
- [ ] Test ETL pipeline with real data
- [ ] Add error handling and logging

### Phase 5: Dashboard & Analytics (Week 4)
- [ ] Create main dashboard layout
- [ ] Build `PlatformDashboard` component
- [ ] Implement `/api/metrics` endpoint (overview + campaigns)
- [ ] Create KPI cards with real-time data
- [ ] Build campaigns performance table
- [ ] Add sorting and filtering
- [ ] Create ROAS trend chart (Recharts)
- [ ] Test auto-refresh functionality

### Phase 6: AI Features (Week 4-5)
- [ ] Setup OpenAI API key
- [ ] Implement `/api/chat` endpoint
- [ ] Create context builder from metrics
- [ ] Build chat UI with history
- [ ] Add streaming responses (optional)
- [ ] Implement AI report summarization
- [ ] Test AI recommendations

### Phase 7: Reports & PDF (Week 5)
- [ ] Implement `/api/reports` endpoints
- [ ] Create PDF generation with PDFKit
- [ ] Design report template
- [ ] Add AI-generated insights
- [ ] Store PDFs in file system or S3
- [ ] Build reports listing page
- [ ] Add download functionality

### Phase 8: Alerts & Anomalies (Week 5-6)
- [ ] Create anomaly detection algorithm
- [ ] Implement alert creation logic
- [ ] Build `/api/alerts` endpoints
- [ ] Create alerts UI component
- [ ] Add mark-as-read functionality
- [ ] Test alert triggers

### Phase 9: MCP Servers (Week 6)
- [ ] Create `mcp-server.js` (Google Ads/GA4)
- [ ] Implement 12 Google tools
- [ ] Create `mcp-meta-server.js`
- [ ] Implement 9 Meta tools
- [ ] Create `mcp-tiktok-server.js`
- [ ] Implement 9 TikTok tools
- [ ] Add multi-tenant validation to all tools
- [ ] Test MCP tools in Cursor
- [ ] Document all tools

### Phase 10: Testing & QA (Week 7)
- [ ] Test all OAuth flows
- [ ] Verify multi-tenant isolation
- [ ] Load test API endpoints
- [ ] Test error scenarios
- [ ] Verify data accuracy across platforms
- [ ] Test MCP servers independently
- [ ] Security audit
- [ ] Performance optimization

### Phase 11: Deployment (Week 7-8)
- [ ] Setup production server (Ubuntu)
- [ ] Configure PostgreSQL
- [ ] Setup PM2 with ecosystem.config.js
- [ ] Configure Nginx reverse proxy
- [ ] Setup SSL with Let's Encrypt
- [ ] Configure cron jobs
- [ ] Deploy MCP servers
- [ ] Setup monitoring (PM2, logs)
- [ ] Create backup strategy
- [ ] Document deployment process

### Phase 12: Post-Launch (Ongoing)
- [ ] Monitor error logs
- [ ] Collect user feedback
- [ ] Optimize slow queries
- [ ] Add new features from roadmap
- [ ] Scale infrastructure as needed
- [ ] Submit for Meta App Review (if needed)
- [ ] Apply for Google Ads Standard access

---

## 🔍 Troubleshooting Guide

### Common Issues

**Issue: Prisma connection errors**
```bash
# Solution
# Check DATABASE_URL format
# Restart PostgreSQL
sudo systemctl restart postgresql

# Test connection manually
psql -h localhost -U emarketer_user -d emarketer
```

**Issue: NextAuth session undefined**
```bash
# Solution
# Verify NEXTAUTH_SECRET is set
# Verify NEXTAUTH_URL matches your domain
# Clear browser cookies and restart dev server
```

**Issue: OAuth callback fails**
```bash
# Solution
# Verify redirect URI in OAuth app matches exactly
# Check state parameter parsing
# Verify companyId exists in state
# Check membership validation
```

**Issue: Metrics not syncing**
```bash
# Solution
# Check integration.isActive = true
# Verify API tokens not expired
# Check platform API quotas
# Review transformer logic
# Check database constraints
```

**Issue: MCP tools not working**
```bash
# Solution
# Verify .cursor-mcp.json paths are absolute
# Check environment variables in MCP config
# Test MCP server standalone: node mcp-server.js
# Use MCP Inspector for debugging
```

---

## 🎯 Success Criteria

Your application is successfully built when:

1. ✅ User can register and auto-create company
2. ✅ User can connect Google Ads, Meta, GA4, TikTok
3. ✅ OAuth flows work with companyId state
4. ✅ Data syncs correctly to CampaignMetric table
5. ✅ Dashboard shows real-time metrics
6. ✅ AI Chat provides relevant insights
7. ✅ Reports generate with AI summaries
8. ✅ Multi-tenant isolation is enforced
9. ✅ MCP servers work in Cursor
10. ✅ Application is deployed and accessible
11. ✅ All API endpoints return correct data
12. ✅ No N+1 queries or performance issues
13. ✅ Error handling is comprehensive
14. ✅ Security best practices are followed
15. ✅ Documentation is complete

---

## 📚 Additional Resources

### Documentation
- [Next.js Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org)
- [OpenAI API Reference](https://platform.openai.com/docs)
- [Google Ads API](https://developers.google.com/google-ads/api)
- [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis)
- [GA4 Data API](https://developers.google.com/analytics/devguides/reporting/data/v1)
- [TikTok Ads API](https://ads.tiktok.com/marketing_api/docs)
- [MCP Documentation](https://modelcontextprotocol.io)

### Key Patterns Used
- **Multi-Tenant SaaS**: User → Membership → Company isolation
- **ETL Pipeline**: Extract → Transform → Load pattern
- **Time-Series Data**: Daily snapshots with upsert strategy
- **OAuth State Management**: JSON-encoded userId + companyId
- **RBAC**: Role-based access control with permissions
- **Repository Pattern**: Prisma singleton
- **API Error Handling**: Structured { success, error } responses
- **MCP Tools Pattern**: Validate → Query → Return structured data

---

**🎉 Gratulacje!** Masz teraz kompletny blueprint do zbudowania zaawansowanej aplikacji Marketing Analytics SaaS od podstaw.

**Autor**: eMarketer.pro Development Team  
**Data**: 2025-10-15  
**Wersja**: 1.0.0  
**Licencja**: MIT

