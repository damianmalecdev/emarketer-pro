import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { validateCompanyAccess } from '@/lib/permissions'

const MCP_SERVER_URL = process.env.MCP_META_ADS_URL || 'http://localhost:8923'

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const companyId = searchParams.get('companyId')
    
    if (!companyId) {
      return NextResponse.json(
        { error: 'companyId required' }, 
        { status: 400 }
      )
    }

    // Validate company access
    const hasAccess = await validateCompanyAccess(user.id, companyId)
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Proxy to MCP server
    const mcpUrl = `${MCP_SERVER_URL}/resources/accounts?company_id=${companyId}`
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
      accounts: data.data || [],
    })
  } catch (error: any) {
    console.error('Meta Ads accounts API error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' }, 
      { status: 500 }
    )
  }
}

