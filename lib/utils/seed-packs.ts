import { DatabasePricingService } from '../config/pricing';

export async function seedPacks() {
  try {
    // Use the database pricing service to initialize default pricing
    await DatabasePricingService.initializeDefaultPricing();
    
  } catch (error) {
    console.error('❌ Error seeding packs:', error);
    throw error;
  }
}
