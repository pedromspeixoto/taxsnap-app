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
  isHydrated: boolean;
  // Pure state management methods
  setAuthData: (authResponse: AuthResponse) => ClientUser;
  setUser: (user: ClientUser) => void;
  clearAuth: () => void;
  refreshUser: () => void;
  checkAuthStatus: () => Promise<boolean>;
  // Helper method for authenticated API calls
  withAuth: <T>(apiCall: (accessToken: string) => Promise<T>) => Promise<T>;
  // Direct access token method with automatic refresh
  getValidAccessToken: () => Promise<string>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper function to check if current path is a protected route
const isOnProtectedRoute = (): boolean => {
  if (typeof window === 'undefined') return false;
  const protectedRoutes = ['/dashboard'];
  return protectedRoutes.some(route => window.location.pathname.startsWith(route));
};

// Helper function to redirect to home if on protected route
const redirectIfOnProtectedRoute = (): void => {
  if (typeof window !== 'undefined' && isOnProtectedRoute()) {
    window.location.href = '/';
  }
};

// Generic function to handle authentication failure - clears tokens, user state, and redirects
const handleAuthFailure = (
  clearTokens: () => void,
  setUser: (user: ClientUser | null) => void,
  setIsTokenValid: (valid: boolean) => void
): void => {
  clearTokens();
  setUser(null);
  setIsTokenValid(false);
  redirectIfOnProtectedRoute();
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(false);

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

  const getCookieValue = useCallback((name: string): string | null => {
    if (typeof window !== 'undefined') {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) {
        return parts.pop()?.split(';').shift() || null;
      }
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
  const checkAuthStatus = useCallback(async (): Promise<boolean> => {
    // Don't check auth status on server-side
    if (typeof window === 'undefined') {
      return false;
    }

    const currentUser = getStoredUser();
    const accessToken = getAccessToken();
    const cookieToken = getCookieValue(ACCESS_TOKEN_KEY);
    
    // If no tokens or user data, check if this is initialization vs actual failure
    if (!accessToken || !currentUser) {
      // Check if there are ANY auth-related items in storage (indicating previous login attempt)
      const hasAnyAuthData = typeof window !== 'undefined' && (
        localStorage.getItem(ACCESS_TOKEN_KEY) || 
        localStorage.getItem(REFRESH_TOKEN_KEY) || 
        localStorage.getItem(USER_KEY) ||
        document.cookie.includes(ACCESS_TOKEN_KEY)
      );
      
      if (hasAnyAuthData) {
        // There was some auth data but it's incomplete/corrupted - this is a failure
        handleAuthFailure(clearTokens, setUser, setIsTokenValid);
      } else {
        // No auth data at all - this is normal initial state, not a failure
        // Just update state without calling handleAuthFailure
        setUser(null);
        setIsTokenValid(false);
      }
      return false;
    }

    // Check if cookies were cleared by middleware (tokens exist in localStorage but not in cookies)
    // This indicates the middleware found the tokens invalid - try to refresh before clearing
    if (accessToken && !cookieToken) {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        try {
          const data = await apiClient.refreshToken(refreshToken);
          const newAccessToken = data.accessToken;
          
          // Update access token in storage and cookies
          localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
          document.cookie = `${ACCESS_TOKEN_KEY}=${newAccessToken}; path=/; max-age=${60 * 15}`;
          
          // Token refreshed successfully, user remains authenticated
          setUser(currentUser);
          setIsTokenValid(true);
          return true;
        } catch {
          // Refresh failed, now clear auth state
          handleAuthFailure(clearTokens, setUser, setIsTokenValid);
          return false;
        }
      } else {
        // No refresh token, clear auth state
        handleAuthFailure(clearTokens, setUser, setIsTokenValid);
        return false;
      }
    }

    // Check if access token is expired
    if (isTokenExpired(accessToken)) {
      // Try to refresh the token before clearing auth state
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      if (refreshToken) {
        try {
          const data = await apiClient.refreshToken(refreshToken);
          const newAccessToken = data.accessToken;
          
          // Update access token in storage
          localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
          document.cookie = `${ACCESS_TOKEN_KEY}=${newAccessToken}; path=/; max-age=${60 * 15}`;
          
          // Token refreshed successfully, user remains authenticated
          setUser(currentUser);
          setIsTokenValid(true);
          return true;
        } catch {
          // Refresh failed, clear auth state
          handleAuthFailure(clearTokens, setUser, setIsTokenValid);
          return false;
        }
      } else {
        // No refresh token, clear auth state
        handleAuthFailure(clearTokens, setUser, setIsTokenValid);
        return false;
      }
    }

    // Tokens exist and are not expired, user is authenticated
    setUser(currentUser);
    setIsTokenValid(true);
    return true;
  }, [getStoredUser, getAccessToken, getCookieValue, isTokenExpired, clearTokens]);

  const refreshUser = useCallback(async () => {
    await checkAuthStatus();
  }, [checkAuthStatus]);

  // Initialize auth state on mount - client-side only
  useEffect(() => {
    const initializeAuth = async () => {
      // Mark as hydrated
      setIsHydrated(true);
      
      // Check auth status after hydration
      await checkAuthStatus();
      setIsLoading(false);
    };
    
    initializeAuth();
  }, [checkAuthStatus]);

  // Listen for storage changes (logout from another tab)  
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorageChange = async () => {
      // Note: Storage listener temporarily disabled to prevent race condition during login
      // This was meant for cross-tab logout detection
      // if (e.key === ACCESS_TOKEN_KEY || e.key === USER_KEY) {
      //   await checkAuthStatus();
      // }
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
    setIsTokenValid(true);
    
    return clientUser;
  }, [setTokens, setStoredUser]);

  const setUserData = useCallback((userData: ClientUser): void => {
    setStoredUser(userData);
    setUser(userData);
  }, [setStoredUser]);

  const clearAuth = useCallback((): void => {
    clearTokens();
    setUser(null);
    setIsTokenValid(false);
    // Redirect to home when explicitly logging out
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  }, [clearTokens]);

  // Direct access token method with automatic refresh
  const getValidAccessToken = useCallback(async (): Promise<string> => {
    // Get tokens directly from localStorage
    const accessToken = typeof window !== 'undefined' ? localStorage.getItem(ACCESS_TOKEN_KEY) : null;
    
    if (!accessToken) {
      handleAuthFailure(clearTokens, setUser, setIsTokenValid);
      throw new Error('No access token available');
    }

    // Check if token is expired
    if (isTokenExpired(accessToken)) {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
      if (!refreshToken) {
        handleAuthFailure(clearTokens, setUser, setIsTokenValid);
        throw new Error('No refresh token available');
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
        handleAuthFailure(clearTokens, setUser, setIsTokenValid);
        throw new Error('Token refresh failed');
      }
    }

    return accessToken;
  }, [clearTokens, isTokenExpired]);

  // Helper method for authenticated API calls with automatic token refresh
  const withAuth = useCallback(
    async function<T>(apiCall: (accessToken: string) => Promise<T>): Promise<T> {
      try {
        const accessToken = await getValidAccessToken();
        return await apiCall(accessToken);
      } catch (error: unknown) {
        // If unauthorized, try to refresh token once more
        if (error instanceof Error && (
          error.message.includes('401') || 
          error.message.includes('Unauthorized') ||
          error.message.includes('Invalid or expired token')
        )) {
          const refreshToken = typeof window !== 'undefined' ? localStorage.getItem(REFRESH_TOKEN_KEY) : null;
          if (!refreshToken) {
            handleAuthFailure(clearTokens, setUser, setIsTokenValid);
            throw error;
          }

          try {
            const data = await apiClient.refreshToken(refreshToken);
            const newAccessToken = data.accessToken;
            
            // Update access token in storage
            if (typeof window !== 'undefined') {
              localStorage.setItem(ACCESS_TOKEN_KEY, newAccessToken);
              document.cookie = `${ACCESS_TOKEN_KEY}=${newAccessToken}; path=/; max-age=${60 * 15}`;
            }

            return await apiCall(newAccessToken);
          } catch {
            handleAuthFailure(clearTokens, setUser, setIsTokenValid);
            throw error;
          }
        }
        throw error;
      }
    },
    [getValidAccessToken, clearTokens]
  );

  const value: AuthContextType = {
    user,
    // Only report authenticated after hydration and with valid token
    isAuthenticated: isHydrated && !!user && isTokenValid,
    isLoading,
    isHydrated,
    setAuthData,
    setUser: setUserData,
    clearAuth,
    refreshUser,
    checkAuthStatus,
    withAuth,
    getValidAccessToken,
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