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

    // Get active GA4 integration
    const integration = await prisma.integration.findFirst({
      where: {
        userId: session.user.id,
        platform: 'ga4',
        isActive: true
      }
    })

    if (!integration) {
      return NextResponse.json({ error: 'No active GA4 integration found' }, { status: 404 })
    }

    if (!integration.accessToken) {
      return NextResponse.json({ error: 'No access token found' }, { status: 400 })
    }

    // Refresh token if needed
    let accessToken = integration.accessToken
    if (integration.refreshToken && integration.expiresAt && new Date() > integration.expiresAt) {
      const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          refresh_token: integration.refreshToken,
          grant_type: 'refresh_token'
        })
      })

      if (refreshResponse.ok) {
        const refreshData = await refreshResponse.json()
        accessToken = refreshData.access_token
        
        // Update token in database
        await prisma.integration.update({
          where: { id: integration.id },
          data: {
            accessToken: refreshData.access_token,
            expiresAt: refreshData.expires_in 
              ? new Date(Date.now() + refreshData.expires_in * 1000)
              : null
          }
        })
      }
    }

    const propertyId = integration.accountId || 'default'

    // Fetch events from GA4 Data API (last 7 days)
    const reportResponse = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dateRanges: [{ startDate: '7daysAgo', endDate: 'today' }],
          dimensions: [
            { name: 'date' },
            { name: 'eventName' },
            { name: 'sessionSource' },
            { name: 'sessionMedium' },
            { name: 'sessionCampaignName' }
          ],
          metrics: [
            { name: 'eventCount' },
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'eventValue' }
          ],
          limit: 1000
        })
      }
    )

    if (!reportResponse.ok) {
      const error = await reportResponse.text()
      console.error('GA4 Data API error:', error)
      
      return NextResponse.json({ 
        error: 'Failed to fetch GA4 data. Make sure your property ID is correct and you have access.',
        details: error
      }, { status: reportResponse.status })
    }

    const reportData = await reportResponse.json()
    const rows = reportData.rows || []

    let totalEvents = 0

    // Save events to database
    for (const row of rows) {
      const dimensions = row.dimensionValues || []
      const metrics = row.metricValues || []

      const eventDate = dimensions[0]?.value || new Date().toISOString().split('T')[0]
      const eventName = dimensions[1]?.value || 'unknown'
      const source = dimensions[2]?.value || '(direct)'
      const medium = dimensions[3]?.value || '(none)'
      const campaignName = dimensions[4]?.value || '(not set)'

      const eventCount = parseInt(metrics[0]?.value || '0', 10)
      const sessions = parseInt(metrics[1]?.value || '0', 10)
      const users = parseInt(metrics[2]?.value || '0', 10)
      const eventValue = parseFloat(metrics[3]?.value || '0')

      // Convert date string to Date object
      const eventTime = new Date(eventDate)

      await prisma.event.create({
        data: {
          userId: session.user.id,
          eventName,
          eventValue,
          eventTime,
          source: 'ga4',
          eventParams: {
            source,
            medium,
            campaignName,
            eventCount,
            sessions,
            users
          }
        }
      })

      totalEvents++
    }

    return NextResponse.json({
      success: true,
      message: 'GA4 data synced successfully',
      events: totalEvents
    })

  } catch (error) {
    console.error('GA4 sync error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

// GET endpoint to check sync status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get event count
    const eventCount = await prisma.event.count({
      where: {
        userId: session.user.id,
        source: 'ga4'
      }
    })

    // Get last event
    const lastEvent = await prisma.event.findFirst({
      where: {
        userId: session.user.id,
        source: 'ga4'
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        eventTime: true,
        createdAt: true
      }
    })

    return NextResponse.json({
      success: true,
      lastSync: lastEvent?.createdAt || null,
      lastEventTime: lastEvent?.eventTime || null,
      eventCount
    })

  } catch (error) {
    console.error('GA4 sync status error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    )
  }
}

