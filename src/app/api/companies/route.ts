// src/app/api/companies/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getUserCompanies } from '@/lib/permissions'
import { prisma } from '@/lib/prisma'
import { v4 as uuidv4 } from 'uuid'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const companies = await getUserCompanies(user.id)

    return NextResponse.json(
      companies.map(c => ({
        id: c.id,
        name: c.name,
        domain: c.domain,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt
      }))
    )
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { name, domain, description } = body

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Company name is required' },
        { status: 400 }
      )
    }

    // Create company and membership in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the company
      const company = await tx.company.create({
        data: {
          id: uuidv4(),
          name: name.trim(),
          domain: domain?.trim() || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }
      })

      // Create membership for the user as owner
      await tx.membership.create({
        data: {
          id: uuidv4(),
          userId: user.id,
          companyId: company.id,
          role: 'owner',
          createdAt: new Date(),
        }
      })

      return company
    })

    return NextResponse.json({
      company: {
        id: result.id,
        name: result.name,
        domain: result.domain,
        createdAt: result.createdAt,
        updatedAt: result.updatedAt
      }
    })
  } catch (error) {
    console.error('Error creating company:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create company' },
      { status: 500 }
    )
  }
}

