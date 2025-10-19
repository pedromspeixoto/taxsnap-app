import { EmailServiceImpl } from './email-service';
import { paymentService } from './payment-service';
import { userRepository } from '../repositories/user-repository';
import { 
  RegisterUserRequest, 
  UserResponse, 
  MessageResponse,
  SetPasswordRequest,
  ChangePasswordRequest,
  UpdateUserRequest,
  AuthResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest 
} from '../types/user';
import { jwtService } from '../utils/jwt';
import {
  UserAlreadyExistsError,
  UserNotFoundError,
  UserNotVerifiedError,
  UserAlreadyVerifiedError,
  InvalidVerificationTokenError,
  InvalidPasswordError,
  PasswordNotSetError
} from '@/lib/api/errors';
import { generateSecureToken, hashPassword, verifyPassword } from '../utils/utils';

export interface UserService {
  // Registration and verification
  registerUser(request: RegisterUserRequest): Promise<UserResponse>;
  verifyUser(token: string): Promise<AuthResponse>;
  resendVerification(email: string, locale?: string): Promise<MessageResponse>;

  // Password management
  setPassword(userId: string, request: SetPasswordRequest): Promise<MessageResponse>;
  changePassword(userId: string, request: ChangePasswordRequest): Promise<MessageResponse>;
  forgotPassword(request: ForgotPasswordRequest): Promise<MessageResponse>;
  resetPassword(request: ResetPasswordRequest): Promise<MessageResponse>;

  // User management
  getUser(userId: string): Promise<UserResponse>;
  getUserByEmail(email: string): Promise<UserResponse>;
  updateUser(userId: string, request: UpdateUserRequest): Promise<UserResponse>;
  deleteUser(userId: string): Promise<MessageResponse>;
}

export class UserServiceImpl implements UserService {
  private baseUrl: string;

  constructor(
    private emailService = new EmailServiceImpl(),
    baseUrl?: string
  ) {
    // Ensure baseUrl has proper protocol and format
    const rawBaseUrl = baseUrl || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    this.baseUrl = this.normalizeBaseUrl(rawBaseUrl);
  }

  private normalizeBaseUrl(url: string): string {
    // Add protocol if missing
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      // Default to https for production, http for localhost
      const protocol = url.includes('localhost') ? 'http://' : 'https://';
      url = protocol + url;
    }
    
