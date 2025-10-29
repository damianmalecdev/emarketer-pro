// src/app/api/integrations/google-ads/sync/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { validateCompanyAccess } from '@/lib/permissions'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { companyId } = await req.json()

  if (!companyId) {
    return NextResponse.json(
      { error: 'companyId required' },
      { status: 400 }
    )
  }

  // Validate access
  await validateCompanyAccess(user.id, companyId)

  // Get integration
  const integration = await prisma.integration.findFirst({
    where: {
      companyId,
      platform: 'google-ads',
      isActive: true
    }
  })

  if (!integration || !integration.refreshToken) {
    return NextResponse.json(
      { error: 'No Google Ads integration found' },
      { status: 404 }
    )
  }

  try {
    console.log('🔍 Starting Google Ads sync via MCP Server...')
    
    // Call Google Ads MCP Server
    const mcpResponse = await fetch('http://localhost:8922/tools/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerId: integration.accountId || 'default-customer',
        accessToken: integration.accessToken,
        refreshToken: integration.refreshToken,
        companyId: integration.companyId,
        syncType: 'FULL',
        entityType: 'CAMPAIGNS'
      })
    })

    if (!mcpResponse.ok) {
      const errorText = await mcpResponse.text()
      console.error('❌ MCP sync failed:', errorText)
      throw new Error(`MCP sync failed: ${mcpResponse.status} ${errorText}`)
    }

    const data = await mcpResponse.json()
    console.log('✅ MCP sync completed:', data)

    return NextResponse.json({
      success: true,
      message: 'Google Ads sync completed successfully',
      syncLogId: data.syncLogId,
      recordsProcessed: data.recordsProcessed,
      recordsCreated: data.recordsCreated,
      recordsUpdated: data.recordsUpdated
    })
  } catch (error) {
    console.error('❌ Google Ads sync error:', error)
    return NextResponse.json(
      { error: 'Sync failed: ' + (error as Error).message },
      { status: 500 }
    )
  }
}


