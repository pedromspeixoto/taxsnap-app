import { packRepository } from '@/lib/repositories/pack-repository';
import { userPackRepository } from '@/lib/repositories/user-pack-repository';
import { paymentRepository } from '@/lib/repositories/payment-repository';
import type { 
  Pack, 
  CreatePaymentRequest, 
  CreatePaymentResponse,
  ProcessPaymentRequest,
  PaymentResponse,
  UserPaymentSummary
} from '@/lib/types/payment';
import { PaymentStatus, TEST_CARD } from '@/lib/types/payment';

export interface PaymentService {
  // Pack operations
  getAllPacks(): Promise<Pack[]>;
  getPacksForPurchase(): Promise<Pack[]>;
  getPackById(id: string): Promise<Pack | null>;

  // Payment operations
  createPayment(userId: string, request: CreatePaymentRequest): Promise<CreatePaymentResponse>;
  processPayment(request: ProcessPaymentRequest): Promise<PaymentResponse>;
  getPaymentById(paymentId: string): Promise<PaymentResponse | null>;

  // User subscription operations
  getUserPaymentSummary(userId: string): Promise<UserPaymentSummary>;
  assignFreePackToUser(userId: string): Promise<void>;
  canUserCreateSubmission(userId: string): Promise<{ canCreate: boolean; tier: 'STANDARD' | 'PREMIUM'; subscriptionId?: string }>;
  consumeSubmissionFromSubscription(userId: string, subscriptionId: string): Promise<void>;
  getNextAvailableSubscription(userId: string, preferPremium: boolean): Promise<{ id: string } | null>;
}

export class PaymentServiceImpl implements PaymentService {
  
  // Pack operations
  async getAllPacks(): Promise<Pack[]> {
    return await packRepository.getAll();
  }

  async getPacksForPurchase(): Promise<Pack[]> {
    return await packRepository.getActivePacksForPurchase();
  }

  async getPackById(id: string): Promise<Pack | null> {
    return await packRepository.getById(id);
  }

  // Payment operations
  async createPayment(userId: string, request: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    const pack = await packRepository.getById(request.packId);
    if (!pack) {
      throw new Error('Pack not found');
    }

    if (!pack.isActive) {
      throw new Error('Pack is not active');
    }

    const payment = await paymentRepository.create({
      userId,
      packId: request.packId,
      amount: pack.price,
      currency: 'EUR',
      paymentMethod: request.paymentMethod,
    });

    return {
      id: payment.id,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
    };
  }

  async processPayment(request: ProcessPaymentRequest): Promise<PaymentResponse> {
    const payment = await paymentRepository.getById(request.paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'PENDING') {
      throw new Error('Payment is not in pending status');
    }

    // Validate test card (in production, this would integrate with a real payment processor)
    const isValidTestCard = 
      request.cardNumber === TEST_CARD.number &&
      request.expiryMonth === TEST_CARD.expiryMonth &&
      request.expiryYear === TEST_CARD.expiryYear &&
      request.cvv === TEST_CARD.cvv;

    if (!isValidTestCard) {
      // Fail the payment
      await paymentRepository.updateStatus(request.paymentId, PaymentStatus.ERROR);
      const failedPayment = await paymentRepository.getById(request.paymentId);
      if (!failedPayment) throw new Error('Payment update failed');
      return failedPayment;
    }

    // Success - create subscription and update payment
    const pack = payment.pack;
    if (!pack) {
      throw new Error('Pack not found for payment');
    }

    // Generate mock transaction ID
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Create user subscription
    await userPackRepository.create({
      userId: payment.userId,
      packId: pack.id,
      submissionsRemaining: pack.submissions,
      isPremium: pack.isPremium,
    });

    // Update payment status
    await paymentRepository.updateStatus(request.paymentId, PaymentStatus.COMPLETED, transactionId);

    const completedPayment = await paymentRepository.getById(request.paymentId);
    if (!completedPayment) throw new Error('Payment update failed');
    
    return completedPayment;
  }

  async getPaymentById(paymentId: string): Promise<PaymentResponse | null> {
    return await paymentRepository.getById(paymentId);
  }

  // User subscription operations
  async getUserPaymentSummary(userId: string): Promise<UserPaymentSummary> {
    // Filter at database level for optimization
    const activeSubscriptions = await userPackRepository.getActiveByUserId(userId);

    return {
      activeSubscriptions,
    };
  }

  async getUserPaymentHistory(userId: string): Promise<UserPaymentSummary> {
    const allSubscriptions = await userPackRepository.getAllByUserId(userId);
    return {
      activeSubscriptions: allSubscriptions,
    };
  }

  async assignFreePackToUser(userId: string): Promise<void> {
    // Get the free pack
    const freePack = await packRepository.getByName('Free Starter Pack');
    if (!freePack) {
      throw new Error('Free starter pack not found');
    }

    // Check if user already has the free pack
    const existingSubscriptions = await userPackRepository.getByUserId(userId);
    const hasFreePackAlready = existingSubscriptions.some(sub => sub.pack?.name === 'Free Starter Pack');
    
    if (hasFreePackAlready) {
      return; // User already has free pack
    }

    // Create the free subscription
    await userPackRepository.create({
      userId,
      packId: freePack.id,
      submissionsRemaining: freePack.submissions,
      isPremium: freePack.isPremium,
    });
  }

  async canUserCreateSubmission(userId: string): Promise<{ canCreate: boolean; tier: 'STANDARD' | 'PREMIUM'; subscriptionId?: string }> {
    const nextSubscription = await userPackRepository.getNextAvailableSubscription(userId);
    
    if (!nextSubscription) {
      return { canCreate: false, tier: 'STANDARD' };
    }

    return {
      canCreate: true,
      tier: nextSubscription.isPremium ? 'PREMIUM' : 'STANDARD',
      subscriptionId: nextSubscription.id,
    };
  }

  async consumeSubmissionFromSubscription(userId: string, subscriptionId: string): Promise<void> {
    await userPackRepository.decrementSubmissions(subscriptionId);
  }

  // Get next available subscription with premium preference
  async getNextAvailableSubscription(userId: string, preferPremium: boolean): Promise<{ id: string } | null> {
    const activeSubscriptions = await userPackRepository.getActiveByUserId(userId);
    
    if (preferPremium) {
      // Find premium subscriptions first
      const premiumSubscription = activeSubscriptions.find(sub => 
        sub.isPremium === true && sub.submissionsRemaining > 0
      );
      if (premiumSubscription) {
        return { id: premiumSubscription.id };
      }
      return null; // No premium subscriptions available
    } else {
      // Find standard subscriptions first, but fallback to premium if needed
      const standardSubscription = activeSubscriptions.find(sub => 
        sub.isPremium === false && sub.submissionsRemaining > 0
      );
      if (standardSubscription) {
        return { id: standardSubscription.id };
      }
      
      // Fallback to premium if no standard available
      const premiumSubscription = activeSubscriptions.find(sub => 
        sub.isPremium === true && sub.submissionsRemaining > 0
      );
      if (premiumSubscription) {
        return { id: premiumSubscription.id };
      }
      return null; // No subscriptions available
    }
  }
}

// Export singleton instance
export const paymentService = new PaymentServiceImpl();
