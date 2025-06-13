import { NextRequest } from 'next/server';
import { userService, badRequest, handleError, validateEmail, ok, requireAuth } from '@/lib/api/utils';
import { NextResponse } from 'next/server';

// Route handlers
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from middleware
    const authUser = requireAuth(request);
    
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();
    
    if (!userId) {
      return badRequest('User ID is required');
    }

    // Ensure users can only access their own data
    if (authUser.userId !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const user = await userService.getUser(userId);
    return ok(user);
  } catch (error) {
    return handleError(error);
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user from middleware
    const authUser = requireAuth(request);
    
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();
    
    if (!userId) {
      return badRequest('User ID is required');
    }

    // Ensure users can only update their own data
    if (authUser.userId !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    
    if (body.email && typeof body.email === 'string' && !validateEmail(body.email)) {
      return badRequest('Invalid email format');
    }

    const user = await userService.updateUser(userId, body);
    return ok(user);
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get authenticated user from middleware
    const authUser = requireAuth(request);
    
    const url = new URL(request.url);
    const userId = url.pathname.split('/').pop();
    
    if (!userId) {
      return badRequest('User ID is required');
    }

    // Ensure users can only delete their own data
    if (authUser.userId !== userId) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const result = await userService.deleteUser(userId);
    return ok(result);
  } catch (error) {
    return handleError(error);
  }
} 