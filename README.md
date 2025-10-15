# eMarketer.pro

Advanced Marketing Analytics SaaS Platform for multi-platform marketing data aggregation and analysis.

## 🚀 Features

- **Multi-Platform Integration** - Google Ads, Meta Ads, TikTok Ads, Google Analytics 4
- **Real-time Analytics Dashboard** - Live performance metrics and KPIs
- **AI-Powered Insights** - GPT-4 chat assistant for data analysis
- **Automated Reports** - PDF generation with AI summaries
- **Multi-Tenant Architecture** - Support for multiple companies per user
- **Smart Alerts** - Anomaly detection and performance notifications
- **MCP Servers** - 30+ tools for advanced operations via Model Context Protocol

## 🛠 Tech Stack

- **Frontend**: Next.js 15, React 19, TailwindCSS 4, shadcn/ui
- **Backend**: Next.js API Routes, Prisma ORM, PostgreSQL
- **Authentication**: NextAuth.js (Credentials + Google OAuth)
- **AI**: OpenAI GPT-4o-mini
- **State Management**: Zustand + React Query
- **Charts**: Recharts
- **PDF**: PDFKit

## 📋 Prerequisites

- Node.js 20+
- PostgreSQL 14+
- npm or yarn

## 🏗 Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/emarketer-pro.git
   cd emarketer-pro
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your values:
   - `DATABASE_URL` - PostgreSQL connection string
   - `NEXTAUTH_SECRET` - Generate with: `openssl rand -base64 32`
   - `NEXTAUTH_URL` - Your app URL (http://localhost:3000 for dev)
   - `GOOGLE_CLIENT_ID` & `GOOGLE_CLIENT_SECRET` - From Google Cloud Console
   - `OPENAI_API_KEY` - From OpenAI platform

4. **Setup database**
   ```bash
   # Generate Prisma client
   npm run db:generate
   
   # Push schema to database
   npm run db:push
   ```

5. **Run development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
emarketer-pro/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/                # API routes
│   │   ├── auth/               # Authentication pages
│   │   ├── dashboard/          # Dashboard pages
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   └── providers.tsx
│   ├── hooks/
│   │   └── useCompany.tsx      # Multi-tenant hook
│   ├── lib/
│   │   ├── auth/               # NextAuth config
│   │   ├── prisma.ts           # Prisma client
│   │   └── permissions.ts      # Access validation
│   └── types/
├── prisma/
│   └── schema.prisma           # Database schema
├── package.json
└── README.md
```

## 🔑 Environment Variables

Required environment variables:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/emarketer"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
OPENAI_API_KEY="your-openai-api-key"
```

See `.env.example` for complete list.

## 🧪 Development

```bash
# Run dev server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run Prisma Studio (database GUI)
npm run db:studio

# Lint code
npm run lint
```

## 📊 Database Schema

The application uses a multi-tenant architecture:

```
User → Membership → Company → Integration → Campaign → CampaignMetric
```

Key models:
- **User**: Authentication and user profile
- **Company**: Multi-tenant organization
- **Membership**: User-Company relationship with roles (owner/manager/analyst)
- **Integration**: Platform connections (Google Ads, Meta, GA4, TikTok)
- **Campaign**: Marketing campaigns from platforms
- **CampaignMetric**: Daily time-series metrics

## 🚦 Getting Started

1. **Sign up** at `/auth/signup` to create an account
2. A default company will be auto-created for you
3. Go to **Settings** to connect your marketing platforms
4. View aggregated data in **Dashboard**
5. Chat with your data using the **AI Assistant**
6. Generate **Reports** with AI insights

## 🔐 Authentication

The app supports two authentication methods:

1. **Email/Password** - Credentials provider with bcrypt hashing
2. **Google OAuth** - One-click sign in with Google

## 🏢 Multi-Tenant Architecture

- Each user can belong to multiple companies
- Data is strictly isolated by `companyId`
- Role-based access control (owner, manager, analyst)
- OAuth integrations are scoped to companies

## 📝 API Endpoints

Key endpoints:

- `POST /api/auth/register` - User registration
- `POST /api/auth/[...nextauth]` - NextAuth handlers
- `GET /api/companies` - List user's companies
- `GET /api/integrations` - List integrations
- Platform-specific sync endpoints (coming soon)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Database ORM by [Prisma](https://www.prisma.io/)
- Authentication by [NextAuth.js](https://next-auth.js.org/)

## 📞 Support

For issues and questions, please open a GitHub issue or contact the maintainers.

---

**Made with ❤️ by the eMarketer.pro team**

