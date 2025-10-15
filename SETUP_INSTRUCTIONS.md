# Setup Instructions for eMarketer.pro

## Quick Start

Follow these steps to get the application running:

### 1. Install Dependencies

```bash
npm install
```

### 2. Setup PostgreSQL Database

Make sure PostgreSQL is installed and running:

```bash
# macOS (with Homebrew)
brew install postgresql@14
brew services start postgresql@14

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql

# Create database
createdb emarketer
```

### 3. Configure Environment Variables

Create `.env.local` file in the project root:

```bash
cp .env.example .env.local
```

**Minimum required variables for local development:**

```env
# Database (update with your PostgreSQL credentials)
DATABASE_URL="postgresql://yourusername@localhost:5432/emarketer?schema=public"

# NextAuth (generate secret with: openssl rand -base64 32)
NEXTAUTH_SECRET="your-generated-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# OpenAI (get from platform.openai.com)
OPENAI_API_KEY="sk-proj-your-key-here"
```

### 4. Initialize Database

```bash
# Generate Prisma Client
npm run db:generate

# Push schema to database (creates tables)
npm run db:push

# Optional: Seed with demo data
npm run db:seed
```

This will create a demo user:
- **Email**: demo@emarketer.pro
- **Password**: demo123456

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Google Cloud Console Setup (for OAuth)

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing one
3. Enable APIs:
   - Google+ API (for OAuth)
   - Google Ads API (for ads integration)
   - Google Analytics Data API (for GA4)
4. Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen
6. Create OAuth Client ID (Web application):
   - **Authorized JavaScript origins**: `http://localhost:3000`
   - **Authorized redirect URIs**: 
     - `http://localhost:3000/api/auth/callback/google`
     - `http://localhost:3000/api/integrations/google-ads/callback`
7. Copy Client ID and Client Secret to `.env.local`

## Testing the Setup

### Test Authentication

1. Go to http://localhost:3000
2. Click "Sign Up"
3. Create an account with email/password
4. You should be redirected to the dashboard

### Test Database

```bash
# Open Prisma Studio (database GUI)
npm run db:studio
```

This opens a browser interface at http://localhost:5555 to view your database.

### Test Multi-Tenant

1. Sign in to your account
2. The system automatically creates a company for you
3. Check the company selector in the dashboard sidebar

## Common Issues

### PostgreSQL Connection Error

```
Error: Can't reach database server at `localhost:5432`
```

**Solution:**
- Verify PostgreSQL is running: `brew services list` (macOS) or `sudo systemctl status postgresql` (Linux)
- Check your `DATABASE_URL` in `.env.local`
- Try connecting manually: `psql -h localhost -U yourusername -d emarketer`

### Prisma Client Not Generated

```
Error: Cannot find module '@prisma/client'
```

**Solution:**
```bash
npm run db:generate
```

### NextAuth Session Error

```
[next-auth][error][SESSION_ERROR]
```

**Solution:**
- Make sure `NEXTAUTH_SECRET` is set in `.env.local`
- Generate a new secret: `openssl rand -base64 32`
- Restart the dev server

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or run on different port
npm run dev -- -p 3001
```

## Next Steps

After setup is complete:

1. **Connect Platforms**: Go to Settings and set up integrations
2. **Explore Dashboard**: View the main analytics dashboard
3. **Test AI Chat**: Try the AI assistant (requires OpenAI API key)
4. **Read Documentation**: Check the full documentation in the PROMPT files

## Development Workflow

```bash
# Make changes to schema
# Edit prisma/schema.prisma

# Push changes to database
npm run db:push

# Regenerate Prisma Client
npm run db:generate

# View database
npm run db:studio

# Run linter
npm run lint

# Build for production
npm run build
```

## Production Deployment

See `PROMPT_NOWA_APLIKACJA_PART4.md` for complete deployment instructions including:
- Ubuntu server setup
- PM2 process manager
- Nginx reverse proxy
- SSL certificates (Let's Encrypt)
- Database backups
- Monitoring

---

**Need Help?**

Open an issue on GitHub or check the documentation files:
- `PROMPT_BUILD_FROM_SCRATCH.md` - Overview
- `PROMPT_NOWA_APLIKACJA.md` - Part 1: Architecture
- `PROMPT_NOWA_APLIKACJA_PART2.md` - Part 2: Implementation
- `PROMPT_NOWA_APLIKACJA_PART3.md` - Part 3: API & Frontend
- `PROMPT_NOWA_APLIKACJA_PART4.md` - Part 4: Deployment

