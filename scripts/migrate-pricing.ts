#!/usr/bin/env tsx
/**
 * Pricing Migration Script
 * This script initializes or migrates the database pricing configuration
 * Usage: npm run db:migrate-pricing
 */

import { DatabasePricingService } from '../lib/config/pricing';
import { seedPacks } from '../lib/utils/seed-packs';
import prisma from '../lib/repositories/prisma';

async function main() {
  console.log('🚀 Starting pricing migration...');
  
  try {
    // Check if packs already exist
    const existingPacks = await prisma.pack.findMany();
    
    if (existingPacks.length > 0) {
      console.log(`📦 Found ${existingPacks.length} existing packs`);
      console.log('💡 To reset pricing, use: npm run pricing:reset');
      console.log('💡 To update pricing, use: npm run pricing:update "<pack-name>" <price>');
      
      // Show current configuration
      await DatabasePricingService.logPricingConfig();
    } else {
      console.log('📦 No existing packs found, initializing with defaults...');
      await seedPacks();
      console.log('✅ Default pricing configuration initialized successfully!');
      
      // Show the newly created configuration
      await DatabasePricingService.logPricingConfig();
    }
    
  } catch (error) {
    console.error('❌ Error during pricing migration:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
