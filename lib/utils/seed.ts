import bcrypt from 'bcryptjs';
import prisma from '../repositories/prisma';
import { seedPacks } from './seed-packs';

export async function seedUsers() {
  try {
    // Check if any users already exist
    const existingUsers = await prisma.user.count();
    
    if (existingUsers > 0) {
      console.log('Users already exist, skipping seed...');
      return;
    }

    // Create a default admin user
    const email = 'admin@taxsnap.com';
    const password = 'admin123'; // You should change this in production
    const hashedPassword = await bcrypt.hash(password, 12);
    
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: 'ADMIN', // Set as admin user
        verified: true, // Already verified
      },
    });

    console.log(`✅ Created verified user: ${user.email} (ID: ${user.id})`);
    console.log(`📧 Email: ${email}`);
    console.log(`🔑 Password: ${password}`);
    console.log('⚠️  Please change the password after first login!');
    
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    throw error;
  }
}

export async function runSeed() {
  try {
    console.log('🌱 Starting database seed...');
    
    await seedUsers();
    await seedPacks();
    
    console.log('✅ Database seed completed successfully!');
  } catch (error) {
    console.error('❌ Database seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Allow running this file directly
if (require.main === module) {
  runSeed();
} 