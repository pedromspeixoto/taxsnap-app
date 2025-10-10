// Database-driven pricing configuration
// This file provides interfaces and helper functions for database-stored pricing

import prisma from '../repositories/prisma';

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: number;
  submissions: number;
  isPremium: boolean;
  isActive: boolean;
  features: string[];
  createdAt: Date;
  updatedAt: Date;
}

// Default pricing data for initial seeding
export const DEFAULT_PRICING_DATA = [
  {
    name: 'Free Starter Pack',
    description: 'Get started with 3 free standard submissions to try our service.',
    price: 0.00,
    submissions: 3,
    isPremium: false,
    isActive: true,
    features: [
      'Multi-platform support',
      'Automated calculations',
      'Tax report generation',
      'Email support'
    ]
  },
  {
    name: 'Basic Pack',
    description: '5 standard submissions with automated tax calculations at an affordable price.',
    price: 2.99,
    submissions: 5,
    isPremium: false,
    isActive: true,
    features: [
      'Everything in Free Starter',
      'Bulk processing',
      'Historical data export'
    ]
  },
  {
    name: 'Pro Pack',
    description: '10 standard submissions with advanced features for regular users.',
    price: 9.99,
    submissions: 10,
    isPremium: false,
    isActive: true,
    features: [
      'Everything in Basic Pack',
      'Priority support',
      'Extended data retention'
    ]
  },
  {
    name: 'Premium Subscription',
    description: '10 premium submissions with personalized manual review from certified accountants.',
    price: 49.99,
    submissions: 10,
    isPremium: true,
    isActive: true,
    features: [
      'Everything in Pro Pack',
      'Personalized accountant review',
      'Direct consultation access',
      'Custom report formatting'
    ]
  }
];

// Database pricing service
export class DatabasePricingService {
  
  /**
   * Get all pricing tiers from database
   */
  static async getAllPricingTiers(): Promise<PricingTier[]> {
    try {
      const packs = await prisma.pack.findMany({
        orderBy: [
          { price: 'asc' },
          { createdAt: 'asc' }
        ]
      });

      return packs.map(pack => ({
        id: pack.id,
        name: pack.name,
        description: pack.description,
        price: Number(pack.price),
        submissions: pack.submissions,
        isPremium: pack.isPremium,
        isActive: pack.isActive,
        createdAt: pack.createdAt,
        updatedAt: pack.updatedAt,
        features: DatabasePricingService.getPackFeatures({
          price: Number(pack.price),
          isPremium: pack.isPremium
        })
      }));
    } catch (error) {
      console.error('Failed to load pricing from database:', error);
      throw error;
    }
  }

  /**
   * Get active pricing tiers only
   */
  static async getActivePricingTiers(): Promise<PricingTier[]> {
    const allTiers = await DatabasePricingService.getAllPricingTiers();
    return allTiers.filter(tier => tier.isActive);
  }

  /**
   * Get purchasable pricing tiers (active and price > 0)
   */
  static async getPurchasablePricingTiers(): Promise<PricingTier[]> {
    const allTiers = await DatabasePricingService.getAllPricingTiers();
    return allTiers.filter(tier => tier.isActive && tier.price > 0);
  }

  /**
   * Get specific pricing tier by name
   */
  static async getPricingTier(name: string): Promise<PricingTier | null> {
    try {
      const pack = await prisma.pack.findFirst({
        where: { name }
      });

      if (!pack) return null;

      return {
        id: pack.id,
        name: pack.name,
        description: pack.description,
        price: Number(pack.price),
        submissions: pack.submissions,
        isPremium: pack.isPremium,
        isActive: pack.isActive,
        createdAt: pack.createdAt,
        updatedAt: pack.updatedAt,
        features: DatabasePricingService.getPackFeatures({
          price: Number(pack.price),
          isPremium: pack.isPremium
        })
      };
    } catch (error) {
      console.error('Failed to get pricing tier:', error);
      return null;
    }
  }

