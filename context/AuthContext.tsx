// E:\Y-Lingo\frontend\context\AuthContext.tsx

'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';

import { authEndpoints } from '@/lib/endpoints';
import { tokenHelpers } from '@/lib/api';

interface User {
  id: string;
  // Backend sends camelCase (serialization_alias). Support both so existing
  // code that reads full_name continues to work during transition.
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

// ---------------------------------------------------------------------------
// Normalize user — backend serializes with camelCase aliases (fullName,
// isActive, isVerified, isAdmin). Ensure both snake_case and camelCase are
// always present so every template works regardless of field name used.
// ---------------------------------------------------------------------------
function normalizeUser(raw: Record<string, unknown>): User {
  const fullName = (raw.fullName || raw.full_name || '') as string;
  const isActive = (raw.isActive ?? raw.is_active ?? true) as boolean;
  const isVerified = (raw.isVerified ?? raw.is_verified ?? false) as boolean;
  const isAdmin = (raw.isAdmin ?? raw.is_admin ?? false) as boolean;
  return {
    ...raw,
    full_name: fullName,
    fullName,
    is_active: isActive,
    isActive,
    is_verified: isVerified,
    isVerified,
    is_admin: isAdmin,
    isAdmin,
  } as User;
}

export function AuthProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ---------------------------------------------------------
  // LOAD CURRENT USER
  // ---------------------------------------------------------

