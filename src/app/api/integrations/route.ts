// src/app/api/integrations/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { getUserCompanies } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Fetching integrations...')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.id) {
      console.log('❌ No user found')
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('✅ User found:', user.id)

    // Get all companies user has access to
    console.log('🔍 Getting user companies...')
    const companies = await getUserCompanies(user.id)
    console.log('✅ Companies found:', companies.length)
    
    const companyIds = companies.map(c => c.id)
    console.log('🔍 Company IDs:', companyIds)

    // Get all integrations for these companies
    console.log('🔍 Fetching integrations from database...')
    const integrations = await prisma.integration.findMany({
      where: {
        companyId: { in: companyIds }
      },
      select: {
        id: true,
        companyId: true,
        platform: true,
        accountId: true,
        accountName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    console.log('✅ Integrations found:', integrations.length)
    return NextResponse.json({ integrations })
  } catch (error) {
    console.error('❌ Error fetching integrations:', error)
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { error: 'Failed to fetch integrations' },
      { status: 500 }
    )
  }
}

