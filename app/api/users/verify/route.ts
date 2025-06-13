import { NextRequest } from 'next/server';
import { userService, badRequest, handleError, ok } from '@/lib/api/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.token || typeof body.token !== 'string') {
      return badRequest('Verification token is required');
    }

    const authResponse = await userService.verifyUser(body.token);
    return ok(authResponse);
  } catch (error) {
    return handleError(error);
  }
} 