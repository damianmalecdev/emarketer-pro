import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextAuthOptions'
import { prisma } from '@/lib/prisma'
import { generateReportSummary } from '@/lib/openai'
import { generatePDFReport, ReportData } from '@/lib/pdf/generateReport'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { type, startDate, endDate } = await request.json()

    if (!type || !startDate || !endDate) {
      return NextResponse.json({ 
        error: 'Type, startDate, and endDate are required' 
      }, { status: 400 })
    }

    // Get campaign metrics for the period
    const metrics = await prisma.campaignMetric.findMany({
      where: {
        campaign: {
          userId: session.user.id
        },
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      include: {
        campaign: {
          select: {
            name: true,
            platform: true
          }
        }
      },
      orderBy: { date: 'desc' }
    })

    // Get alerts for the period
    const alerts = await prisma.alert.findMany({
      where: {
        userId: session.user.id,
        createdAt: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      }
    })

    // Calculate KPIs from metrics
    const totalSpend = metrics.reduce((sum, m) => sum + m.spend, 0)
    const totalRevenue = metrics.reduce((sum, m) => sum + m.revenue, 0)
    const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0)
    const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0)
    const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0)
    const avgCTR = metrics.length > 0 
      ? metrics.reduce((sum, m) => sum + m.ctr, 0) / metrics.length 
      : 0
    const avgCPC = metrics.length > 0 
      ? metrics.reduce((sum, m) => sum + m.cpc, 0) / metrics.length 
      : 0
    const avgROAS = metrics.length > 0 
      ? metrics.reduce((sum, m) => sum + m.roas, 0) / metrics.length 
      : 0
    const avgCPA = metrics.length > 0 
      ? metrics.reduce((sum, m) => sum + m.cpa, 0) / metrics.length 
      : 0

    // Aggregate campaigns from metrics
    const campaignTotals = metrics.reduce((acc, m) => {
      const key = `${m.campaign.name}|${m.campaign.platform}`
      if (!acc[key]) {
        acc[key] = {
          name: m.campaign.name,
          platform: m.campaign.platform,
          spend: 0,
          revenue: 0,
          roas: 0,
          metricsCount: 0
        }
      }
      acc[key].spend += m.spend
      acc[key].revenue += m.revenue
      acc[key].metricsCount++
      return acc
    }, {} as Record<string, any>)

    // Calculate ROAS for each campaign
    const campaigns = Object.values(campaignTotals).map((c: any) => ({
      name: c.name,
      platform: c.platform,
      spend: c.spend,
      revenue: c.revenue,
      roas: c.spend > 0 ? c.revenue / c.spend : 0
    })).sort((a, b) => b.revenue - a.revenue)

    // Prepare report data
    const reportData: ReportData = {
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Marketing Report`,
      period: `${startDate} to ${endDate}`,
      summary: '',
      kpis: {
        totalSpend,
        totalRevenue,
        totalClicks,
        totalConversions,
        totalImpressions,
        avgCTR,
        avgCPC,
        avgROAS,
        avgCPA
      },
      topCampaigns: campaigns.slice(0, 5).map(c => ({
        name: c.name,
        platform: c.platform,
        spend: c.spend,
        revenue: c.revenue,
        roas: c.roas
      })),
      alerts: alerts.map(a => ({
        message: a.message,
        type: a.type,
        severity: a.severity
      }))
    }

    // Generate AI summary
    const aiSummary = await generateReportSummary(reportData, type as 'weekly' | 'monthly')
    reportData.summary = aiSummary

    // Generate PDF
    const pdfUrl = await generatePDFReport(reportData)

    // Save report to database
    const report = await prisma.report.create({
      data: {
        userId: session.user.id,
        title: reportData.title,
        type,
        period: reportData.period,
        summary: reportData.summary,
        aiComment: aiSummary,
        fileUrl: pdfUrl,
        data: reportData as any
      }
    })

    return NextResponse.json({ 
      report,
      pdfUrl,
      message: 'Report generated successfully'
    })

  } catch (error) {
    console.error('Generate report error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')

    const reports = await prisma.report.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    return NextResponse.json({ reports })

  } catch (error) {
    console.error('Get reports error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
