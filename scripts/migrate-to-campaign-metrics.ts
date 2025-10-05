/**
 * Migration Script: Campaign → CampaignMetric
 * 
 * Purpose: Migrate existing campaign data from flat Campaign table
 * to normalized Campaign + CampaignMetric (time-series) structure.
 * 
 * This script:
 * 1. Reads all existing Campaign records
 * 2. Creates CampaignMetric entries with the historical data
 * 3. Updates Campaign.platformCampaignId from Campaign.campaignId
 * 4. Preserves all existing data
 * 
 * Usage:
 *   npx tsx scripts/migrate-to-campaign-metrics.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateCampaignMetrics() {
  console.log('🚀 Starting Campaign → CampaignMetric migration...\n')

  try {
    // Step 1: Get all existing campaigns
    const campaigns = await prisma.campaign.findMany({
      where: {
        // Only migrate campaigns that have metrics data
        OR: [
          { spend: { not: null } },
          { impressions: { not: null } },
          { clicks: { not: null } },
        ]
      },
      orderBy: { createdAt: 'asc' }
    })

    console.log(`📊 Found ${campaigns.length} campaigns with metrics to migrate\n`)

    let migratedCount = 0
    let skippedCount = 0
    let errorCount = 0

    // Step 2: Migrate each campaign
    for (const campaign of campaigns) {
      try {
        console.log(`Processing: ${campaign.platform} - ${campaign.name}`)

        // Update platformCampaignId if not set
        if (!campaign.platformCampaignId && campaign.campaignId) {
          await prisma.campaign.update({
            where: { id: campaign.id },
            data: { platformCampaignId: campaign.campaignId }
          })
          console.log(`  ✓ Updated platformCampaignId: ${campaign.campaignId}`)
        }

        // Create CampaignMetric entry if metrics exist
        if (campaign.spend || campaign.impressions || campaign.clicks) {
          const metricDate = campaign.date || campaign.updatedAt || new Date()

          // Check if metric already exists for this date
          const existingMetric = await prisma.campaignMetric.findUnique({
            where: {
              campaignId_date: {
                campaignId: campaign.id,
                date: new Date(metricDate.toISOString().split('T')[0]) // Date only
              }
            }
          })

          if (existingMetric) {
            console.log(`  ⚠️  Metric already exists for ${metricDate.toISOString().split('T')[0]} - skipping`)
            skippedCount++
          } else {
            await prisma.campaignMetric.create({
              data: {
                campaignId: campaign.id,
                date: new Date(metricDate.toISOString().split('T')[0]), // Date only
                spend: campaign.spend || 0,
                impressions: campaign.impressions || 0,
                clicks: campaign.clicks || 0,
                conversions: campaign.conversions || 0,
                revenue: campaign.revenue || 0,
                ctr: campaign.ctr || 0,
                cpc: campaign.cpc || 0,
                roas: campaign.roas || 0,
                cpa: campaign.conversions && campaign.conversions > 0 
                  ? (campaign.spend || 0) / campaign.conversions 
                  : 0,
              }
            })

            console.log(`  ✅ Created CampaignMetric for ${metricDate.toISOString().split('T')[0]}`)
            migratedCount++
          }
        } else {
          console.log(`  ⚠️  No metrics data - skipping`)
          skippedCount++
        }

        console.log('') // Empty line for readability
      } catch (error) {
        console.error(`  ❌ Error migrating campaign ${campaign.id}:`, error)
        errorCount++
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📈 Migration Summary:')
    console.log('='.repeat(60))
    console.log(`✅ Successfully migrated: ${migratedCount}`)
    console.log(`⚠️  Skipped (already exists or no data): ${skippedCount}`)
    console.log(`❌ Errors: ${errorCount}`)
    console.log(`📊 Total processed: ${campaigns.length}`)
    console.log('='.repeat(60))

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!')
    } else {
      console.log('\n⚠️  Migration completed with errors. Please review the logs above.')
    }

  } catch (error) {
    console.error('\n❌ Fatal error during migration:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

// Run migration
migrateCampaignMetrics()
  .catch((error) => {
    console.error('Migration failed:', error)
    process.exit(1)
  })

