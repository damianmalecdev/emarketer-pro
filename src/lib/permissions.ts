// src/lib/permissions.ts
import { prisma } from './prisma'

export class CompanyAccessError extends Error {
  constructor(userId: string, companyId: string) {
    super(`User ${userId} has no access to company ${companyId}`)
    this.name = 'CompanyAccessError'
  }
}

export async function validateCompanyAccess(userId: string, companyId: string) {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_companyId: { userId, companyId }
    },
    include: { company: true }
  })
  
  if (!membership) {
    throw new CompanyAccessError(userId, companyId)
  }
  
  return membership
}

export async function getUserCompanies(userId: string) {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: { company: true },
    orderBy: { createdAt: 'asc' }
  })
  
  return memberships.map(m => m.company)
}

export async function hasRole(
  userId: string, 
  companyId: string, 
  requiredRole: 'owner' | 'manager' | 'analyst'
): Promise<boolean> {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_companyId: { userId, companyId }
    }
  })
  
  if (!membership) {
    return false
  }
  
  const roleHierarchy: Record<string, number> = {
    owner: 3,
    manager: 2,
    analyst: 1
  }
  
  return roleHierarchy[membership.role] >= roleHierarchy[requiredRole]
}

