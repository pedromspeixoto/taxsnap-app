"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authClient } from '@/lib/api/client';
import { ClientUser } from '@/lib/types/user';

interface AuthContextType {
  user: ClientUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<ClientUser>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ClientUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = () => {
    const currentUser = authClient.getUser();
    setUser(currentUser);
  };

  useEffect(() => {
    refreshUser();
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<ClientUser> => {
    await authClient.login({ email, password });
    refreshUser();
    return authClient.getUser()!;
  };

  const register = async (email: string, password: string) => {
    await authClient.register({ email, password });
    setUser(null);
  };

  const logout = () => {
    authClient.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: authClient.isAuthenticated(),
    isLoading,
    login,
    register,
    logout,
    refreshUser,
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