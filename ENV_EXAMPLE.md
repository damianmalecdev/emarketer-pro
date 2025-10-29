# Environment Variables Configuration

Copy this file content to `.env` in your project root and fill in your actual values.

```env
# Database Configuration
# PostgreSQL connection string
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE?schema=SCHEMA
DATABASE_URL="postgresql://user:password@localhost:5432/emarketer_pro?schema=public"

# NextAuth Configuration
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret-here-generate-with-openssl-rand-base64-32"

# Google OAuth Configuration
GOOGLE_CLIENT_ID="your-google-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback/google"

# Google Ads API Configuration
GOOGLE_ADS_DEVELOPER_TOKEN="your-google-ads-developer-token"
GOOGLE_ADS_CLIENT_ID="your-google-ads-client-id.apps.googleusercontent.com"
GOOGLE_ADS_CLIENT_SECRET="your-google-ads-client-secret"
GOOGLE_ADS_REFRESH_TOKEN="your-google-ads-refresh-token"
GOOGLE_ADS_LOGIN_CUSTOMER_ID="1234567890" # Your MCC account ID (optional)

# Meta/Facebook API Configuration
META_APP_ID="your-meta-app-id"
META_APP_SECRET="your-meta-app-secret"
META_ACCESS_TOKEN="your-meta-access-token"

# TikTok API Configuration
TIKTOK_APP_ID="your-tiktok-app-id"
TIKTOK_APP_SECRET="your-tiktok-app-secret"

# Google Analytics 4 Configuration
GA4_PROPERTY_ID="properties/123456789"
GA4_CREDENTIALS_PATH="./config/ga4-credentials.json"

# OpenAI Configuration
OPENAI_API_KEY="sk-your-openai-api-key"
OPENAI_MODEL="gpt-4"

# MCP Server Ports
MCP_META_PORT="8921"
MCP_GOOGLE_ADS_PORT="8922"
MCP_TIKTOK_PORT="8923"

# Application Configuration
NODE_ENV="development"
PORT="3000"

# Email Configuration (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@emarketer-pro.com"

# Redis Configuration (optional, for caching and queue)
REDIS_URL="redis://localhost:6379"

# Sentry Configuration (optional, for error tracking)
SENTRY_DSN="your-sentry-dsn"

# Rate Limiting
API_RATE_LIMIT_REQUESTS="100"
API_RATE_LIMIT_WINDOW="60" # seconds

# Feature Flags
ENABLE_GOOGLE_ADS="true"
ENABLE_META_ADS="true"
ENABLE_TIKTOK_ADS="true"
ENABLE_GA4="true"
ENABLE_AI_CHAT="true"
ENABLE_AUTO_REPORTS="true"
```

## Quick Setup

1. Copy this template to `.env`:
   ```bash
   cp ENV_EXAMPLE.md .env
   ```

2. Update the PostgreSQL connection string with your database credentials

3. Generate a NextAuth secret:
   ```bash
   openssl rand -base64 32
   ```

4. Configure Google Ads API following the guide in `GOOGLE_ADS_SETUP.md`

5. Set up other integrations as needed



