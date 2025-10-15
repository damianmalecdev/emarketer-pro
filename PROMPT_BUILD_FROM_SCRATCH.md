# 🚀 PROMPT: Zbuduj eMarketer.pro od Zera

## 📖 Przegląd

Ten dokument zawiera **kompletny prompt techniczny** do zbudowania zaawansowanej platformy SaaS do analizy marketingu cyfrowego od podstaw. Prompt został stworzony na bazie istniejącej aplikacji **eMarketer.pro** i zawiera wszystkie niezbędne informacje do replikacji funkcjonalności.

## 📋 Zawartość Dokumentacji

Dokumentacja została podzielona na 4 części dla lepszej czytelności:

### **[Część 1: Podstawy & Architektura](./PROMPT_NOWA_APLIKACJA.md)**
- 📋 Executive Summary - cel i kluczowe funkcjonalności
- 🛠 Tech Stack & Dependencies - kompletny stos technologiczny
- 🗄️ Database Schema - pełny model Prisma z relacjami
- 🏗️ Core Architecture - struktura katalogów i wzorce projektowe

### **[Część 2: Implementacja Kluczowych Funkcji](./PROMPT_NOWA_APLIKACJA_PART2.md)**
- 🔐 Authentication System - NextAuth.js z Google OAuth i Credentials
- 🔗 OAuth Integration Flows - Google Ads, Meta, GA4, TikTok
- 🔄 ETL System - Extract, Transform, Load pipeline
- 🤖 AI Chat Assistant - OpenAI GPT-4o-mini integration
- 📄 PDF Report Generation - automatyczne raporty z AI summaries

### **[Część 3: API & Frontend](./PROMPT_NOWA_APLIKACJA_PART3.md)**
- 📡 Complete API Endpoints - pełna specyfikacja wszystkich endpoints
- 🎨 Frontend Components - React components z przykładami
- 🔧 MCP Servers - 3 serwery Model Context Protocol (30+ tools)
- 🪝 Custom Hooks - useCompany (multi-tenant) i inne

### **[Część 4: Deployment & Best Practices](./PROMPT_NOWA_APLIKACJA_PART4.md)**
- 🔑 Environment Variables - kompletny template .env
- 🚀 Deployment Guide - step-by-step instrukcje (Ubuntu + PM2 + Nginx)
- ✅ Best Practices - code organization, security, performance
- 📋 Implementation Checklist - 100+ punktów kontrolnych
- 🔍 Troubleshooting Guide - rozwiązywanie typowych problemów

---

## 🎯 Czego Nauczysz Się z Tego Promptu

### 1. **Multi-Tenant SaaS Architecture**
Zrozumiesz i zaimplementujesz architekturę wielodostępną:
```
User → Membership → Company → Integration → Campaign → Metrics
```
- Izolacja danych między firmami
- Role-Based Access Control (RBAC)
- Walidacja dostępu na poziomie API

### 2. **OAuth Integration Patterns**
Nauczysz się integrować 4 platformy marketingowe:
- **Google Ads** - GAQL queries, campaign sync
- **Meta Ads** - Facebook/Instagram campaigns, audience insights
- **Google Analytics 4** - event tracking, conversions
- **TikTok Ads** - video metrics, hashtag analysis

### 3. **ETL Pipeline dla Marketing Data**
Zbudujesz system Extract-Transform-Load:
- Platform-specific transformers
- Data normalization
- Time-series metrics (daily snapshots)
- Upsert strategies

### 4. **AI-Powered Features**
Zintegrujesz OpenAI dla inteligentnych funkcji:
- Contextual chat assistant
- Automatic report summaries
- Anomaly detection
- Performance recommendations

### 5. **Model Context Protocol (MCP)**
Stworzysz 3 dedykowane serwery MCP:
- 30+ tools dla zaawansowanych operacji
- Multi-tenant validation
- Structured data responses

---

## 🛠 Tech Stack

```javascript
{
  "frontend": {
    "framework": "Next.js 15 (App Router)",
    "ui": "React 19 + TailwindCSS 4 + shadcn/ui",
    "state": "Zustand + React Query",
    "charts": "Recharts"
  },
  "backend": {
    "runtime": "Node.js 20+",
    "database": "PostgreSQL 14+",
    "orm": "Prisma 6",
    "auth": "NextAuth.js 4"
  },
  "integrations": {
    "ai": "OpenAI GPT-4o-mini",
    "platforms": ["Google Ads", "Meta", "GA4", "TikTok"],
    "pdf": "PDFKit",
    "mcp": "@modelcontextprotocol/sdk"
  },
  "deployment": {
    "process_manager": "PM2",
    "reverse_proxy": "Nginx",
    "ssl": "Let's Encrypt",
    "cron": "node-cron"
  }
}
```

