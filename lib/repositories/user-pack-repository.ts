import prisma from './prisma';
import type { UserPack, UserPackResponse } from '@/lib/types/payment';
import type { UserPack as PrismaUserPack, Pack as PrismaPack } from '@/lib/generated/prisma';

// Type for Prisma user pack with pack relation included
type PrismaUserPackWithPack = PrismaUserPack & {
  pack?: PrismaPack;
};


interface UserPackRepository {
  create(data: CreateUserPackRequest): Promise<UserPack>;
  getById(id: string): Promise<UserPack | null>;
  getByUserId(userId: string): Promise<UserPackResponse[]>;
  getActiveByUserId(userId: string): Promise<UserPackResponse[]>;
  decrementSubmissions(subscriptionId: string): Promise<void>;
  getTotalSubmissionsRemaining(userId: string): Promise<number>;
  hasActivePremiumSubscription(userId: string): Promise<boolean>;
  getNextAvailableSubscription(userId: string): Promise<UserPackResponse | null>;
}

interface CreateUserPackRequest {
  userId: string;
  packId: string;
  submissionsRemaining: number;
  isPremium: boolean;
}

function mapPrismaSubscriptionToSubscription(prismaSubscription: PrismaUserPack): UserPack {
  return {
    id: prismaSubscription.id,
    userId: prismaSubscription.userId,
    packId: prismaSubscription.packId,
    submissionsRemaining: prismaSubscription.submissionsRemaining,
    isPremium: prismaSubscription.isPremium,
    isActive: prismaSubscription.isActive,
    createdAt: prismaSubscription.createdAt,
    updatedAt: prismaSubscription.updatedAt,
  };
}

function mapPrismaSubscriptionToResponse(prismaSubscription: PrismaUserPackWithPack): UserPackResponse {
  return {
    id: prismaSubscription.id,
    userId: prismaSubscription.userId,
    packId: prismaSubscription.packId,
    submissionsRemaining: prismaSubscription.submissionsRemaining,
    isPremium: prismaSubscription.isPremium,
    isActive: prismaSubscription.isActive,
    createdAt: prismaSubscription.createdAt,
    updatedAt: prismaSubscription.updatedAt,
    pack: prismaSubscription.pack ? {
      id: prismaSubscription.pack.id,
      name: prismaSubscription.pack.name,
      description: prismaSubscription.pack.description,
      price: parseFloat(prismaSubscription.pack.price.toString()),
      submissions: prismaSubscription.pack.submissions,
      isPremium: prismaSubscription.pack.isPremium,
      isActive: prismaSubscription.pack.isActive,
      createdAt: prismaSubscription.pack.createdAt,
      updatedAt: prismaSubscription.pack.updatedAt,
    } : undefined,
  };
}

class PrismaUserPackRepository implements UserPackRepository {
  async create(data: CreateUserPackRequest): Promise<UserPack> {
    const subscription = await prisma.userPack.create({
      data: {
        userId: data.userId,
        packId: data.packId,
        submissionsRemaining: data.submissionsRemaining,
        isPremium: data.isPremium,
        isActive: true,
      }
    });

    return mapPrismaSubscriptionToSubscription(subscription);
  }

  async getById(id: string): Promise<UserPack | null> {
    const subscription = await prisma.userPack.findUnique({
      where: { id }
    });

    return subscription ? mapPrismaSubscriptionToSubscription(subscription) : null;
  }

  async getByUserId(userId: string): Promise<UserPackResponse[]> {
    const subscriptions = await prisma.userPack.findMany({
      where: { userId },
      include: {
        pack: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return subscriptions.map(mapPrismaSubscriptionToResponse);
  }

  async getActiveByUserId(userId: string): Promise<UserPackResponse[]> {
    const subscriptions = await prisma.userPack.findMany({
      where: { 
        userId,
        isActive: true,
        submissionsRemaining: { gt: 0 }
      },
      include: {
        pack: true
      },
      orderBy: [
        { isPremium: 'desc' }, // Premium subscriptions first
        { createdAt: 'asc' }   // Older subscriptions first (FIFO)
      ]
    });

    return subscriptions.map(mapPrismaSubscriptionToResponse);
  }

  async getAllByUserId(userId: string): Promise<UserPackResponse[]> {
    const subscriptions = await prisma.userPack.findMany({
      where: { 
        userId
      },
      include: {
        pack: true,
        _count: {
          select: { submissions: true }
        }
      },
      orderBy: [
        { createdAt: 'desc' } // Most recent first
      ]
    });

    return subscriptions.map((sub) => ({
      ...mapPrismaSubscriptionToResponse(sub),
      submissionsUsed: sub._count.submissions
    }));
  }

  async decrementSubmissions(subscriptionId: string): Promise<void> {
    const subscription = await prisma.userPack.findUnique({
      where: { id: subscriptionId }
    });

    if (!subscription || subscription.submissionsRemaining <= 0) {
      throw new Error('Subscription not found or no submissions remaining');
    }

    const newRemaining = subscription.submissionsRemaining - 1;
    
    await prisma.userPack.update({
      where: { id: subscriptionId },
      data: {
        submissionsRemaining: newRemaining,
        isActive: newRemaining > 0
      }
    });
  }

  async getTotalSubmissionsRemaining(userId: string): Promise<number> {
    const result = await prisma.userPack.aggregate({
      where: {
        userId,
        isActive: true
      },
      _sum: {
        submissionsRemaining: true
      }
    });

    return result._sum.submissionsRemaining || 0;
  }

  async hasActivePremiumSubscription(userId: string): Promise<boolean> {
    const count = await prisma.userPack.count({
      where: {
        userId,
        isPremium: true,
        isActive: true,
        submissionsRemaining: { gt: 0 }
      }
    });

    return count > 0;
  }

  async getNextAvailableSubscription(userId: string): Promise<UserPackResponse | null> {
    const subscription = await prisma.userPack.findFirst({
      where: {
        userId,
        isActive: true,
        submissionsRemaining: { gt: 0 }
      },
      include: {
        pack: true
      },
      orderBy: [
        { isPremium: 'desc' }, // Premium subscriptions first
        { createdAt: 'asc' }   // Older subscriptions first (FIFO)
      ]
    });

    return subscription ? mapPrismaSubscriptionToResponse(subscription) : null;
  }
}

// Export singleton instance
export const userPackRepository = new PrismaUserPackRepository();
