import { NextRequest, NextResponse } from 'next/server';
import { UserServiceImpl } from '@/lib/services/user-service';
import { ResetPasswordRequest } from '@/lib/types/user';

const userService = new UserServiceImpl();

export async function POST(request: NextRequest) {
  try {
    const body: ResetPasswordRequest = await request.json();

    if (!body.token || !body.newPassword) {
      return NextResponse.json(
        { message: 'Token and new password are required' },
        { status: 400 }
      );
    }

    // Validate password strength (minimum 8 characters)
    if (body.newPassword.length < 8) {
      return NextResponse.json(
        { message: 'Password must be at least 8 characters long' },
        { status: 400 }
      );
    }

    const response = await userService.resetPassword(body);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[API] POST /api/auth/reset-password:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to reset password' },
      { status: 400 }
    );
  }
}

