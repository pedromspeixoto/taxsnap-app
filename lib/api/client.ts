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
  private static readonly ACCESS_TOKEN_KEY = 'taxsnap_access_token';
  private static readonly REFRESH_TOKEN_KEY = 'taxsnap_refresh_token';
  private static readonly USER_KEY = 'taxsnap_user';

  private constructor() {}

  static getInstance(): ApiClient {
    if (!ApiClient.instance) {
      ApiClient.instance = new ApiClient();
    }
    return ApiClient.instance;
  }

  // Token management methods
  private setTokens(accessToken: string, refreshToken: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ApiClient.ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(ApiClient.REFRESH_TOKEN_KEY, refreshToken);
      
      // Also set in cookies for server-side middleware
      document.cookie = `${ApiClient.ACCESS_TOKEN_KEY}=${accessToken}; path=/; max-age=${60 * 15}`; // 15 minutes
      document.cookie = `${ApiClient.REFRESH_TOKEN_KEY}=${refreshToken}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
    }
  }

  private getAccessToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ApiClient.ACCESS_TOKEN_KEY);
    }
    return null;
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ApiClient.REFRESH_TOKEN_KEY);
    }
    return null;
  }

  private clearTokens(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ApiClient.ACCESS_TOKEN_KEY);
      localStorage.removeItem(ApiClient.REFRESH_TOKEN_KEY);
      localStorage.removeItem(ApiClient.USER_KEY);
      
      // Also clear cookies
      document.cookie = `${ApiClient.ACCESS_TOKEN_KEY}=; path=/; max-age=0`;
      document.cookie = `${ApiClient.REFRESH_TOKEN_KEY}=; path=/; max-age=0`;
    }
  }

  // User management methods
  private setUser(user: ClientUser): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ApiClient.USER_KEY, JSON.stringify(user));
    }
  }

  getUser(): ClientUser | null {
    if (typeof window !== 'undefined') {
      const userString = localStorage.getItem(ApiClient.USER_KEY);
      if (userString) {
        try {
          return JSON.parse(userString) as ClientUser;
        } catch {
          return null;
        }
      }
    }
    return null;
  }

  // Authentication status
  isAuthenticated(): boolean {
    return this.getAccessToken() !== null && this.getUser() !== null;
  }

  // Core request method with authentication
  private async request<T>(
    endpoint: string, 
    options: RequestInit = {},
    requiresAuth: boolean = false
  ): Promise<T> {
    const url = `${API_BASE_URL}/api${endpoint}`;
    
    const makeRequest = async (token: string | null = null) => {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
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
    };

    // If authentication is required, handle token refresh logic
    if (requiresAuth) {
      const accessToken = this.getAccessToken();
      
      try {
        return await makeRequest(accessToken);
      } catch (error: unknown) {
        // If unauthorized and we have tokens, try to refresh
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
          const newToken = await this.refreshToken();
          if (newToken) {
            return await makeRequest(newToken);
          }
        }
        throw error;
      }
    }

    // For non-authenticated requests
    return makeRequest();
  }

  // Authentication methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const authResponse: AuthResponse = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Store tokens and user
    this.setTokens(authResponse.accessToken, authResponse.refreshToken);
    this.setUser({
      ...authResponse.user,
      createdAt: authResponse.user.createdAt.toString(),
      updatedAt: authResponse.user.updatedAt.toString()
    });

    return authResponse;
  }

  async register(data: RegisterRequest): Promise<ClientUser> {
    const user: ClientUser = await this.request('/users/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return user;
  }

  async verify(token: string): Promise<AuthResponse> {
    const authResponse: AuthResponse = await this.request('/users/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
    
    // Store tokens and user
    this.setTokens(authResponse.accessToken, authResponse.refreshToken);
    this.setUser({
      ...authResponse.user,
      createdAt: authResponse.user.createdAt.toString(),
      updatedAt: authResponse.user.updatedAt.toString()
    });

    return authResponse;
  }

  async refreshToken(): Promise<string | null> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const data = await this.request<{ accessToken: string }>('/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });

      const newAccessToken = data.accessToken;
      
      // Update access token
      if (typeof window !== 'undefined') {
        localStorage.setItem(ApiClient.ACCESS_TOKEN_KEY, newAccessToken);
      }

      return newAccessToken;
    } catch {
      this.clearTokens();
      return null;
    }
  }

  logout(): void {
    this.clearTokens();
    // Redirect to home page
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }

  // Health check
  async healthCheck(): Promise<{ message: string }> {
    return this.request('/health');
  }

  // User registration and verification (legacy methods for compatibility)
  async registerUser(data: RegisterUserRequest): Promise<UserResponse> {
    return this.request('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async verifyUser(token: string): Promise<UserResponse> {
    return this.request('/users/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  }

  async resendVerification(email: string): Promise<MessageResponse> {
    return this.request('/users/resend-verification', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  // Authenticated user management methods
  async getUserById(userId: string): Promise<UserResponse> {
    return this.request(`/users/${userId}`, {}, true);
  }

  async updateUser(userId: string, data: UpdateUserRequest): Promise<UserResponse> {
    return this.request(`/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true);
  }

  async deleteUser(userId: string): Promise<MessageResponse> {
    return this.request(`/users/${userId}`, {
      method: 'DELETE',
    }, true);
  }

  // Password management
  async setPassword(userId: string, data: SetPasswordRequest): Promise<MessageResponse> {
    return this.request(`/users/${userId}/password`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, true);
  }

  async changePassword(userId: string, data: ChangePasswordRequest): Promise<MessageResponse> {
    return this.request(`/users/${userId}/password`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }, true);
  }

  // Generic authenticated fetch helper
  async authenticatedFetch(url: string, options: RequestInit = {}): Promise<Response> {
    const accessToken = this.getAccessToken();

    // Try request with current token
    const makeRequest = async (token: string | null) => {
      const headers = {
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      };

      return fetch(url, {
        ...options,
        headers,
      });
    };

    let response = await makeRequest(accessToken);

    // If unauthorized, try to refresh token
    if (response.status === 401 && accessToken) {
      const newToken = await this.refreshToken();
      if (newToken) {
        response = await makeRequest(newToken);
      }
    }

    return response;
  }
}

// Export singleton instance
export const apiClient = ApiClient.getInstance();

// Legacy export for backward compatibility
export const authClient = apiClient; 