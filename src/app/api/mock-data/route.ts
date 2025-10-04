import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextAuthOptions'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await request.json()

    if (action === 'create-mock-integrations') {
      // Create mock integrations
      const mockIntegrations = [
        {
          platform: 'meta',
          accessToken: 'mock_meta_token',
          accountId: 'act_123456789',
          accountName: 'My Facebook Ads Account',
          isActive: true
        },
        {
          platform: 'google',
          accessToken: 'mock_google_token',
          accountId: '123-456-7890',
          accountName: 'My Google Ads Account',
          isActive: true
        },
        {
          platform: 'ga4',
          accessToken: 'mock_ga4_token',
          accountId: 'GA4-123456789',
          accountName: 'My GA4 Property',
          isActive: true
        }
      ]

      for (const integration of mockIntegrations) {
        await prisma.integration.upsert({
          where: {
            userId_platform_accountId: {
              userId: session.user.id,
              platform: integration.platform,
              accountId: integration.accountId
            }
          },
          update: integration,
          create: {
            userId: session.user.id,
            ...integration
          }
        })
      }
    }

    if (action === 'create-mock-campaigns') {
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
          userId: session.user.id,
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
    }

    if (action === 'create-mock-alerts') {
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
            userId: session.user.id,
            ...alert
          }
        })
      }
    }

    if (action === 'create-mock-events') {
      // Create mock conversion events
      const eventTypes = ['page_view', 'add_to_cart', 'purchase', 'signup', 'download']
      const sources = ['website', 'app', 'email', 'social']
      
      const events = []
      const today = new Date()
      
      for (let i = 0; i < 100; i++) {
        const eventTime = new Date(today)
        eventTime.setHours(eventTime.getHours() - Math.floor(Math.random() * 168)) // Last week
        
        const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)]
        const source = sources[Math.floor(Math.random() * sources.length)]
        
        events.push({
          userId: session.user.id,
          eventName: eventType,
          eventValue: eventType === 'purchase' ? Math.random() * 200 + 50 : null,
          eventTime,
          source
        })
      }

      await prisma.event.createMany({
        data: events
      })
    }

    return NextResponse.json({ 
      message: `Mock data created successfully for action: ${action}` 
    })

  } catch (error) {
    console.error('Create mock data error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
