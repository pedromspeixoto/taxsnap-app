import { NextRequest, NextResponse } from 'next/server';
import { UserServiceImpl } from '@/lib/services/user-service';
import { ForgotPasswordRequest } from '@/lib/types/user';

const userService = new UserServiceImpl();

export async function POST(request: NextRequest) {
  try {
    const body: ForgotPasswordRequest = await request.json();

    if (!body.email) {
      return NextResponse.json(
        { message: 'Email is required' },
        { status: 400 }
      );
    }

    const response = await userService.forgotPassword(body);

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('[API] POST /api/auth/forgot-password:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Failed to process password reset request' },
      { status: 500 }
    );
  }
}

