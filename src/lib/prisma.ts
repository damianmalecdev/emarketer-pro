// src/lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
})

// Force cleanup on hot reload in development
if (process.env.NODE_ENV === 'development') {
  globalForPrisma.prisma = prisma
} else {
  // In production, also cache to prevent duplicate instances
  globalForPrisma.prisma = prisma
}

