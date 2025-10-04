const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create a demo user
  const hashedPassword = await bcrypt.hash('demo123', 12)
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@emarketer.pro' },
    update: {},
    create: {
      email: 'demo@emarketer.pro',
      name: 'Demo User',
      password: hashedPassword,
      plan: 'free',
      role: 'user'
    }
  })

  console.log('✅ Demo user created:', user.email)

  // Create mock integrations
  const integrations = [
    {
      platform: 'meta',
      accessToken: 'mock_meta_token',
      accountId: 'act_123456789',
      accountName: 'Demo Facebook Ads Account',
      isActive: true
    },
    {
      platform: 'google',
      accessToken: 'mock_google_token',
      accountId: '123-456-7890',
      accountName: 'Demo Google Ads Account',
      isActive: true
    },
    {
      platform: 'ga4',
      accessToken: 'mock_ga4_token',
      accountId: 'GA4-123456789',
      accountName: 'Demo GA4 Property',
      isActive: true
    }
  ]

  for (const integration of integrations) {
    await prisma.integration.upsert({
      where: {
        userId_platform_accountId: {
          userId: user.id,
          platform: integration.platform,
          accountId: integration.accountId
        }
      },
      update: integration,
      create: {
        userId: user.id,
        ...integration
      }
    })
  }

  console.log('✅ Mock integrations created')

  // Create mock campaigns for the last 30 days
  const platforms = ['meta', 'google', 'ga4']
  const campaignNames = [
    'Summer Sale 2024',
    'Black Friday Campaign',
    'Holiday Shopping',
    'New Product Launch',
    'Retargeting Campaign',
    'Brand Awareness',
    'Lead Generation',
    'Conversion Campaign'
  ]

  const campaigns = []
  const today = new Date()
  
  for (let i = 0; i < 30; i++) {
    const date = new Date(today)
    date.setDate(date.getDate() - i)
    
    const platform = platforms[Math.floor(Math.random() * platforms.length)]
    const campaignName = campaignNames[Math.floor(Math.random() * campaignNames.length)]
    
    const spend = Math.random() * 1000 + 100
    const clicks = Math.floor(Math.random() * 500 + 50)
    const impressions = Math.floor(clicks * (Math.random() * 20 + 5))
    const conversions = Math.floor(clicks * (Math.random() * 0.1 + 0.02))
    const revenue = conversions * (Math.random() * 100 + 50)
    
    const ctr = (clicks / impressions) * 100
    const cpc = spend / clicks
    const roas = revenue / spend

    campaigns.push({
      userId: user.id,
      name: `${campaignName} - ${platform.toUpperCase()}`,
      platform,
      campaignId: `camp_${Date.now()}_${i}`,
      spend: Math.round(spend * 100) / 100,
      impressions,
      clicks,
      conversions,
      revenue: Math.round(revenue * 100) / 100,
      ctr: Math.round(ctr * 100) / 100,
      cpc: Math.round(cpc * 100) / 100,
      roas: Math.round(roas * 100) / 100,
      date
    })
  }

  await prisma.campaign.createMany({
    data: campaigns
  })

  console.log('✅ Mock campaigns created')

  // Create mock alerts
  const mockAlerts = [
    {
      message: 'CTR dropped by 25% in "Summer Sale 2024" campaign',
      type: 'warning',
      severity: 'medium'
    },
    {
      message: 'ROAS below target (2.5x) for "Black Friday Campaign"',
      type: 'error',
      severity: 'high'
    },
    {
      message: 'New high-performing campaign detected: "Holiday Shopping"',
      type: 'info',
      severity: 'low'
    },
    {
      message: 'Budget exceeded for "Lead Generation" campaign',
      type: 'warning',
      severity: 'medium'
    },
    {
      message: 'Conversion rate increased by 15% this week',
      type: 'success',
      severity: 'low'
    }
  ]

  for (const alert of mockAlerts) {
    await prisma.alert.create({
      data: {
        userId: user.id,
        ...alert
      }
    })
  }

  console.log('✅ Mock alerts created')

  // Create mock events
  const eventTypes = ['page_view', 'add_to_cart', 'purchase', 'signup', 'download']
  const sources = ['website', 'app', 'email', 'social']
  
  const events = []
  
  for (let i = 0; i < 100; i++) {
    const eventTime = new Date(today)
    eventTime.setHours(eventTime.getHours() - Math.floor(Math.random() * 168)) // Last week
    
    const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
    const source = sources[Math.floor(Math.random() * sources.length)]
    
    events.push({
      userId: user.id,
      eventName: eventType,
      eventValue: eventType === 'purchase' ? Math.random() * 200 + 50 : null,
      eventTime,
      source
    })
  }

  await prisma.event.createMany({
    data: events
  })

  console.log('✅ Mock events created')

  console.log('🎉 Database seeding completed!')
  console.log('📧 Demo login: demo@emarketer.pro / demo123')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