---

## 📊 Kluczowe Funkcjonalności

### ✨ Core Features
1. **Real-time Analytics Dashboard** - monitoring kampanii z live data
2. **Multi-Platform Integration** - Google Ads, Meta, GA4, TikTok
3. **AI Chat Assistant** - rozmowa o danych marketingowych z GPT-4
4. **Automated Reports** - generowanie raportów PDF z AI insights
5. **Smart Alerts** - wykrywanie anomalii i powiadomienia
6. **Multi-Tenant Architecture** - wsparcie wielu firm na użytkownika

### 🔐 Security & Permissions
- NextAuth.js authentication (Credentials + Google OAuth)
- RBAC (owner/manager/analyst roles)
- Multi-tenant data isolation
- OAuth state validation
- Rate limiting
- Input sanitization

### 📈 Analytics & Metrics
- Time-series data (daily snapshots)
- Calculated metrics (ROAS, CTR, CPC, CPA, COS)
- Campaign performance tracking
- Conversion attribution
- Custom date ranges
- Platform comparison

### 🤖 AI Integration
- Contextual chat with marketing data
- Report summarization
- Performance recommendations
- Anomaly detection
- Trend analysis

---

## 🚀 Quick Start (TL;DR)

### 1. Przeczytaj Dokumentację
```bash
# Część 1: Podstawy
📄 PROMPT_NOWA_APLIKACJA.md

# Część 2: Implementacja
📄 PROMPT_NOWA_APLIKACJA_PART2.md

# Część 3: API & Frontend
📄 PROMPT_NOWA_APLIKACJA_PART3.md

# Część 4: Deployment
📄 PROMPT_NOWA_APLIKACJA_PART4.md
```

### 2. Setup Projektu
```bash
# Create Next.js app
npx create-next-app@latest emarketer-pro --typescript --tailwind --app

# Install dependencies
npm install @prisma/client @auth/prisma-adapter next-auth bcryptjs
npm install @tanstack/react-query zustand openai pdfkit
npm install facebook-nodejs-business-sdk @google-analytics/data
npm install @modelcontextprotocol/sdk

# Install dev dependencies
npm install -D prisma tsx

# Setup Prisma
npx prisma init
```

### 3. Skopiuj Schema
```bash
# Copy Prisma schema from Part 1
# Then:
npx prisma generate
npx prisma db push
```

### 4. Skopiuj Environment Variables
```bash
# Copy .env template from Part 4
cp PROMPT_NOWA_APLIKACJA_PART4.md .env.local
# Edit with your values
```

### 5. Implementuj według Checklisty
```bash
# Follow Phase 1-12 checklist from Part 4
# Each phase has specific tasks
```

---

## 📐 Architektura (Diagram ASCII)

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                    │
│  Next.js Frontend (React 19 + TailwindCSS)         │
└─────────────────────────────────────────────────────┘
                           ↓ HTTPS
┌─────────────────────────────────────────────────────┐
│              NGINX REVERSE PROXY (SSL)              │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│           NEXT.JS APP (Port 3200, PM2)              │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐                │
│  │ API Routes   │  │ Server Pages │                │
│  │              │  │              │                │
│  │ • /api/auth  │  │ • /dashboard │                │
│  │ • /api/int.. │  │ • /settings  │                │
│  │ • /api/chat  │  │ • /reports   │                │
│  └──────────────┘  └──────────────┘                │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │          BUSINESS LOGIC LAYER                │  │
│  │  • ETL System (Extract/Transform/Load)       │  │
│  │  • AI Integration (OpenAI)                   │  │
│  │  • PDF Generation                            │  │
│  │  • Permissions & Validation                  │  │
│  └──────────────────────────────────────────────┘  │
│                                                      │
│  ┌──────────────────────────────────────────────┐  │
│  │           PRISMA ORM (Data Access)           │  │
│  └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────┐
│              POSTGRESQL DATABASE                     │
│  • Users, Companies, Memberships                    │
│  • Integrations, Campaigns, Metrics                 │
│  • Time-series data (daily snapshots)               │
└─────────────────────────────────────────────────────┘

          External APIs              MCP Servers (stdio)
