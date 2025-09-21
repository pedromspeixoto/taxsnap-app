import prisma from './prisma';
import type { Payment, PaymentStatus, PaymentResponse } from '@/lib/types/payment';
import type { Payment as PrismaPayment, PaymentStatus as PrismaPaymentStatus, Pack as PrismaPack } from '@/lib/generated/prisma';

// Type for Prisma payment with pack relation included
type PrismaPaymentWithPack = PrismaPayment & {
  pack?: PrismaPack;
};

interface PaymentRepository {
  create(data: CreatePaymentRequest): Promise<Payment>;
  getById(id: string): Promise<PaymentResponse | null>;
  getByUserId(userId: string): Promise<PaymentResponse[]>;
  updateStatus(id: string, status: PaymentStatus, transactionId?: string): Promise<void>;
  getSuccessfulPaymentsByUserId(userId: string): Promise<PaymentResponse[]>;
}

interface CreatePaymentRequest {
  userId: string;
  packId: string;
  amount: number;
  currency: string;
  paymentMethod: string;
}

function mapPrismaPaymentToPayment(prismaPayment: PrismaPayment): Payment {
  return {
    id: prismaPayment.id,
    userId: prismaPayment.userId,
    packId: prismaPayment.packId,
    amount: parseFloat(prismaPayment.amount.toString()),
    currency: prismaPayment.currency,
    status: prismaPayment.status as PaymentStatus,
    paymentMethod: prismaPayment.paymentMethod || undefined,
    transactionId: prismaPayment.transactionId || undefined,
    createdAt: prismaPayment.createdAt,
    updatedAt: prismaPayment.updatedAt,
  };
}

function mapPrismaPaymentToResponse(prismaPayment: PrismaPaymentWithPack): PaymentResponse {
  return {
    id: prismaPayment.id,
    userId: prismaPayment.userId,
    packId: prismaPayment.packId,
    amount: parseFloat(prismaPayment.amount.toString()),
    currency: prismaPayment.currency,
    status: prismaPayment.status as PaymentStatus,
    createdAt: prismaPayment.createdAt,
    updatedAt: prismaPayment.updatedAt,
    pack: prismaPayment.pack ? {
      id: prismaPayment.pack.id,
      name: prismaPayment.pack.name,
      description: prismaPayment.pack.description,
      price: parseFloat(prismaPayment.pack.price.toString()),
      submissions: prismaPayment.pack.submissions,
      isPremium: prismaPayment.pack.isPremium,
      isActive: prismaPayment.pack.isActive,
      createdAt: prismaPayment.pack.createdAt,
      updatedAt: prismaPayment.pack.updatedAt,
    } : undefined,
  };
}

class PrismaPaymentRepository implements PaymentRepository {
  async create(data: CreatePaymentRequest): Promise<Payment> {
    const payment = await prisma.payment.create({
      data: {
        userId: data.userId,
        packId: data.packId,
        amount: data.amount,
        currency: data.currency,
        paymentMethod: data.paymentMethod,
        status: 'PENDING',
      }
    });

    return mapPrismaPaymentToPayment(payment);
  }

  async getById(id: string): Promise<PaymentResponse | null> {
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: {
        pack: true
      }
    });

    return payment ? mapPrismaPaymentToResponse(payment) : null;
  }

  async getByUserId(userId: string): Promise<PaymentResponse[]> {
    const payments = await prisma.payment.findMany({
      where: { userId },
      include: {
        pack: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return payments.map(mapPrismaPaymentToResponse);
  }

  async updateStatus(id: string, status: PaymentStatus, transactionId?: string): Promise<void> {
    await prisma.payment.update({
      where: { id },
      data: {
        status: status as PrismaPaymentStatus,
        transactionId,
        updatedAt: new Date()
      }
    });
  }

  async getSuccessfulPaymentsByUserId(userId: string): Promise<PaymentResponse[]> {
    const payments = await prisma.payment.findMany({
      where: { 
        userId,
        status: 'COMPLETED'
      },
      include: {
        pack: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    return payments.map(mapPrismaPaymentToResponse);
  }
}

// Export singleton instance
export const paymentRepository = new PrismaPaymentRepository();
