import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateCompanyAccess } from '@/lib/permissions'
import prisma from '@/lib/prisma'

const MCP_SERVER_URL = process.env.MCP_META_ADS_URL || 'http://localhost:8923'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const entityType = searchParams.get('entityType') // 'campaign', 'adset', 'ad'
    const entityId = searchParams.get('entityId')
    const dateStart = searchParams.get('dateStart')
    const dateEnd = searchParams.get('dateEnd')
    const timeframe = searchParams.get('timeframe') || 'daily' // 'hourly', 'daily', 'monthly'
    
    if (!entityType || !entityId || !dateStart || !dateEnd) {
      return NextResponse.json(
        { error: 'entityType, entityId, dateStart, and dateEnd are required' }, 
        { status: 400 }
      )
    }

    // Verify entity belongs to user's company
    let companyId: string | null = null

    if (entityType === 'campaign') {
      const campaign = await prisma.metaCampaign.findUnique({
        where: { id: entityId },
        select: { account: { select: { companyId: true } } },
      })
      companyId = campaign?.account.companyId || null
    } else if (entityType === 'adset') {
      const adset = await prisma.metaAdSet.findUnique({
        where: { id: entityId },
        select: { campaign: { select: { account: { select: { companyId: true } } } } },
      })
      companyId = adset?.campaign.account.companyId || null
    } else if (entityType === 'ad') {
      const ad = await prisma.metaAd.findUnique({
        where: { id: entityId },
        select: { 
          adSet: { 
            select: { 
              campaign: { 
                select: { 
                  account: { 
                    select: { companyId: true } 
                  } 
                } 
              } 
            } 
          } 
        },
      })
      companyId = ad?.adSet.campaign.account.companyId || null
    }

    if (!companyId) {
      return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
    }

    const hasAccess = await validateCompanyAccess(user.id, companyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Proxy to MCP server
    const mcpUrl = new URL(`${MCP_SERVER_URL}/resources/metrics/${entityType}/${entityId}`)
    mcpUrl.searchParams.set('date_start', dateStart)
    mcpUrl.searchParams.set('date_end', dateEnd)
    mcpUrl.searchParams.set('timeframe', timeframe)

    const response = await fetch(mcpUrl.toString())
    
    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.error || 'MCP server error' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      metrics: data.data || [],
    })
  } catch (error: any) {
    console.error('Meta Ads metrics API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
}

