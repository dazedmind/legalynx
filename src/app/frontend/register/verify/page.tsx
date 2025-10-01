// src/app/frontend/register/verify/page.tsx
'use client';

import React, { Suspense } from 'react';
import { Button } from '@/app/frontend/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Header from '../../components/layout/Header';
import VerifyEmailContent from './VerifyEmailContent';

// Loading component for Suspense fallback
function VerifyEmailLoading() {
  return (
    <div>
      <header className="bg-white shadow-sm border-b">
        <Header />
      </header>
      <main className="flex items-center justify-center my-40">
        <div className="w-lg flex flex-col gap-4 border border-gray-300 items-center justify-center rounded-lg p-8">
          <Loader2 className="w-16 h-16 text-blue-600 mx-auto animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900">Loading...</h1>
          <p className="text-gray-600">Please wait while we load the verification page...</p>
        </div>
      </main>
    </div>
  );
}

// Main page component wrapped with Suspense
export default function VerifyEmail() {
  return (
    <Suspense fallback={<VerifyEmailLoading />}>
      <VerifyEmailContent />
    </Suspense>
  );
}