┌────────────────────────┐    ┌─────────────────────────┐
│ • Google Ads API       │    │ • emarketer-google     │
│ • Meta Marketing API   │    │ • emarketer-meta       │
│ • GA4 Data API        │    │ • emarketer-tiktok     │
│ • TikTok Ads API      │    │   (30 tools total)     │
│ • OpenAI API          │    └─────────────────────────┘
└────────────────────────┘
```

---

## 🔑 Kluczowe Koncepcje

### Multi-Tenant Pattern
```typescript
// ZAWSZE waliduj dostęp
await validateCompanyAccess(userId, companyId)

// ZAWSZE używaj companyId (nie userId!)
const campaigns = await prisma.campaign.findMany({
  where: { companyId }
})

// OAuth state MUSI zawierać userId + companyId
const state = JSON.stringify({ userId, companyId })
```

### ETL Pattern
```typescript
// 1. Extract - pobierz z API platformy
const rawData = await fetchFromPlatformAPI()

// 2. Transform - normalizuj do unified format
const normalized = transformPlatformData(rawData)

// 3. Load - zapisz do bazy (upsert)
await loadCampaignWithMetrics(normalized, { companyId })
```

### Time-Series Metrics
```typescript
// Daily snapshots z unique constraint
await prisma.campaignMetric.upsert({
  where: {
    campaignId_date: { campaignId, date }
  },
  create: { ...metrics },
  update: { ...metrics }
})
```

---

## 📊 Database Schema (ERD Simplified)

```
┌──────────┐     ┌────────────┐     ┌─────────┐
│   User   │────<│ Membership │>────│ Company │
└──────────┘     └────────────┘     └─────────┘
                                          │
                                          │ 1:N
                                          ↓
                                   ┌─────────────┐
                                   │ Integration │
                                   └─────────────┘
                                          │ 1:N
                                          ↓
                                   ┌──────────┐
                                   │ Campaign │
                                   └──────────┘
                                          │ 1:N
                                          ↓
                                   ┌────────────────┐
                                   │ CampaignMetric │
                                   │ (Time-Series)  │
                                   └────────────────┘
