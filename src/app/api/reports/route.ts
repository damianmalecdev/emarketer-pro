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

    // Get campaign data for the period
    const campaigns = await prisma.campaign.findMany({
      where: {
        userId: session.user.id,
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      },
      orderBy: { revenue: 'desc' }
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

    // Calculate KPIs
    const totalSpend = campaigns.reduce((sum, c) => sum + c.spend, 0)
    const totalRevenue = campaigns.reduce((sum, c) => sum + c.revenue, 0)
    const totalClicks = campaigns.reduce((sum, c) => sum + c.clicks, 0)
    const totalConversions = campaigns.reduce((sum, c) => sum + c.conversions, 0)
    const avgCTR = campaigns.length > 0 
      ? campaigns.reduce((sum, c) => sum + c.ctr, 0) / campaigns.length 
      : 0
    const avgCPC = campaigns.length > 0 
      ? campaigns.reduce((sum, c) => sum + c.cpc, 0) / campaigns.length 
      : 0
    const avgROAS = campaigns.length > 0 
      ? campaigns.reduce((sum, c) => sum + c.roas, 0) / campaigns.length 
      : 0

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
        avgCTR,
        avgCPC,
        avgROAS
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
