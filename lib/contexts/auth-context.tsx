"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { ClientUser, AuthResponse } from '@/lib/types/user';

// Token management constants
const ACCESS_TOKEN_KEY = process.env.NEXT_PUBLIC_ACCESS_TOKEN_KEY || 'taxsnap_access_token';
const REFRESH_TOKEN_KEY = process.env.NEXT_PUBLIC_REFRESH_TOKEN_KEY || 'taxsnap_refresh_token';
const USER_KEY = process.env.NEXT_PUBLIC_USER_KEY || 'taxsnap_user';

interface AuthContextType {
  user: ClientUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  // Pure state management methods
  setAuthData: (authResponse: AuthResponse) => ClientUser;
  setUser: (user: ClientUser) => void;
  clearAuth: () => void;
  refreshUser: () => void;
  checkAuthStatus: () => boolean;
  // Helper method for authenticated API calls
  withAuth: <T>(apiCall: (accessToken: string) => Promise<T>) => Promise<T>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Token management methods
  const setTokens = useCallback((accessToken: string, refreshToken: string): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      
      // Also set in cookies for server-side middleware
      document.cookie = `${ACCESS_TOKEN_KEY}=${accessToken}; path=/; max-age=${60 * 15}`; // 15 minutes
      document.cookie = `${REFRESH_TOKEN_KEY}=${refreshToken}; path=/; max-age=${60 * 60 * 24 * 7}`; // 7 days
    }
  }, []);

  const getAccessToken = useCallback((): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    }
    return null;
  }, []);

  const getRefreshToken = useCallback((): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    }
    return null;
  }, []);

  const clearTokens = useCallback((): void => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      
      // Also clear cookies
      document.cookie = `${ACCESS_TOKEN_KEY}=; path=/; max-age=0`;
      document.cookie = `${REFRESH_TOKEN_KEY}=; path=/; max-age=0`;
    }
  }, []);

  // User management methods
  const setStoredUser = useCallback((user: ClientUser): void => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  }, []);

  const getStoredUser = useCallback((): ClientUser | null => {
    if (typeof window !== 'undefined') {
      const userString = localStorage.getItem(USER_KEY);
      if (userString) {
        try {
          return JSON.parse(userString) as ClientUser;
        } catch {
          return null;
        }
      }
    }
    return null;
  }, []);

  // Token refresh logic
  const refreshAccessToken = useCallback(async (): Promise<string | null> => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return null;
    }

    try {
      const data = await apiClient.refreshToken(refreshToken);
      const newAccessToken = data.accessToken;
      
      // Update access token in storage
      if (typeof window !== 'undefined') {
        localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
        document.cookie = `${ACCESS_TOKEN_KEY}=${newAccessToken}; path=/; max-age=${60 * 15}`;
      }

      return newAccessToken;
    } catch {
      clearTokens();
      setUser(null);
      return null;
    }
  }, [getRefreshToken, clearTokens]);

  // Validate token expiration without making API calls
  const isTokenExpired = useCallback((token: string): boolean => {
    try {
      // Decode JWT to check expiration (without verification)
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(window.atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
      
      const decoded = JSON.parse(jsonPayload);
      const currentTime = Math.floor(Date.now() / 1000);
      
      return decoded.exp < currentTime;
    } catch {
      // If we can't decode the token, consider it invalid
      return true;
    }
  }, []);

  // Check authentication status from tokens
  const checkAuthStatus = useCallback((): boolean => {
    const currentUser = getStoredUser();
    const accessToken = getAccessToken();
    
    // If no tokens or user data, definitely not authenticated
    if (!accessToken || !currentUser) {
      setUser(null);
      return false;
    }

    // Check if access token is expired
    if (isTokenExpired(accessToken)) {
      // Access token is expired, clear auth state
      clearTokens();
      setUser(null);
      return false;
    }

    // Tokens exist and are not expired, user is authenticated
    setUser(currentUser);
    return true;
  }, [getStoredUser, getAccessToken, isTokenExpired, clearTokens]);

  const refreshUser = useCallback(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  // Initialize auth state on mount
  useEffect(() => {
    checkAuthStatus();
    setIsLoading(false);
  }, [checkAuthStatus]);

  // Listen for storage changes (logout from another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ACCESS_TOKEN_KEY || e.key === USER_KEY) {
        checkAuthStatus();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [checkAuthStatus]);

  // Pure state management methods - NO API calls
  const setAuthData = useCallback((authResponse: AuthResponse): ClientUser => {
    // Store tokens
    setTokens(authResponse.accessToken, authResponse.refreshToken);
    
    // Convert dates to strings for ClientUser
    const clientUser: ClientUser = {
      ...authResponse.user,
      createdAt: authResponse.user.createdAt.toString(),
      updatedAt: authResponse.user.updatedAt.toString()
    };
    
    // Store user
    setStoredUser(clientUser);
    setUser(clientUser);
    
    return clientUser;
  }, [setTokens, setStoredUser]);

  const setUserData = useCallback((userData: ClientUser): void => {
    setStoredUser(userData);
    setUser(userData);
  }, [setStoredUser]);

  const clearAuth = useCallback((): void => {
    clearTokens();
    setUser(null);
    // Redirect to home page
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, [clearTokens]);

  // Helper method for authenticated API calls with automatic token refresh
  const withAuth = useCallback(
    async function<T>(apiCall: (accessToken: string) => Promise<T>): Promise<T> {
      const accessToken = getAccessToken();
      
      if (!accessToken) {
        throw new Error('No access token available');
      }

      try {
        return await apiCall(accessToken);
      } catch (error: unknown) {
        // If unauthorized, try to refresh token
        if (error instanceof Error && (error.message.includes('401') || error.message.includes('Unauthorized'))) {
          const newToken = await refreshAccessToken();
          if (newToken) {
            return await apiCall(newToken);
          }
        }
        throw error;
      }
    },
    [getAccessToken, refreshAccessToken]
  );

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && !!getAccessToken(),
    isLoading,
    setAuthData,
    setUser: setUserData,
    clearAuth,
    refreshUser,
    checkAuthStatus,
    withAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 