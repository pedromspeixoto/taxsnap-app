// Payment and subscription types

export interface Pack {
  id: string;
  name: string;
  description: string;
  price: number;
  submissions: number;
  isPremium: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPack {
  id: string;
  userId: string;
  packId: string;
  submissionsRemaining: number;
  isPremium: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  pack?: Pack;
}

export interface Payment {
  id: string;
  userId: string;
  packId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paymentMethod?: string;
  transactionId?: string;
  createdAt: Date;
  updatedAt: Date;
  pack?: Pack;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR',
  CANCELLED = 'CANCELLED'
}

// Request/Response types
export interface CreatePaymentRequest {
  packId: string;
  paymentMethod: string;
}

export interface CreatePaymentResponse {
  id: string;
  status: PaymentStatus;
  amount: number;
  currency: string;
}

export interface ProcessPaymentRequest {
  paymentId: string;
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardHolderName: string;
}

export interface PaymentResponse {
  id: string;
  userId: string;
  packId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  createdAt: Date;
  updatedAt: Date;
  pack?: Pack;
}

export interface UserPackResponse {
  id: string;
  userId: string;
  packId: string;
  submissionsRemaining: number;
  isPremium: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  pack?: Pack;
  submissionsUsed?: number; // For tracking usage in history view
}

export interface UserPaymentSummary {
  activeSubscriptions: UserPackResponse[];
}

export interface UserPaymentHistory {
  allSubscriptions: UserPackResponse[];
}

// Test card details
export const TEST_CARD = {
  number: '4532015112830366',
  expiryMonth: '12',
  expiryYear: '2025',
  cvv: '123',
  holderName: 'Test User'
};
