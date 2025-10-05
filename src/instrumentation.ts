import cron from 'node-cron'

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    console.log('🚀 Initializing cron jobs...')

    // Auto-sync every 30 minutes
    cron.schedule('*/30 * * * *', async () => {
      console.log('⏰ Running scheduled sync at:', new Date().toISOString())
      
      try {
        const cronSecret = process.env.CRON_SECRET || 'your-secret-key-change-in-production'
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
        
        const response = await fetch(`${baseUrl}/api/cron/sync-all`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${cronSecret}`,
            'Content-Type': 'application/json'
          }
        })

        const data = await response.json()
        
        if (response.ok) {
          console.log('✅ Scheduled sync completed:', data.results)
        } else {
          console.error('❌ Scheduled sync failed:', data)
        }
      } catch (error) {
        console.error('❌ Scheduled sync error:', error)
      }
    })

    console.log('✅ Cron jobs initialized - Auto-sync every 30 minutes')
  }
}

