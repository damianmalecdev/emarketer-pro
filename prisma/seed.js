// prisma/seed.js
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding database...')

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo123456', 10)
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@emarketer.pro' },
    update: {},
    create: {
      email: 'demo@emarketer.pro',
      name: 'Demo User',
      password: hashedPassword,
      memberships: {
        create: {
          role: 'owner',
          company: {
            create: {
              name: 'Demo Company',
              domain: 'demo.com'
            }
          }
        }
      }
    },
  })

  console.log('✅ Created demo user:', user.email)
  console.log('   Password: demo123456')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

