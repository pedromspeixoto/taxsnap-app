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

    // Extract locale from body, default to 'pt' if not provided
    const locale = body.locale && typeof body.locale === 'string' ? body.locale : 'pt';

    const result = await userService.resendVerification(body.email, locale);
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
}
