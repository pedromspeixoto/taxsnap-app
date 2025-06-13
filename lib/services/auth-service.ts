import { AuthenticateUserRequest, AuthResponse } from '../types/user';
import { userRepository } from '../repositories/user-repository';
import { jwtService } from '../utils/jwt';
import { 
    PasswordNotSetError,
    InvalidCredentialsError
} from '../api/errors';
import { verifyPassword } from '../utils/utils';

export interface AuthService {
  authenticateUser(request: AuthenticateUserRequest): Promise<AuthResponse>;
}

export class AuthServiceImpl implements AuthService {
    constructor(
        private userRepo = userRepository,
        private jwtUtils = jwtService
      ) {}

      async authenticateUser(request: AuthenticateUserRequest): Promise<AuthResponse> {

        // Find user by email
        const user = await this.userRepo.getByEmail(request.email);
        if (!user) {
          throw new InvalidCredentialsError();
        }
    
        if (!user.password) {
          throw new PasswordNotSetError();
        }
    
        // Verify password
        const isValidPassword = await verifyPassword(request.password, user.password);
        if (!isValidPassword) {
          throw new InvalidCredentialsError();
        }
    
        const userResponse = {
          id: user.id,
          email: user.email,
          verified: user.verified,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt),
        };
    
        // Generate JWT tokens
        const tokens = await this.jwtUtils.generateTokens({
          userId: user.id,
          email: user.email,
          verified: user.verified,
        });
    
        return {
          user: userResponse,
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        };
      }
}