import prisma from '../repositories/prisma';

export async function seedPacks() {
  try {
    // Check if packs already exist
    const existingPacks = await prisma.pack.count();
    
    if (existingPacks > 0) {
      console.log('Packs already exist, skipping pack seed...');
      return;
    }

    // Create default packs based on the pricing model
    const packs = [
      {
        name: 'Free Starter Pack',
        description: 'Get started with 3 free standard submissions to try our service.',
        price: 0.00,
        submissions: 3,
        isPremium: false,
        isActive: true,
      },
      {
        name: 'Small Pack',
        description: '5 standard submissions with automated tax calculations.',
        price: 8.00,
        submissions: 5,
        isPremium: false,
        isActive: true,
      },
      {
        name: 'Large Pack',
        description: '10 standard submissions with automated tax calculations.',
        price: 16.00,
        submissions: 10,
        isPremium: false,
        isActive: true,
      },
      {
        name: 'Premium Subscription',
        description: '10 premium submissions with personalized manual review from certified accountants.',
        price: 39.00,
        submissions: 10,
        isPremium: true,
        isActive: true,
      },
    ];

    console.log('Creating default packs...');
    
    for (const pack of packs) {
      const createdPack = await prisma.pack.create({
        data: pack,
      });
      
      console.log(`✅ Created pack: ${createdPack.name} (€${createdPack.price}, ${createdPack.submissions} submissions${createdPack.isPremium ? ', Premium' : ''})`);
    }
    
    console.log('✅ Pack seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Error seeding packs:', error);
    throw error;
  }
}