    // Remove trailing slash
    return url.replace(/\/$/, '');
  }

  private createVerificationUrl(token: string, locale?: string): string {
    // Use provided locale or default to 'pt' (Portuguese)
    const userLocale = locale || 'pt';
    const url = `${this.baseUrl}/${userLocale}/verify?token=${token}`;
    
    // Log the URL for debugging (remove in production)
    console.log('Generated verification URL:', url);
    
    // Basic URL validation
    try {
      new URL(url);
      return url;
    } catch (error) {
      console.error('Invalid verification URL generated:', url, error);
      throw new Error('Failed to generate valid verification URL');
    }
  }

  private createPasswordResetUrl(token: string, locale?: string): string {
    // Use provided locale or default to 'pt' (Portuguese)
    const userLocale = locale || 'pt';
    const url = `${this.baseUrl}/${userLocale}/reset-password?token=${token}`;
    
    // Log the URL for debugging (remove in production)
    console.log('Generated password reset URL:', url);
    
    // Basic URL validation
    try {
      new URL(url);
      return url;
    } catch (error) {
      console.error('Invalid password reset URL generated:', url, error);
      throw new Error('Failed to generate valid password reset URL');
    }
  }

  async registerUser(request: RegisterUserRequest): Promise<UserResponse> {
    console.log('userService.registerUser', { email: request.email });

    // Check if user already exists
    const existingUser = await userRepository.getByEmail(request.email);
    if (existingUser) {
      throw new UserAlreadyExistsError(request.email);
    }

    // Generate verification token
    const verificationToken = await generateSecureToken();

    // Create verification URL
    const verificationUrl = this.createVerificationUrl(verificationToken, request.locale);

    // Create new user and send verification email (in the same transaction - if one fails, the other should be rolled back)
    const user = await userRepository.create({
      email: request.email,
      password: await hashPassword(request.password),
      verificationToken,
      verificationUrl,
    });

    // If locale is not provided, set it to 'pt'
    if (!request.locale || typeof request.locale !== 'string') {
      request.locale = 'pt';
    }

    try {
      await this.emailService.sendVerificationEmail(user.email, verificationUrl, request.locale);
    } catch (error) {
      console.error('Error sending verification email', error);
      // Continue with user creation even if email sending fails
    }

    // Assign free pack to new user
    try {
      await paymentService.assignFreePackToUser(user.id);
      console.log('Free pack assigned to new user', { userId: user.id });
    } catch (error) {
      console.error('Error assigning free pack to user', error);
      // Continue even if free pack assignment fails - user can still use the service
    }

    console.log('user registered successfully', { userId: user.id, email: user.email });

    return {
      id: user.id,
      email: user.email,
      verified: user.verified,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    };
  }

  async verifyUser(token: string): Promise<AuthResponse> {
    console.log('userService.verifyUser', { token });

    // Find user by verification token
    const user = await userRepository.getByVerificationToken(token);
    if (!user) {
      // Check if user exists but is already verified (token was cleared)
      // This could happen with double verification attempts
      console.log('Token not found - checking if user might already be verified');
      throw new InvalidVerificationTokenError();
    }

    if (user.verified) {
      console.log('User is already verified', { userId: user.id, email: user.email });
      throw new UserAlreadyVerifiedError();
    }

    // Verify the user
    await userRepository.verifyUser(user.id);

    // Get updated user
    const updatedUser = await userRepository.getById(user.id);
    if (!updatedUser) {
      throw new UserNotFoundError(user.id);
    }

    console.log('user verified successfully', { userId: user.id, email: user.email });

    const userResponse = {
      id: updatedUser.id,
      email: updatedUser.email,
      verified: updatedUser.verified,
      createdAt: new Date(updatedUser.createdAt),
      updatedAt: new Date(updatedUser.updatedAt),
    };

    // Generate JWT tokens
    const tokens = await jwtService.generateTokens({
      userId: updatedUser.id,
      email: updatedUser.email,
      verified: updatedUser.verified,
    });

    return {
      user: userResponse,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async resendVerification(email: string, locale?: string): Promise<MessageResponse> {
    console.log('userService.resendVerification', { email });

    // Find user by email
    const user = await userRepository.getByEmail(email);
    if (!user) {
      throw new UserNotFoundError(email);
    }

    if (user.verified) {
      throw new UserAlreadyVerifiedError();
    }

    // Generate new verification token
    const verificationToken = await generateSecureToken();
    const verificationUrl = this.createVerificationUrl(verificationToken, locale || 'pt');

    // Update user with new token
    await userRepository.updateVerificationToken(user.id, verificationToken, verificationUrl);

    // Send verification email
    try {
      await this.emailService.sendVerificationEmail(user.email, verificationUrl, locale || 'pt');
    } catch (error) {
      console.error('Error sending verification email', error);
      // Continue anyway - the token has been updated
    }

    return { message: 'Verification email sent successfully' };
  }

  async setPassword(userId: string, request: SetPasswordRequest): Promise<MessageResponse> {
    console.log('userService.setPassword', { userId });

    // Check if user exists
    const user = await userRepository.getById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    if (!user.verified) {
      throw new UserNotVerifiedError();
    }

    // Hash the password
    const hashedPassword = await hashPassword(request.password);

    // Update user password
    await userRepository.setPassword(userId, hashedPassword);

    return { message: 'Password set successfully' };
  }

  async changePassword(userId: string, request: ChangePasswordRequest): Promise<MessageResponse> {
    console.log('userService.changePassword', { userId });

    // Check if user exists
    const user = await userRepository.getById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    if (!user.verified) {
      throw new UserNotVerifiedError();
    }

    if (!user.password) {
      throw new PasswordNotSetError();
    }

    // Verify current password
    const isValidPassword = await verifyPassword(request.currentPassword, user.password);
    if (!isValidPassword) {
      throw new InvalidPasswordError();
    }

    // Hash the new password
    const hashedPassword = await hashPassword(request.newPassword);

    // Update user password
    await userRepository.setPassword(userId, hashedPassword);

    return { message: 'Password changed successfully' };
  }

  async forgotPassword(request: ForgotPasswordRequest): Promise<MessageResponse> {
    console.log('userService.forgotPassword', { email: request.email });

    // Find user by email - but don't reveal if user exists or not for security
    const user = await userRepository.getByEmail(request.email);
    
    // Always return the same message regardless of whether the user exists
    // This prevents email enumeration attacks
    if (!user) {
      console.log('User not found for password reset request', { email: request.email });
      return { message: 'If an account exists with this email, a password reset link will be sent.' };
    }

    // Generate password reset token
    const resetToken = await generateSecureToken();
    
    // Set token expiry to 1 hour from now
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 1);

    // Save reset token to database
    await userRepository.setResetToken(user.id, resetToken, tokenExpiry);

    // Create password reset URL
    const resetUrl = this.createPasswordResetUrl(resetToken, request.locale || 'pt');

    // Send password reset email
    try {
      await this.emailService.sendPasswordResetEmail(user.email, resetUrl, request.locale || 'pt');
      console.log('Password reset email sent successfully', { email: user.email });
    } catch (error) {
      console.error('Error sending password reset email', error);
      // Don't throw error - we don't want to reveal if user exists
    }

    return { message: 'If an account exists with this email, a password reset link will be sent.' };
  }

  async resetPassword(request: ResetPasswordRequest): Promise<MessageResponse> {
    console.log('userService.resetPassword', { token: request.token });

    // Find user by reset token (this also checks if token is not expired)
    const user = await userRepository.getByResetToken(request.token);
    if (!user) {
      throw new InvalidVerificationTokenError();
    }

    // Hash the new password
    const hashedPassword = await hashPassword(request.newPassword);

    // Update user password
    await userRepository.setPassword(user.id, hashedPassword);

    // Clear the reset token
    await userRepository.clearResetToken(user.id);

    console.log('Password reset successfully', { userId: user.id, email: user.email });

    return { message: 'Password reset successfully' };
  }

  async getUser(userId: string): Promise<UserResponse> {
    console.log('userService.getUser', { userId });

    const user = await userRepository.getById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    return {
      id: user.id,
      email: user.email,
      verified: user.verified,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    };
  }

  async getUserByEmail(email: string): Promise<UserResponse> {
    console.log('userService.getUserByEmail', { email });

    const user = await userRepository.getByEmail(email);
    if (!user) {
      throw new UserNotFoundError(email);
    }

    return {
      id: user.id,
      email: user.email,
      verified: user.verified,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    };
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async updateUser(userId: string, request: UpdateUserRequest): Promise<UserResponse> {
    console.log('userService.updateUser', { userId });

    // Check if user exists
    const user = await userRepository.getById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // For now, UpdateUserRequest is empty, but you can add fields as needed
    // When you expand UpdateUserRequest, you can use the request parameter here:
    // await this.userRepo.update(userId, { /* updates based on request */ });

    // Return updated user (for now, just return the existing user)
    return {
      id: user.id,
      email: user.email,
      verified: user.verified,
      createdAt: new Date(user.createdAt),
      updatedAt: new Date(user.updatedAt),
    };
  }

  async deleteUser(userId: string): Promise<MessageResponse> {
    console.log('userService.deleteUser', { userId });

    // Check if user exists
    const user = await userRepository.getById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    // Soft delete the user
    await userRepository.delete(userId);

    return { message: 'User deleted successfully' };
  }
} 