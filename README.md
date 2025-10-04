# eMarketer.pro - AI-Powered Marketing Analytics

A comprehensive SaaS application that provides intelligent marketing analytics for e-commerce and digital marketing professionals. Connect your Meta Ads, Google Ads, and GA4 accounts to get AI-powered insights, automated reports, and smart alerts.

## 🚀 Features

- **Real-time Analytics Dashboard** - Monitor campaigns with live data visualization
- **AI-Powered Insights** - Get intelligent recommendations and anomaly detection
- **Automated Reports** - Generate weekly/monthly reports with AI summaries
- **Smart Alerts** - Get notified about performance changes and opportunities
- **AI Chat Assistant** - Ask questions about your marketing data
- **Multi-platform Integration** - Connect Meta Ads, Google Ads, and GA4
- **User Authentication** - Secure login with NextAuth.js
- **PDF Report Generation** - Download comprehensive reports

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, TailwindCSS
- **UI Components**: shadcn/ui, Recharts
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL
- **Authentication**: NextAuth.js
- **AI**: OpenAI GPT-4o-mini
- **State Management**: React Query, Zustand
- **PDF Generation**: PDFKit

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL database
- OpenAI API key
- Git

## 🚀 Quick Start

### 1. Clone the repository

```bash
git clone <repository-url>
cd emarketer.pro
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Setup

Copy the environment example file and fill in your values:

```bash
cp env.example .env.local
```

Update `.env.local` with your configuration:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/emarketer?schema=public"

# NextAuth.js
NEXTAUTH_SECRET="your_secret_key_here"
NEXTAUTH_URL="http://localhost:3000"

# OpenAI
OPENAI_API_KEY="sk-your_openai_api_key_here"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

### 4. Database Setup

Generate Prisma client and push the schema:

```bash
npx prisma generate
npx prisma db push
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
emarketer.pro/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Authentication pages
│   │   ├── dashboard/         # Dashboard page
│   │   ├── reports/           # Reports page
│   │   ├── alerts/            # Alerts page
│   │   ├── chat/              # AI Chat page
│   │   └── settings/          # Settings page
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui components
│   │   └── layout/           # Layout components
│   └── lib/                  # Utility libraries
│       ├── auth/             # NextAuth configuration
│       ├── pdf/              # PDF generation
│       └── utils/            # Helper functions
├── prisma/
│   └── schema.prisma         # Database schema
└── public/                   # Static assets
```

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npx prisma studio` - Open Prisma Studio
- `npx prisma db push` - Push schema changes to database
- `npx prisma generate` - Generate Prisma client

## 🗄️ Database Schema

The application uses the following main models:

- **User** - User accounts and authentication
- **Integration** - Connected marketing platforms
- **Campaign** - Marketing campaign data
- **Event** - Conversion events and tracking
- **Alert** - System notifications and alerts
- **Report** - Generated marketing reports
- **ChatMessage** - AI chat conversation history

## 🔐 Authentication

The app supports multiple authentication methods:

- **Credentials** - Email/password login
- **Google OAuth** - Google account login
- **NextAuth.js** - Secure session management

## 🤖 AI Features

- **Chat Assistant** - Ask questions about your marketing data
- **Report Generation** - AI-powered report summaries
- **Anomaly Detection** - Automatic performance alerts
- **Insights** - Intelligent recommendations

## 📊 Mock Data

For testing purposes, the app includes mock data generation:

- Campaign performance data
- Conversion events
- System alerts
- Integration connections

Use the "Generate Mock Data" button in the dashboard to populate test data.

## 🚀 Deployment

### Ubuntu Server Deployment

1. **Install Node.js 20**:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
```

2. **Install PostgreSQL**:
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

3. **Setup Database**:
```bash
sudo -u postgres createdb emarketer
sudo -u postgres createuser emarketer
sudo -u postgres psql -c "ALTER USER emarketer PASSWORD 'your_password';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE emarketer TO emarketer;"
```

4. **Deploy Application**:
```bash
git clone <repository-url>
cd emarketer.pro
npm install
npm run build
```

5. **Environment Variables**:
Set up production environment variables in `.env.local`

6. **Run Migrations**:
```bash
npx prisma db push
```

7. **Start Application**:
```bash
npm start
```

## 🔧 Configuration

### OpenAI API Setup

1. Get an API key from [OpenAI](https://platform.openai.com/api-keys)
2. Add it to your `.env.local` file
3. The AI features will be available in the chat and reports

### Google OAuth Setup

1. Create a project in [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google+ API
3. Create OAuth 2.0 credentials
4. Add client ID and secret to `.env.local`

## 📝 API Endpoints

- `POST /api/auth/register` - User registration
- `GET /api/chat` - Get chat messages
- `POST /api/chat` - Send message to AI
- `GET /api/reports` - Get user reports
- `POST /api/reports` - Generate new report
- `GET /api/alerts` - Get user alerts
- `PATCH /api/alerts` - Update alert status
- `GET /api/integrations` - Get integrations
- `POST /api/integrations` - Add integration
- `POST /api/mock-data` - Generate mock data

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For support and questions:

- Create an issue in the repository
- Check the documentation
- Contact the development team

## 🔮 Roadmap

- [ ] Real Meta Ads API integration
- [ ] Real Google Ads API integration
- [ ] Real GA4 API integration
- [ ] Advanced analytics features
- [ ] Team collaboration
- [ ] Custom dashboard widgets
- [ ] Email notifications
- [ ] Mobile app
- [ ] Advanced AI features
- [ ] White-label solution

---

Built with ❤️ for modern marketers and e-commerce businesses.