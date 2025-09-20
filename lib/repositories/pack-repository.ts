import prisma from './prisma';
import type { Pack } from '../types/payment';
import type { Pack as PrismaPack } from '@/lib/generated/prisma';

interface PackRepository {
  getAll(): Promise<Pack[]>;
  getById(id: string): Promise<Pack | null>;
  getByName(name: string): Promise<Pack | null>;
  getActivePacksForPurchase(): Promise<Pack[]>;
}

function mapPrismaPackToPack(prismaPack: PrismaPack): Pack {
  return {
    id: prismaPack.id,
    name: prismaPack.name,
    description: prismaPack.description,
    price: parseFloat(prismaPack.price.toString()),
    submissions: prismaPack.submissions,
    isPremium: prismaPack.isPremium,
    isActive: prismaPack.isActive,
    createdAt: prismaPack.createdAt,
    updatedAt: prismaPack.updatedAt,
  };
}

class PrismaPackRepository implements PackRepository {
  async getAll(): Promise<Pack[]> {
    const packs = await prisma.pack.findMany({
      orderBy: [
        { price: 'asc' },
        { createdAt: 'asc' }
      ]
    });
    
    return packs.map(mapPrismaPackToPack);
  }

  async getById(id: string): Promise<Pack | null> {
    const pack = await prisma.pack.findUnique({
      where: { id }
    });
    
    return pack ? mapPrismaPackToPack(pack) : null;
  }

  async getByName(name: string): Promise<Pack | null> {
    const pack = await prisma.pack.findFirst({
      where: { name }
    });
    
    return pack ? mapPrismaPackToPack(pack) : null;
  }

  async getActivePacksForPurchase(): Promise<Pack[]> {
    const packs = await prisma.pack.findMany({
      where: { 
        isActive: true,
        price: { gt: 0 } // Exclude free pack from purchase options
      },
      orderBy: [
        { price: 'asc' },
        { createdAt: 'asc' }
      ]
    });
    
    return packs.map(mapPrismaPackToPack);
  }
}

// Export singleton instance
export const packRepository = new PrismaPackRepository();
