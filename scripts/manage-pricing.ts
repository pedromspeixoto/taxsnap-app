#!/usr/bin/env tsx
/**
 * CLI tool for managing database-driven pricing
 * Usage examples:
 *   npm run pricing:show
 *   npm run pricing:update "Basic Pack" 3.99
 *   npm run pricing:update "Pro Pack" 12.99 15
 *   npm run pricing:disable "Basic Pack"
 *   npm run pricing:enable "Basic Pack"
 */

import { DatabasePricingService } from '../lib/config/pricing';
import prisma from '../lib/repositories/prisma';

async function main() {
  const [,, command, packName, priceStr, submissionsStr] = process.argv;

  try {
    switch (command) {
      case 'show':
        console.log('💰 Current Database Pricing Configuration:');
        await DatabasePricingService.logPricingConfig();
        break;

      case 'update':
        if (!packName || !priceStr) {
          console.error('❌ Usage: npm run pricing:update "<pack-name>" <price> [submissions]');
          process.exit(1);
        }
        
        const price = parseFloat(priceStr);
        const submissions = submissionsStr ? parseInt(submissionsStr, 10) : undefined;
        
        if (isNaN(price) || price < 0) {
          console.error('❌ Price must be a valid positive number');
          process.exit(1);
        }

        await DatabasePricingService.updatePackPricing(packName, price, submissions);
        break;

      case 'enable':
        if (!packName) {
          console.error('❌ Usage: npm run pricing:enable "<pack-name>"');
          process.exit(1);
        }

        await DatabasePricingService.togglePackStatus(packName, true);
        break;

      case 'disable':
        if (!packName) {
          console.error('❌ Usage: npm run pricing:disable "<pack-name>"');
          process.exit(1);
        }

        await DatabasePricingService.togglePackStatus(packName, false);
        break;

      case 'list':
        const allTiers = await DatabasePricingService.getAllPricingTiers();
        console.log('\n📋 All Pricing Tiers:');
        allTiers.forEach(tier => {
          const status = tier.isActive ? '✅ Active' : '❌ Inactive';
          console.log(`  ${status} ${tier.name}: €${tier.price} (${tier.submissions} submissions${tier.isPremium ? ', Premium' : ''})`);
        });
        break;

      case 'active':
        const activeTiers = await DatabasePricingService.getActivePricingTiers();
        console.log('\n✅ Active Pricing Tiers:');
        activeTiers.forEach(tier => {
          console.log(`  • ${tier.name}: €${tier.price} (${tier.submissions} submissions${tier.isPremium ? ', Premium' : ''})`);
        });
        break;

      case 'purchasable':
        const purchasableTiers = await DatabasePricingService.getPurchasablePricingTiers();
        console.log('\n💳 Purchasable Pricing Tiers:');
        purchasableTiers.forEach(tier => {
          console.log(`  • ${tier.name}: €${tier.price} (${tier.submissions} submissions${tier.isPremium ? ', Premium' : ''})`);
        });
        break;

      case 'reset':
        console.log('⚠️  This will reset all pricing to defaults!');
        console.log('Waiting 3 seconds... Press Ctrl+C to cancel');
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Clear existing packs
        await prisma.pack.deleteMany();
        console.log('🗑️  Cleared existing packs');
        
        // Re-initialize with defaults
        await DatabasePricingService.initializeDefaultPricing();
        console.log('✅ Reset to default pricing completed');
        break;

      default:
        console.log(`
🎯 Database Pricing Management CLI

Available commands:
  show                          - Show current pricing configuration
  list                          - List all pricing tiers (active and inactive)
  active                        - Show only active pricing tiers
  purchasable                   - Show only purchasable tiers (active + price > 0)
  update <pack> <price> [subs]  - Update pack pricing and optionally submissions
  enable <pack>                 - Enable/activate a pack
  disable <pack>                - Disable/deactivate a pack
  reset                         - Reset all pricing to defaults (⚠️ destructive)

Examples:
  npm run pricing:show
  npm run pricing:update "Basic Pack" 3.99
  npm run pricing:update "Pro Pack" 12.99 15
  npm run pricing:disable "Basic Pack"
  npm run pricing:enable "Basic Pack"
  npm run pricing:reset

💡 All changes are applied immediately to the database without restart!
        `);
        break;
    }
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
