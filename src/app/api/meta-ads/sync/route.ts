import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateCompanyAccess } from '@/lib/permissions'
import prisma from '@/lib/prisma'

const MCP_SERVER_URL = process.env.MCP_META_ADS_URL || 'http://localhost:8923'

// POST - Sync account or metrics
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { accountId, syncType, dateStart, dateEnd } = body

    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' }, 
        { status: 400 }
      )
    }

    // Verify account belongs to user's company
    const account = await prisma.metaAdsAccount.findUnique({
      where: { id: accountId },
      select: { companyId: true },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const hasAccess = await validateCompanyAccess(user.id, account.companyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Determine which sync endpoint to use
    let mcpUrl: string
    let requestBody: any

    if (syncType === 'metrics' && dateStart && dateEnd) {
      // Sync metrics for date range
      mcpUrl = `${MCP_SERVER_URL}/tools/sync_metrics`
      requestBody = {
        accountId,
        dateStart,
        dateEnd,
      }
    } else {
      // Full account sync
      mcpUrl = `${MCP_SERVER_URL}/tools/sync_account`
      requestBody = {
        accountId,
      }
    }

    // Proxy to MCP server
    const response = await fetch(mcpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    })
    
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
      message: data.message || 'Sync started',
      data: data.data,
    })
  } catch (error: any) {
    console.error('Meta Ads sync API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// GET - Get sync status
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get('accountId')
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId is required' }, 
        { status: 400 }
      )
    }

    // Verify account belongs to user's company
    const account = await prisma.metaAdsAccount.findUnique({
      where: { id: accountId },
      select: { companyId: true },
    })

    if (!account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const hasAccess = await validateCompanyAccess(user.id, account.companyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Proxy to MCP server
    const mcpUrl = `${MCP_SERVER_URL}/tools/sync_status/${accountId}`
    const response = await fetch(mcpUrl)
    
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
      syncStatus: data.data,
    })
  } catch (error: any) {
    console.error('Meta Ads sync status API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
}