  useEffect(() => {
    const loadUser = async () => {
      try {
        const token = tokenHelpers.getAccessToken();

        console.log(
          '🔐 AuthProvider startup - token:',
          token ? '✅ Found' : '❌ Not Found'
        );

        if (!token) {
          setUser(null);
          return;
        }

        const response = await authEndpoints.me();

        console.log('👤 /auth/me response:', response.data);

        const rawUser = response.data.user || response.data;
        // Backend serializes with camelCase aliases (fullName, isActive, etc.).
        // Normalize so both full_name and fullName are always populated.
        const userData = normalizeUser(rawUser);

        setUser(userData);
      } catch (error) {
        console.error('❌ Failed to load current user:', error);

        tokenHelpers.clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadUser();
  }, []);

  // ---------------------------------------------------------
  // LOGIN
  // ---------------------------------------------------------

  const login = async (
    email: string,
    password: string
  ): Promise<void> => {
    setIsLoading(true);

    try {
      console.log('📤 Sending login request...');
      console.log('📧 Email:', email);

      const response = await authEndpoints.login({
        email,
        password,
      });

      console.log('📥 Login HTTP status:', response.status);
      console.log('📥 Login response:', response.data);

      const data = response.data;

      // -----------------------------------------------------
      // IMPORTANT:
      // Backend returns camelCase:
      //
      // accessToken
      // refreshToken
      //
      // NOT:
      //
      // access_token
      // refresh_token
      // -----------------------------------------------------

      const accessToken =
        data.accessToken || data.access_token;

      const refreshToken =
        data.refreshToken || data.refresh_token;

      const userData = data.user;

      // -----------------------------------------------------
      // VERIFY ACCESS TOKEN
      // -----------------------------------------------------

      if (!accessToken) {
        console.error(
          '❌ Login response does not contain access token:',
          data
        );

        throw new Error(
          'Login successful, but access token was not returned by the backend.'
        );
      }

      console.log('🔑 Access token received: ✅ Yes');

      // -----------------------------------------------------
      // SAVE TOKENS
      // -----------------------------------------------------

      if (refreshToken) {
        tokenHelpers.setTokens(
          accessToken,
          refreshToken
        );
      } else {
        // Fallback in case refresh token is missing
        localStorage.setItem(
          'access_token',
          accessToken
        );
      }

      console.log(
        '💾 Tokens saved successfully.'
      );

      // -----------------------------------------------------
      // VERIFY TOKEN
      // -----------------------------------------------------

      const savedToken =
        tokenHelpers.getAccessToken();

      console.log(
        '🔍 Token verification:',
        savedToken ? '✅ Found' : '❌ Not Found'
      );

      if (!savedToken) {
        throw new Error(
          'Login succeeded, but access token could not be saved.'
        );
      }

      // -----------------------------------------------------
      // SAVE USER
      // -----------------------------------------------------

      if (userData) {
        setUser(normalizeUser(userData as Record<string, unknown>));

        console.log(
          '👤 Logged-in user:',
          userData
        );
      } else {
        console.warn(
          '⚠️ Login response did not contain user object.'
        );

        // Try fetching user from backend
        try {
          const meResponse =
            await authEndpoints.me();

          const meUser =
            meResponse.data.user ||
            meResponse.data;

          setUser(normalizeUser(meUser as Record<string, unknown>));

          console.log(
            '👤 User loaded from /auth/me:',
            meUser
          );
        } catch (meError) {
          console.error(
            '❌ Could not load user after login:',
            meError
          );

          throw new Error(
            'Login succeeded, but user information could not be loaded.'
          );
        }
      }

      // -----------------------------------------------------
      // REDIRECT
      // -----------------------------------------------------

      console.log(
        '🚀 Login successful. Redirecting to dashboard...'
      );

      window.location.href = '/dashboard';
    } catch (error) {
      console.error(
        '❌ Login failed:',
        error
      );

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------
  // REGISTER
  // ---------------------------------------------------------

  const register = async (
    data: RegisterData
  ): Promise<void> => {
    setIsLoading(true);

    try {
      console.log(
        '📤 Sending registration request...'
      );

      const response =
        await authEndpoints.register(data);

      console.log(
        '📥 Registration response:',
        response.data
      );

      const responseData = response.data;

      const accessToken =
        responseData.accessToken ||
        responseData.access_token;

      const refreshToken =
        responseData.refreshToken ||
        responseData.refresh_token;

      const userData =
        responseData.user;

      if (!accessToken) {
        throw new Error(
          'Registration successful, but access token was not returned by the backend.'
        );
      }

      // Save tokens
      if (refreshToken) {
        tokenHelpers.setTokens(
          accessToken,
          refreshToken
        );
      } else {
        localStorage.setItem(
          'access_token',
          accessToken
        );
      }

      // Save user
      if (userData) {
        setUser(normalizeUser(userData as Record<string, unknown>));
      }

      console.log(
        '✅ Registration successful.'
      );

      // New users go to onboarding
      window.location.href =
        '/onboarding';
    } catch (error) {
      console.error(
        '❌ Registration failed:',
        error
      );

      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------
  // LOGOUT
  // ---------------------------------------------------------

  const logout = async (): Promise<void> => {
    setIsLoading(true);

    try {
      await authEndpoints.logout();
    } catch (error) {
      console.warn(
        '⚠️ Backend logout request failed:',
        error
      );
    } finally {
      tokenHelpers.clearTokens();

      localStorage.removeItem('user');

      setUser(null);

      window.location.href = '/login';

      setIsLoading(false);
    }
  };

  // ---------------------------------------------------------
  // REFRESH USER
  // ---------------------------------------------------------

  const refreshUser = async (): Promise<void> => {
    try {
      const token =
        tokenHelpers.getAccessToken();

      if (!token) {
        setUser(null);
        return;
      }

      const response =
        await authEndpoints.me();

      console.log(
        '👤 /auth/me response:',
        response.data
      );

      const rawUser =
        response.data.user ||
        response.data;

      setUser(normalizeUser(rawUser as Record<string, unknown>));
    } catch (error) {
      console.error(
        '❌ Failed to refresh user:',
        error
      );

      tokenHelpers.clearTokens();
      setUser(null);
    }
  };

  // ---------------------------------------------------------
  // CONTEXT VALUE
  // ---------------------------------------------------------

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser,
  };

  // ---------------------------------------------------------
  // PROVIDER
  // ---------------------------------------------------------

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ---------------------------------------------------------
// useAuth Hook
// ---------------------------------------------------------

export function useAuth() {
  const context =
    useContext(AuthContext);

  if (context === undefined) {
    throw new Error(
      'useAuth must be used within an AuthProvider'
    );
  }

  return context;
}