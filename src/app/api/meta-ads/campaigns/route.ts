import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateCompanyAccess } from '@/lib/permissions'
import prisma from '@/lib/prisma'

const MCP_SERVER_URL = process.env.MCP_META_ADS_URL || 'http://localhost:8923'

// GET - List campaigns
export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const accountId = searchParams.get('accountId')
    const status = searchParams.get('status')
    const limit = searchParams.get('limit') || '100'
    
    if (!accountId) {
      return NextResponse.json(
        { error: 'accountId required' }, 
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
    const mcpUrl = new URL(`${MCP_SERVER_URL}/resources/campaigns`)
    mcpUrl.searchParams.set('account_id', accountId)
    if (status) mcpUrl.searchParams.set('status', status)
    mcpUrl.searchParams.set('limit', limit)

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
      campaigns: data.data || [],
    })
  } catch (error: any) {
    console.error('Meta Ads campaigns GET error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
}

// POST - Create campaign
export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { accountId, name, objective, status, dailyBudget, lifetimeBudget } = body

    if (!accountId || !name || !objective) {
      return NextResponse.json(
        { error: 'accountId, name, and objective are required' }, 
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
    const mcpUrl = `${MCP_SERVER_URL}/tools/create_campaign`
    const response = await fetch(mcpUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accountId,
        name,
        objective,
        status: status || 'PAUSED',
        dailyBudget,
        lifetimeBudget,
      }),
    })
    
    if (!response.ok) {
      const error = await response.json()
      return NextResponse.json(
        { error: error.error || error.message || 'MCP server error' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    return NextResponse.json({
      success: true,
      campaign: data.data,
      message: data.message || 'Campaign created successfully',
    })
  } catch (error: any) {
    console.error('Meta Ads campaigns POST error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
}

