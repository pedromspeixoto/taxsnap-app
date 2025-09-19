'use server'

import { revalidatePath } from 'next/cache'
import { apiClient } from '@/lib/api/client'
import type { 
  UserPaymentSummary, 
  Pack, 
  CreatePaymentRequest,
  CreatePaymentResponse,
  ProcessPaymentRequest,
  PaymentResponse
} from '@/lib/types/payment'

// Action state types
export interface PaymentActionState {
  error?: string
  success?: boolean
  message?: string
}

// Check submission capability action state
export interface SubmissionCapabilityActionState extends PaymentActionState {
  canCreate?: boolean
  tier?: 'STANDARD' | 'PREMIUM'
  subscriptionId?: string
  hasPremiumSubscriptions?: boolean
  hasOnlyPremium?: boolean
  hasOnlyStandard?: boolean
  hasMixedSubscriptions?: boolean
}

// Get user payment summary action state
export interface GetPaymentSummaryActionState extends PaymentActionState {
  paymentSummary?: UserPaymentSummary
}

// Get packs action state  
export interface GetPacksActionState extends PaymentActionState {
  packs?: Pack[]
}

// Create payment action state
export interface CreatePaymentActionState extends PaymentActionState {
  payment?: CreatePaymentResponse
}

// Process payment action state
export interface ProcessPaymentActionState extends PaymentActionState {
  payment?: PaymentResponse
}

// Get payment action state
export interface GetPaymentActionState extends PaymentActionState {
  payment?: PaymentResponse
}

// Get user payment summary
export async function getUserPaymentSummaryAction(
  accessToken: string
): Promise<GetPaymentSummaryActionState> {
  try {
    if (!accessToken) {
      return { error: 'Not authenticated' }
    }

    const paymentSummary = await apiClient.getUserPaymentSummary(accessToken)

    return { 
      success: true, 
      paymentSummary
    }

  } catch (error) {
    console.error('[ACTION] getUserPaymentSummaryAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to load payment summary'
    }
  }
}

export async function getUserPaymentHistoryAction(
  accessToken: string
): Promise<GetPaymentSummaryActionState> {
  try {
    if (!accessToken) {
      return { error: 'Not authenticated' }
    }

    const paymentHistory = await apiClient.getUserPaymentHistory(accessToken)

    return { 
      success: true, 
      paymentSummary: paymentHistory
    }

  } catch (error) {
    console.error('[ACTION] getUserPaymentHistoryAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to load payment history'
    }
  }
}

// Get available packs
export async function getPacksAction(
  purchaseOnly: boolean = false
): Promise<GetPacksActionState> {
  try {
    const packs = await apiClient.getPacks(purchaseOnly)

    return { 
      success: true, 
      packs
    }

  } catch (error) {
    console.error('[ACTION] getPacksAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to load packs'
    }
  }
}

// Create payment
export async function createPaymentAction(
  request: CreatePaymentRequest,
  accessToken: string
): Promise<CreatePaymentActionState> {
  try {
    if (!accessToken) {
      return { error: 'Not authenticated' }
    }

    const payment = await apiClient.createPayment(request, accessToken)

    return { 
      success: true, 
      payment
    }

  } catch (error) {
    console.error('[ACTION] createPaymentAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to create payment'
    }
  }
}

// Process payment
export async function processPaymentAction(
  paymentId: string,
  request: ProcessPaymentRequest,
  accessToken: string
): Promise<ProcessPaymentActionState> {
  try {
    if (!accessToken) {
      return { error: 'Not authenticated' }
    }

    const payment = await apiClient.processPayment(paymentId, request, accessToken)

    revalidatePath('/dashboard')
    revalidatePath('/dashboard/profile')
    return { 
      success: true, 
      payment
    }

  } catch (error) {
    console.error('[ACTION] processPaymentAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to process payment'
    }
  }
}

// Get payment details
export async function getPaymentAction(
  paymentId: string,
  accessToken: string
): Promise<GetPaymentActionState> {
  try {
    if (!accessToken) {
      return { error: 'Not authenticated' }
    }

    const payment = await apiClient.getPayment(paymentId, accessToken)

    return { 
      success: true, 
      payment
    }

  } catch (error) {
    console.error('[ACTION] getPaymentAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to get payment'
    }
  }
}

// Assign free pack to user (for admin/system use)
export async function assignFreePackAction(
  accessToken: string
): Promise<PaymentActionState> {
  try {
    if (!accessToken) {
      return { error: 'Not authenticated' }
    }

    // This would need an API endpoint to assign free packs
    // For now, this is a placeholder for future implementation
    
    revalidatePath('/dashboard')
    revalidatePath('/dashboard/profile')
    return { 
      success: true,
      message: 'Free pack assigned successfully'
    }

  } catch (error) {
    console.error('[ACTION] assignFreePackAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to assign free pack'
    }
  }
}

// Check submission capability (includes premium subscription availability)
export async function checkSubmissionCapabilityAction(
  accessToken: string
): Promise<SubmissionCapabilityActionState> {
  try {
    // Get user payment summary to check for premium subscriptions
    const paymentSummaryResponse = await getUserPaymentSummaryAction(accessToken)

    if (paymentSummaryResponse.error) {
      return { error: paymentSummaryResponse.error }
    }

    const paymentSummary = paymentSummaryResponse.paymentSummary!
    const premiumSubscriptions = paymentSummary.activeSubscriptions.filter(
      sub => sub.isPremium === true
    )
    const standardSubscriptions = paymentSummary.activeSubscriptions.filter(
      sub => sub.isPremium === false
    )

    const canCreate = paymentSummary.activeSubscriptions.length > 0
    const hasPremiumSubscriptions = premiumSubscriptions.length > 0
    const hasStandardSubscriptions = standardSubscriptions.length > 0
    
    // Determine if user has mixed subscription types
    const hasOnlyPremium = hasPremiumSubscriptions && !hasStandardSubscriptions
    const hasOnlyStandard = hasStandardSubscriptions && !hasPremiumSubscriptions
    const hasMixedSubscriptions = hasPremiumSubscriptions && hasStandardSubscriptions
    
    return {
      canCreate,
      tier: hasPremiumSubscriptions ? 'PREMIUM' : 'STANDARD',
      hasPremiumSubscriptions,
      hasOnlyPremium,
      hasOnlyStandard,
      hasMixedSubscriptions,
      success: true
    }
  } catch (error) {
    console.error('Check submission capability action error:', error)
    return { 
      error: error instanceof Error 
        ? error.message 
        : 'Failed to check submission capability. Please try again.' 
    }
  }
}
