"use client";

import { 
  RegisterUserRequest, 
  UserResponse, 
  MessageResponse, 
  SetPasswordRequest,
  ChangePasswordRequest,
  UpdateUserRequest,
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ClientUser
} from '../types/user';

const API_BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

export class ApiClient {
  private static instance: ApiClient;

  private constructor() {}

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  // Core request method - pure HTTP client
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {},
    accessToken?: string
  ): Promise<T> {
    const url = `${API_BASE_URL}/api${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options.headers as Record<string, string>,
    };

    if (accessToken) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'An error occurred');
    }

    return response.json();
  }

  // Public API methods - no authentication logic here
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(data: RegisterRequest): Promise<ClientUser> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verify(token: string): Promise<AuthResponse> {
    return this.request('/users/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    return this.request('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  }

  // Health check
  async healthCheck(): Promise<{ message: string }> {
    return this.request('/health');
  }

  // User registration and verification
  async registerUser(data: RegisterUserRequest): Promise<UserResponse> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resendVerification(email: string): Promise<MessageResponse> {
    return this.request('/users/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Authenticated user management methods - require accessToken
  async getUserById(userId: string, accessToken: string): Promise<UserResponse> {
    return this.request(`/users/${userId}`, {}, accessToken);
  }

  async updateUser(userId: string, data: UpdateUserRequest, accessToken: string): Promise<UserResponse> {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, accessToken);
  }

  async deleteUser(userId: string, accessToken: string): Promise<MessageResponse> {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    }, accessToken);
  }

  // Password management
  async setPassword(userId: string, data: SetPasswordRequest, accessToken: string): Promise<MessageResponse> {
    return this.request(`/users/${userId}/password`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, accessToken);
  }

  async changePassword(userId: string, data: ChangePasswordRequest, accessToken: string): Promise<MessageResponse> {
    return this.request(`/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, accessToken);
  }

  // Generic authenticated request helper
  async authenticatedRequest<T>(
    endpoint: string, 
    accessToken: string,
    options: RequestInit = {}
  ): Promise<T> {
    return this.request<T>(endpoint, options, accessToken);
  }
}

// Export instance
export const apiClient = ApiClient.getInstance();