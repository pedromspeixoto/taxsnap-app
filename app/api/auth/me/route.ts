import { userService, handleError, ok } from '@/lib/api/utils';
import { jwtService } from '@/lib/utils/jwt';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('Authorization');

        const token = jwtService.extractTokenFromHeader(authHeader);
        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Extract user id from token
        const payload = await jwtService.verifyAccessToken(token);
        if (!payload.userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        // Get user from database
        const user = await userService.getUser(payload.userId);
        if (!user) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        return ok(user);
    } catch (error) {
      return handleError(error);
    }
  } 