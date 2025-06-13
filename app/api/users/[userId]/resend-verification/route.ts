import { NextRequest } from 'next/server';
import { userService, validateEmail, badRequest, ok, handleError } from '@/lib/api/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.email || typeof body.email !== 'string') {
      return badRequest('Email is required');
    }

    if (!validateEmail(body.email)) {
      return badRequest('Invalid email format');
    }

    const result = await userService.resendVerification(body.email);
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
} 