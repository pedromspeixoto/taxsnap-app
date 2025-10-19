'use server'

import { apiClient } from '@/lib/api/client'
import { AuthResponse, LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest } from '@/lib/types/user'

// Action state types
export interface AuthActionState {
  error?: string
  success?: boolean
  message?: string
}

// Auth action state with response
export interface AuthResponseActionState extends AuthActionState {
  authResponse?: AuthResponse
}

// Verify email action state  
export type VerifyEmailActionState = AuthResponseActionState

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

// Resend verification email
export async function resendVerificationAction(
  email: string,
  locale: string = 'en'
): Promise<AuthActionState> {
  try {
    if (!email) {
      return { error: 'Email is required' } // Keep English for server actions
    }

    await apiClient.resendVerification(email, locale)

    return { 
      success: true,
      message: 'Verification email sent successfully' // Keep English for server actions
    }

  } catch (error) {
    console.error('[ACTION] resendVerificationAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to resend verification email' // Keep English for server actions 
    }
  }
}

// Login user
export async function loginAction(
  request: LoginRequest
): Promise<AuthResponseActionState> {
  try {
    if (!request.email || !request.password) {
      return { error: 'Email and password are required' } // Keep English for server actions
    }

    const authResponse = await apiClient.login(request)

    return { 
      success: true, 
      authResponse,
      message: 'Login successful' // Keep English for server actions
    }

  } catch (error) {
    console.error('[ACTION] loginAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Login failed' // Keep English for server actions 
    }
  }
}

// Register user
export async function registerAction(
  request: RegisterRequest
): Promise<AuthActionState> {
  try {
    if (!request.email || !request.password) {
      return { error: 'Email and password are required' } // Keep English for server actions
    }

    await apiClient.register(request)

    return { 
      success: true,
      message: 'Registration successful' // Keep English for server actions
    }

  } catch (error) {
    console.error('[ACTION] registerAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Registration failed' // Keep English for server actions 
    }
  }
}

// Forgot password
export async function forgotPasswordAction(
  request: ForgotPasswordRequest
): Promise<AuthActionState> {
  try {
    if (!request.email) {
      return { error: 'Email is required' } // Keep English for server actions
    }

    await apiClient.forgotPassword(request)

    return { 
      success: true,
      message: 'If an account exists with this email, a password reset link will be sent.' // Keep English for server actions
    }

  } catch (error) {
    console.error('[ACTION] forgotPasswordAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to process password reset request' // Keep English for server actions 
    }
  }
}

// Reset password
export async function resetPasswordAction(
  request: ResetPasswordRequest
): Promise<AuthActionState> {
  try {
    if (!request.token || !request.newPassword) {
      return { error: 'Token and new password are required' } // Keep English for server actions
    }

    await apiClient.resetPassword(request)

    return { 
      success: true,
      message: 'Password reset successfully' // Keep English for server actions
    }

  } catch (error) {
    console.error('[ACTION] resetPasswordAction:', error)
    return { 
      error: error instanceof Error ? error.message : 'Failed to reset password' // Keep English for server actions 
    }
  }
} 