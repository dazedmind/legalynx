// components/ProtectedRoute.tsx
'use client';

import React from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiresPaid?: boolean; // For paid-only features
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ 
  children, 
  requiresPaid = false,
  fallback 
}: ProtectedRouteProps) {
  const { isAuthenticated, isPaidUser, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push('/frontend/login');
        return;
      }

      if (requiresPaid && !isPaidUser) {
        router.push('/frontend/upgrade'); // Or show upgrade modal
        return;
      }
    }
  }, [isAuthenticated, isPaidUser, isLoading, router, requiresPaid]);

  // Show loading spinner while checking auth
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show fallback if not authenticated
  if (!isAuthenticated) {
    return fallback || null;
  }

  // Show fallback if paid required but user is not paid
  if (requiresPaid && !isPaidUser) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-bold mb-4">Premium Feature</h2>
        <p className="text-gray-600 mb-4">This feature requires a paid subscription.</p>
        <button 
          onClick={() => router.push('/frontend/upgrade')}
          className="bg-blue-600 text-white px-6 py-2 rounded-md"
        >
          Upgrade Now
        </button>
      </div>
    );
  }

  return <>{children}</>;
}