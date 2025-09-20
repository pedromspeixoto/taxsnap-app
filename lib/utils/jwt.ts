import { SignJWT, jwtVerify } from 'jose';

export interface JWTPayload {
  userId: string;
  email: string;
  verified: boolean;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class JWTService {
  private readonly accessTokenSecret: Uint8Array;
  private readonly refreshTokenSecret: Uint8Array;
  private readonly accessTokenExpiry: string;
  private readonly refreshTokenExpiry: string;

  constructor() {
    // Convert secrets to Uint8Array for jose library
    this.accessTokenSecret = new TextEncoder().encode(
      process.env.JWT_ACCESS_SECRET || 'your-access-token-secret-change-this'
    );
    this.refreshTokenSecret = new TextEncoder().encode(
      process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret-change-this'
    );
    this.accessTokenExpiry = process.env.JWT_ACCESS_EXPIRY || '15m'; // 15 minutes to match cookie expiry
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  }

  async generateTokens(payload: Omit<JWTPayload, 'iat' | 'exp'>): Promise<AuthTokens> {
    const accessToken = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(this.accessTokenExpiry)
      .sign(this.accessTokenSecret);

    const refreshToken = await new SignJWT(payload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(this.refreshTokenExpiry)
      .sign(this.refreshTokenSecret);

    return { accessToken, refreshToken };
  }

  async verifyAccessToken(token: string): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(token, this.accessTokenSecret);
      return payload as unknown as JWTPayload;
    } catch {
      throw new Error('Invalid access token');
    }
  }

  async verifyRefreshToken(token: string): Promise<JWTPayload> {
    try {
      const { payload } = await jwtVerify(token, this.refreshTokenSecret);
      return payload as unknown as JWTPayload;
    } catch {
      throw new Error('Invalid refresh token');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<string> {
    const payload = await this.verifyRefreshToken(refreshToken);
    
    // Create new access token with the same payload (excluding iat/exp)
    const newPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId: payload.userId,
      email: payload.email,
      verified: payload.verified,
    };

    return await new SignJWT(newPayload)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime(this.accessTokenExpiry)
      .sign(this.accessTokenSecret);
  }

  extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

export const jwtService = new JWTService(); 