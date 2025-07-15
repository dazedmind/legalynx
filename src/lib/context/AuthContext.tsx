// contexts/AuthContext.tsx
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authUtils, User } from '../auth';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isPaidUser: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check authentication on app load
    const checkAuth = () => {
      if (authUtils.isAuthenticated()) {
        const userData = authUtils.getUser();
        setUser(userData);
      }
      setIsLoading(false);
    };

    checkAuth();
  }, []);

  const login = (token: string, userData: User) => {
    authUtils.setAuth(token, userData);
    setUser(userData);
  };

  const logout = async () => {
    try {
      // Call API logout endpoint
      const token = authUtils.getToken();
      if (token) {
        await fetch('/backend/api/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      // Log error but don't prevent logout
      console.error('API logout failed:', error);
    } finally {
      // Always clear local auth state regardless of API call success
      authUtils.logout();
      setUser(null);
      router.push('/');
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      authUtils.updateUser(userData);
      setUser(updatedUser);
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && authUtils.isAuthenticated(),
    isLoading,
    isPaidUser: user?.isPaidUser || false,
    login,
    logout,
    updateUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};