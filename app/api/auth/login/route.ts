import { NextRequest } from 'next/server';
import { authService, validateRequired, badRequest, handleError, ok } from '@/lib/api/utils';
import { notifyProductEvent } from '@/lib/slack';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Simple validation
    const validation = validateRequired(body, ['email', 'password']);
    if (validation) {
      return badRequest(validation);
    }

    const authResponse = await authService.authenticateUser(body);

    notifyProductEvent({
      event: 'User Logged In',
      userEmail: body.email,
    })

    return ok(authResponse);
  } catch (error) {
    return handleError(error);
  }
} 