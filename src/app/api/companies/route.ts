// src/app/api/companies/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/nextAuthOptions'
import { getUserCompanies } from '@/lib/permissions'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const companies = await getUserCompanies(session.user.id)

    return NextResponse.json({
      companies: companies.map(c => ({
        id: c.id,
        name: c.name,
        domain: c.domain,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      }))
    })
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}

