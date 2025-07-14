'use client'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AlertCircle } from 'lucide-react'

const errorMessages = {
  Configuration: 'There is a problem with the server configuration.',
  AccessDenied: 'Access denied. You do not have permission to sign in.',
  Verification: 'The verification token has expired or has already been used.',
  Default: 'An error occurred during authentication.',
}

export default function AuthError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') as keyof typeof errorMessages

  console.log('🔍 Auth error page loaded with error:', error)

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-red-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {errorMessages[error] || errorMessages.Default}
          </p>
          {error && (
            <p className="mt-2 text-xs text-gray-500">
              Error code: {error}
            </p>
          )}
        </div>
        <div className="text-center space-x-4">
          <Link 
            href="/frontend/login"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Try Again
          </Link>
          <Link 
            href="/"
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  )
}
