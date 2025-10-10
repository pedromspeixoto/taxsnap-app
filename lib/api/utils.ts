import { NextResponse } from 'next/server';
import { UserServiceImpl } from '../services/user-service';
import { AuthServiceImpl } from '../services/auth-service';
import { SubmissionServiceImpl } from '../services/submission-service';
import { EmailServiceImpl } from '../services/email-service';
import {
  ServiceError,
  UserAlreadyExistsError,
  UserNotFoundError,
  UserNotVerifiedError,
  UserAlreadyVerifiedError,
  InvalidVerificationTokenError,
  InvalidCredentialsError,
  InvalidPasswordError,
  PasswordNotSetError
} from './errors';
import { NextRequest } from 'next/server';

// Services initialization
export const userService = new UserServiceImpl();
export const authService = new AuthServiceImpl();
export const submissionService = new SubmissionServiceImpl();
export const emailService = new EmailServiceImpl();

// Auth utilities
export function getAuthenticatedUser(request: NextRequest) {
  const userId = request.headers.get('x-user-id');
  const email = request.headers.get('x-user-email');
  const verified = request.headers.get('x-user-verified') === 'true';
  
  if (!userId || !email) {
    return null;
  }
  
  return {
    userId,
    email,
    verified
  };
}

export function requireAuth(request: NextRequest) {
  const user = getAuthenticatedUser(request);
  if (!user) {
    throw new Error('Authentication required');
  }
  return user;
}

// Validation helpers
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateRequired(data: Record<string, unknown>, fields: string[]): string | null {
  for (const field of fields) {
    if (!data[field] || typeof data[field] !== 'string') {
      return `${field} is required`;
    }
  }
  return null;
}

// Response helpers
export function badRequest(message: string) {
  return NextResponse.json({ message }, { status: 400 });
}

export function unauthorized(message: string = 'Unauthorized') {
  return NextResponse.json({ message }, { status: 401 });
}

export function forbidden(message: string = 'Forbidden') {
  return NextResponse.json({ message }, { status: 403 });
}

export function ok<T>(data: T) {
  return NextResponse.json(data);
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 });
}

export function notFound(message = 'Not found'): NextResponse {
  return NextResponse.json(
    { message, error: 'Not Found' },
    { status: 404 }
  );
}

export function conflict(message: string = 'Conflict') {
  return NextResponse.json({ message }, { status: 409 });
}

// Error handling
export function handleError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ServiceError) {
    // Map error types to status codes
    const statusMap = {
      [UserAlreadyExistsError.name]: 409,
      [UserNotFoundError.name]: 404,
      [UserNotVerifiedError.name]: 403,
      [InvalidCredentialsError.name]: 401,
      [InvalidVerificationTokenError.name]: 400,
      [UserAlreadyVerifiedError.name]: 409,
      [InvalidPasswordError.name]: 400,
      [PasswordNotSetError.name]: 400,
    };

    const status = statusMap[error.constructor.name] || 400;
    return NextResponse.json({ message: error.message }, { status });
  }

  // Handle unknown errors
  const message = error instanceof Error ? error.message : 'Internal server error';
  return NextResponse.json({ message }, { status: 500 });
} 