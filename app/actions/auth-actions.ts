'use server'

import { apiClient } from '@/lib/api/client'
import { AuthResponse } from '@/lib/types/user'

// Action state types
export interface AuthActionState {
  error?: string
  success?: boolean
  message?: string
}

// Verify email action state
export interface VerifyEmailActionState extends AuthActionState {
  authResponse?: AuthResponse
}

// Verify email with token
export async function verifyEmailAction(
  token: string
): Promise<VerifyEmailActionState> {
  try {
    if (!token) {
      return { error: 'Verification token is required' }
    }
    const authResponse = await apiClient.verify(token)

    return { 
      success: true, 
      authResponse,
      message: 'Email verified successfully'
    }

  } catch (error) {
    console.error('[ACTION] verifyEmailAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to verify email' 
    }
  }
} 