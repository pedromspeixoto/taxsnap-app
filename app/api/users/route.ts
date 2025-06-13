import { NextRequest } from 'next/server';
import { userService, validateEmail, badRequest, created, handleError } from '@/lib/api/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.email || typeof body.email !== 'string') {
      return badRequest('Invalid email address');
    }

    if (!validateEmail(body.email)) {
      return badRequest('Invalid email format');
    }

    if (!body.password || typeof body.password !== 'string') {
      return badRequest('Invalid password');
    }

    const user = await userService.registerUser(body);
    return created(user);
  } catch (error) {
    return handleError(error);
  }
} 