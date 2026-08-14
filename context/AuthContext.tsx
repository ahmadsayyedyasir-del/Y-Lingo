// context/AuthContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authEndpoints } from '@/lib/endpoints';
import { tokenHelpers } from '@/lib/api';

interface User {
  id: string;
  full_name?: string;
  fullName?: string;
  username: string;
  email: string;
  is_active?: boolean;
  isActive?: boolean;
  is_verified?: boolean;
  isVerified?: boolean;
  is_admin?: boolean;
  isAdmin?: boolean;
}

interface RegisterData {
  full_name: string;
  username: string;
  email: string;
  password: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Normalize — backend sends camelCase aliases (fullName, isActive, etc.).
// Ensure both snake_case and camelCase are always populated.
function normalizeUser(raw: Record<string, unknown>): User {
  const fullName  = (raw.fullName  || raw.full_name  || '')    as string;
  const isActive  = (raw.isActive  ?? raw.is_active  ?? true)  as boolean;
  const isVerified = (raw.isVerified ?? raw.is_verified ?? false) as boolean;
  const isAdmin   = (raw.isAdmin   ?? raw.is_admin   ?? false) as boolean;
  return { ...raw, full_name: fullName, fullName, is_active: isActive, isActive, is_verified: isVerified, isVerified, is_admin: isAdmin, isAdmin } as User;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = tokenHelpers.getAccessToken();
        if (!token) { setUser(null); return; }

        const response = await authEndpoints.me();
        const rawUser = response.data.user || response.data;
        setUser(normalizeUser(rawUser));
      } catch {
        tokenHelpers.clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    loadUser();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authEndpoints.login({ email, password });
      const data = response.data;

      const accessToken  = data.accessToken  || data.access_token;
      const refreshToken = data.refreshToken || data.refresh_token;
      const userData     = data.user;

      if (!accessToken) throw new Error('Login succeeded but no access token returned.');

      refreshToken
        ? tokenHelpers.setTokens(accessToken, refreshToken)
        : localStorage.setItem('access_token', accessToken);

      if (userData) {
        setUser(normalizeUser(userData as Record<string, unknown>));
      } else {
        const me = await authEndpoints.me();
        setUser(normalizeUser((me.data.user || me.data) as Record<string, unknown>));
      }

      window.location.href = '/dashboard';
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    setIsLoading(true);
    try {
      const response = await authEndpoints.register(data);
      const res = response.data;

      const accessToken  = res.accessToken  || res.access_token;
      const refreshToken = res.refreshToken || res.refresh_token;
      const userData     = res.user;

      if (!accessToken) throw new Error('Registration succeeded but no access token returned.');

      refreshToken
        ? tokenHelpers.setTokens(accessToken, refreshToken)
        : localStorage.setItem('access_token', accessToken);

      if (userData) setUser(normalizeUser(userData as Record<string, unknown>));

      window.location.href = '/onboarding';
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    try {
      await authEndpoints.logout();
    } catch {
      // silent — tokens cleared regardless
    } finally {
      tokenHelpers.clearTokens();
      localStorage.removeItem('user');
      setUser(null);
      window.location.href = '/login';
      setIsLoading(false);
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const token = tokenHelpers.getAccessToken();
      if (!token) { setUser(null); return; }

      const response = await authEndpoints.me();
      const rawUser = response.data.user || response.data;
      setUser(normalizeUser(rawUser as Record<string, unknown>));
    } catch {
      tokenHelpers.clearTokens();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