```

**Unique Constraints:**
- `Integration`: `(companyId, platform, accountId)`
- `CampaignMetric`: `(campaignId, date)`
- `Membership`: `(userId, companyId)`

---

## 🎯 Success Metrics

Twoja implementacja jest kompletna gdy:

### Funkcjonalności
- ✅ Użytkownik może się zarejestrować i automatycznie tworzy się company
- ✅ OAuth działa dla wszystkich 4 platform (Google Ads, Meta, GA4, TikTok)
- ✅ Dane synchronizują się poprawnie do CampaignMetric
- ✅ Dashboard pokazuje real-time metryki
- ✅ AI Chat odpowiada z kontekstem danych
- ✅ Raporty PDF generują się z AI summaries
- ✅ Multi-tenant isolation działa (user nie widzi danych innych companies)

### Techniczne
- ✅ Wszystkie API endpoints zwracają poprawne dane
- ✅ Brak N+1 queries (używaj `include` zamiast pętli)
- ✅ Error handling jest kompletny (try-catch + structured responses)
- ✅ Security best practices (input validation, rate limiting, RBAC)
- ✅ MCP servers działają w Cursor
- ✅ Aplikacja deployowana i dostępna w production

### Performance
- ✅ Dashboard ładuje się < 2s
- ✅ API responses < 500ms (avg)
- ✅ Database queries zoptymalizowane (indexes, select)
- ✅ React Query cache działa poprawnie

---

## 📚 Dodatkowe Zasoby

### Dokumentacja Platform
- [Google Ads API](https://developers.google.com/google-ads/api) - GAQL queries, campaign management
- [Meta Marketing API](https://developers.facebook.com/docs/marketing-apis) - Ads, insights, audiences
- [GA4 Data API](https://developers.google.com/analytics/devguides/reporting/data/v1) - Events, conversions
- [TikTok Ads API](https://ads.tiktok.com/marketing_api/docs) - Video ads, analytics
- [OpenAI API](https://platform.openai.com/docs) - GPT-4, chat completions

### Tech Stack Docs
- [Next.js 15](https://nextjs.org/docs) - App Router, Server Components
- [Prisma](https://www.prisma.io/docs) - ORM, migrations, queries
- [NextAuth.js](https://next-auth.js.org) - Authentication, OAuth
- [shadcn/ui](https://ui.shadcn.com) - UI components
- [Recharts](https://recharts.org) - Charts & visualization

### MCP Resources
- [Model Context Protocol](https://modelcontextprotocol.io) - Official docs
- [MCP SDK](https://github.com/modelcontextprotocol/sdk) - TypeScript/JavaScript SDK
- [MCP Servers](https://github.com/modelcontextprotocol/servers) - Example servers

---

## 🤝 Jak Używać Tego Promptu

### Opcja 1: Dla AI (Claude, GPT-4, etc.)
```
Prompt: "Przeczytaj dokumenty PROMPT_NOWA_APLIKACJA.md (części 1-4) 
i zaimplementuj aplikację eMarketer.pro według specyfikacji. 
Zacznij od Phase 1 w checkliście."
```

### Opcja 2: Dla Zespołu Deweloperskiego
1. **Product Manager**: Przeczytaj Część 1 (Executive Summary + Features)
2. **Architect**: Przeczytaj Część 1 (Architecture + Database Schema)
3. **Backend Dev**: Przeczytaj Część 2 (Implementation) + Część 3 (API)
4. **Frontend Dev**: Przeczytaj Część 3 (Components + Hooks)
5. **DevOps**: Przeczytaj Część 4 (Deployment + Environment)
6. **Wszyscy**: Używajcie checklisty z Części 4 do trackowania progress

### Opcja 3: Dla Samodzielnej Nauki
1. Week 1: Przeczytaj wszystkie części, zrozum architekturę
2. Week 2-3: Implementuj Phase 1-4 (Setup + Multi-Tenant + Integrations)
3. Week 4-5: Implementuj Phase 5-7 (Dashboard + AI + Reports)
4. Week 6-7: Implementuj Phase 8-10 (Alerts + MCP + Testing)
5. Week 8: Deployment i dokumentacja

---

## 💡 Pro Tips

### Development
- Używaj `npx prisma studio` do eksploracji bazy danych
- Testuj OAuth flows w incognito mode
- Loguj każdy krok ETL pipeline dla debugowania
- Używaj React Query DevTools do debugowania cache

### Security
- NIGDY nie commituj `.env.local`
- Zawsze waliduj `companyId` przed query
- Używaj prepared statements (Prisma robi to automatycznie)
- Implementuj rate limiting na publicznych endpoints

### Performance
- Używaj `select` zamiast `findMany` gdy możesz
- Implementuj pagination dla dużych list
- Cache często używane dane w React Query
- Używaj indexes dla często queryowanych pól

### Multi-Tenant
- ZAWSZE używaj `companyId` w queries (nie `userId`)
- Przekazuj `companyId` w OAuth state
- Waliduj membership przed każdą operacją
- Testuj z 2+ companies per user

---

## 🎉 Podsumowanie

Ten prompt zawiera **wszystko czego potrzebujesz** do zbudowania zaawansowanej platformy Marketing Analytics SaaS od zera:

- ✅ **Kompletny stack technologiczny** (Next.js 15, React 19, Prisma, PostgreSQL)
- ✅ **Pełny schemat bazy danych** (14 modeli z relacjami)
- ✅ **Gotowe fragmenty kodu** (authentication, OAuth, ETL, AI, PDF)
- ✅ **API endpoints specification** (wszystkie routes z przykładami)
- ✅ **Frontend components** (layouts, dashboards, hooks)
- ✅ **MCP servers** (3 serwery, 30+ tools)
- ✅ **Deployment guide** (Ubuntu + PM2 + Nginx + SSL)
- ✅ **Best practices** (security, performance, code organization)
- ✅ **Implementation checklist** (100+ tasks w 12 fazach)
- ✅ **Troubleshooting guide** (rozwiązania typowych problemów)

**Powodzenia w budowaniu! 🚀**

---

**Stworzono**: 2025-10-15  
**Wersja**: 1.0.0  
**Bazuje na**: eMarketer.pro (production app)  
**Autor**: AI Assistant (Claude Sonnet 4.5)  
**Licencja**: MIT

