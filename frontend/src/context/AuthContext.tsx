import React, { createContext, useState, useEffect, useCallback, useMemo } from 'react';
import type { User, LoginPayload, AuthState } from '../types/auth.types';
import { authApi } from '../api/auth.api';

export interface AuthContextType extends AuthState {
  login: (payload: LoginPayload) => Promise<User>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'sims_access_token';
const USER_KEY = 'sims_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    if (!stored) return null;
    try {
      return JSON.parse(stored) as User;
    } catch {
      localStorage.removeItem(USER_KEY);
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_KEY);
  });

  const [isLoading, setIsLoading] = useState(false);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };

    window.addEventListener('sims:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('sims:unauthorized', handleUnauthorized);
    };
  }, [logout]);

  const login = useCallback(async (payload: LoginPayload): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authApi.login(payload);
      const authUser = response.data.user;
      const token = response.data.access_token;
      
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(authUser));
      
      setToken(token);
      setUser(authUser);
      return authUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo<AuthContextType>(() => ({
    user,
    token,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
  }), [user, token, isLoading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
