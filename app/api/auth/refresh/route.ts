import { NextRequest } from 'next/server';
import { jwtService } from '@/lib/utils/jwt';
import { badRequest, handleError, ok } from '@/lib/api/utils';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.refreshToken || typeof body.refreshToken !== 'string') {
      return badRequest('Refresh token is required');
    }

    // Verify refresh token and generate new access token
    const newAccessToken = jwtService.refreshAccessToken(body.refreshToken);
    
    return ok({ accessToken: newAccessToken });
  } catch (error) {
    return handleError(error);
  }
} 