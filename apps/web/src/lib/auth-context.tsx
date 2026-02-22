'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiClient } from './api-client';

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
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, role: string) => Promise<void>;
  loginWithGoogle: (idToken: string) => Promise<void>;
  loginWithToken: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (token) {
      apiClient.getMe()
        .then((data) => setUser(data))
        .catch(() => {
          apiClient.clearToken();
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiClient.login(email, password);
    apiClient.setToken(data.token);
    setUser(data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string, role: string) => {
    const data = await apiClient.register(email, password, name, role);
    apiClient.setToken(data.token);
    setUser(data.user);
  }, []);

  const loginWithGoogle = useCallback(async (idToken: string) => {
    const data = await apiClient.googleAuth(idToken);
    apiClient.setToken(data.token);
    setUser(data.user);
  }, []);

  const loginWithToken = useCallback(async (token: string) => {
    apiClient.setToken(token);
    const data = await apiClient.getMe();
    setUser(data);
  }, []);

  const logout = useCallback(() => {
    apiClient.clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, loginWithGoogle, loginWithToken, logout }}>
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
