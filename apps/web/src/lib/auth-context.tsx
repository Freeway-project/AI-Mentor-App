'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiClient, type GoogleAuthOptions } from './api-client';

interface User {
  id: string;
  email: string;
  name: string;
  roles: string[];
  avatar?: string;
  timezone?: string;
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ user: User; token: string }>;
  register: (email: string, password: string, name: string, role: string) => Promise<any>;
  loginWithGoogle: (idToken: string, options?: GoogleAuthOptions) => Promise<{ isNew: boolean; user: User }>;
  logout: () => void;
  clearAuthState: () => void;
}

function readCachedUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('auth_user');
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const hasToken = typeof window !== 'undefined' && !!localStorage.getItem('auth_token');
  const [user, setUser] = useState<User | null>(readCachedUser);
  const [loading, setLoading] = useState(hasToken);

  // Register 401 handler once
  useEffect(() => {
    apiClient.setOnUnauthorized(() => {
      localStorage.removeItem('auth_user');
      setUser(null);
    });
  }, []);

  // Background validation on mount
  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      apiClient.getMe()
        .then((data) => {
          setUser(data);
          localStorage.setItem('auth_user', JSON.stringify(data));
        })
        .catch(() => {
          apiClient.clearToken();
          localStorage.removeItem('auth_user');
          setUser(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiClient.login(email, password);
    apiClient.setToken(data.token);
    localStorage.setItem('auth_token', data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, role: string) => {
    const data = await apiClient.register(email, password, name, role);
    apiClient.setToken(data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string, options?: GoogleAuthOptions) => {
    const data = await apiClient.googleAuth(idToken, options);
    apiClient.setToken(data.token);
    localStorage.setItem('auth_user', JSON.stringify(data.user));
    setUser(data.user);
    return { isNew: data.isNew, user: data.user };
  }, []);

  const logout = useCallback(() => {
    apiClient.clearToken();
    localStorage.removeItem('auth_user');
    setUser(null);
  }, []);

  const clearAuthState = useCallback(() => {
    apiClient.clearToken();
    localStorage.removeItem('auth_user');
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, logout, clearAuthState }}>
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
