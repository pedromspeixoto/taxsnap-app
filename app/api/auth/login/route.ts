import { NextRequest } from 'next/server';
import { authService, validateRequired, badRequest, handleError, ok } from '@/lib/api/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Simple validation
    const validation = validateRequired(body, ['email', 'password']);
    if (validation) {
      return badRequest(validation);
    }

    const authResponse = await authService.authenticateUser(body);
    return ok(authResponse);
  } catch (error) {
    return handleError(error);
  }
} 