  /**
   * Get price by pack name
   */
  static async getPriceByName(name: string): Promise<number> {
    const tier = await DatabasePricingService.getPricingTier(name);
    return tier ? tier.price : 0;
  }

  /**
   * Update pack pricing in database
   */
  static async updatePackPricing(name: string, price: number, submissions?: number): Promise<void> {
    try {
      const updateData: {
        price: number;
        updatedAt: Date;
        submissions?: number;
      } = { 
        price: price,
        updatedAt: new Date()
      };
      
      if (submissions !== undefined) {
        updateData.submissions = submissions;
      }

      await prisma.pack.updateMany({
        where: { name },
        data: updateData
      });

      console.log(`✅ Updated ${name} pricing: €${price}${submissions ? ` (${submissions} submissions)` : ''}`);
    } catch (error) {
      console.error('Failed to update pack pricing:', error);
      throw error;
    }
  }

  /**
   * Toggle pack active status
   */
  static async togglePackStatus(name: string, isActive: boolean): Promise<void> {
    try {
      await prisma.pack.updateMany({
        where: { name },
        data: { 
          isActive,
          updatedAt: new Date()
        }
      });

      console.log(`✅ ${isActive ? 'Activated' : 'Deactivated'} pack: ${name}`);
    } catch (error) {
      console.error('Failed to toggle pack status:', error);
      throw error;
    }
  }

  /**
   * Get features for a pack based on its properties
   */
  private static getPackFeatures(pack: { price: number; isPremium: boolean }): string[] {
    const baseFeatures = [
      'Multi-platform support',
      'Automated calculations',
      'Tax report generation',
      'Email support'
    ];

    if (Number(pack.price) >= 2.99) {
      baseFeatures.push('Bulk processing');
      baseFeatures.push('Historical data export');
    }

    if (Number(pack.price) >= 9.99) {
      baseFeatures.push('Priority support');
      baseFeatures.push('Extended data retention');
    }

    if (pack.isPremium) {
      baseFeatures.push('Personalized accountant review');
      baseFeatures.push('Direct consultation access');
      baseFeatures.push('Custom report formatting');
    }

    return baseFeatures;
  }

  /**
   * Initialize database with default pricing if empty
   */
  static async initializeDefaultPricing(): Promise<void> {
    try {
      const existingPacks = await prisma.pack.count();
      
      if (existingPacks > 0) {
        console.log('📦 Packs already exist in database, skipping initialization');
        return;
      }

      console.log('🚀 Initializing database with default pricing...');
      
      for (const defaultPack of DEFAULT_PRICING_DATA) {
        await prisma.pack.create({
          data: {
            name: defaultPack.name,
            description: defaultPack.description,
            price: defaultPack.price,
            submissions: defaultPack.submissions,
            isPremium: defaultPack.isPremium,
            isActive: defaultPack.isActive
          }
        });
        
        console.log(`✅ Created pack: ${defaultPack.name} (€${defaultPack.price})`);
      }
      
      console.log('✅ Default pricing initialization completed!');
    } catch (error) {
      console.error('Failed to initialize default pricing:', error);
      throw error;
    }
  }

  /**
   * Log current pricing configuration
   */
  static async logPricingConfig(): Promise<void> {
    try {
      const tiers = await DatabasePricingService.getAllPricingTiers();
      console.log('💰 Current Database Pricing Configuration:');
      tiers.forEach(tier => {
        console.log(`  • ${tier.name}: €${tier.price} (${tier.submissions} submissions${tier.isPremium ? ', Premium' : ''}${!tier.isActive ? ', INACTIVE' : ''})`);
      });
    } catch (error) {
      console.error('Failed to log pricing config:', error);
    }
  }
}

// Legacy compatibility functions (now database-backed)
export const getPricingTier = DatabasePricingService.getPricingTier;
export const getActivePricingTiers = DatabasePricingService.getActivePricingTiers;
export const getPurchasablePricingTiers = DatabasePricingService.getPurchasablePricingTiers;
export const getPriceByName = DatabasePricingService.getPriceByName;
export const logPricingConfig = DatabasePricingService.logPricingConfig;
