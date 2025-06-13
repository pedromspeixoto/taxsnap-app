// User model types
export interface User {
  id: string;
  email: string;
  password?: string;
  verified: boolean;
  verificationToken?: string;
  verificationUrl?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

// Request types
export interface RegisterUserRequest {
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  // Add fields as needed for user updates
  // For now keeping it simple, can be expanded later
  [key: string]: unknown;
}

export interface SetPasswordRequest {
  password: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface AuthenticateUserRequest {
  email: string;
  password: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
}

// Client-side user interface (with string dates for localStorage)
export interface ClientUser {
  id: string;
  email: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Response types
export interface UserResponse {
  id: string;
  email: string;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: UserResponse;
  accessToken: string;
  refreshToken: string;
}

export interface MessageResponse {
  message: string;
}

// Database types
export interface UserUpdate {
  password?: string;
  verified?: boolean;
  verificationToken?: string;
  verificationUrl?: string;
  updatedAt?: Date;
}

export interface UserCreateRequest {
  email: string;
  password?: string;
  verificationToken?: string;
  verificationUrl?: string;
} 