'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import Header from '../../components/Header';

function VerifyEmail() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');
    
    if (!token) {
      setStatus('error');
      setMessage('Invalid verification link');
      return;
    }

    verifyEmail(token);
  }, [searchParams]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch('/backend/api/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus('success');
        setMessage('Your email has been verified successfully!');
      } else {
        setStatus('error');
        setMessage(data.error || 'Verification failed');
      }
    } catch (error) {
      setStatus('error');
      setMessage('Something went wrong. Please try again.');
    }
  };

  const handleContinue = () => {
    router.push('/frontend/home');
  };

  return (
    <div>
      <header className="bg-white shadow-sm border-b">
        <Header />
      </header>

      <main className="flex items-center justify-center my-40">
          {status === 'loading' && (
            <div className="w-lg flex flex-col gap-4 border border-gray-300 items-center justify-center rounded-lg p-8">
              <Loader2 className="w-16 h-16 text-blue-600 mx-auto animate-spin" />
              <h1 className="text-2xl font-bold text-gray-900">Verifying Email</h1>
              <p className="text-gray-600">Please wait while we verify your email address...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="w-lg flex flex-col gap-4 border border-gray-300 items-center justify-center rounded-lg p-8">
              <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto" />
              <h1 className="text-2xl font-bold text-gray-900">Email Verified!</h1>
              <p className="text-gray-600">{message}</p>
              <Button
                onClick={handleContinue}
                className=" cursor-pointer w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                Continue to LegalynX
              </Button>
            </div>
          )}

          {status === 'error' && (
            <div className="w-lg flex flex-col gap-4 border border-gray-300 items-center justify-center rounded-lg p-8">
              <XCircle className="w-16 h-16 text-red-600 mx-auto" />
              <h1 className="text-2xl font-bold text-gray-900">Verification Failed</h1>
              <p className="text-gray-600">{message}</p>
              <div className="flex justify-center w-full gap-2">
                <Button
                  onClick={() => router.push('/frontend/register')}
                  variant="outline"
                  className="cursor-pointer"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => router.push('/frontend/login')}
                  className="cursor-pointer bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Go to Login
                </Button>
              </div>
            </div>
          )}
      </main>
    </div>
  );
}

export default VerifyEmail;