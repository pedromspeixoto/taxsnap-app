#!/usr/bin/env tsx
/**
 * Reseed Packs Script
 * This script clears and reseeds all pricing packs with default values
 * Usage: npm run db:reseed-packs
 */

import { seedPacks } from '../lib/utils/seed-packs';
import prisma from '../lib/repositories/prisma';
import { DatabasePricingService } from '../lib/config/pricing';

async function main() {
  console.log('🔄 Starting pack reseeding...');
  
  try {
    // Check if packs exist and show warning
    const existingPacks = await prisma.pack.findMany();
    
    if (existingPacks.length > 0) {
      console.log(`⚠️  Found ${existingPacks.length} existing packs that will be deleted!`);
      console.log('📦 Current packs:');
      existingPacks.forEach(pack => {
        console.log(`   • ${pack.name}: €${pack.price} (${pack.submissions} submissions)`);
      });
      
      console.log('\n⏳ Waiting 3 seconds before clearing... Press Ctrl+C to cancel');
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Clear existing packs
      await prisma.pack.deleteMany();
      console.log('🗑️  Cleared existing packs');
    } else {
      console.log('📦 No existing packs found');
    }
    
    // Reseed with defaults
    console.log('🌱 Seeding default packs...');
    await seedPacks();
    
    console.log('✅ Pack reseeding completed successfully!');
    
    // Show the newly created configuration
    console.log('\n📋 New pricing configuration:');
    await DatabasePricingService.logPricingConfig();
    
  } catch (error) {
    console.error('❌ Error during pack reseeding:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
