"use client"
import React, { useState } from 'react'
import Header from '../components/Header'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/context/AuthContext';
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { FcGoogle } from 'react-icons/fc'
import { useRouter } from 'next/navigation'
import { toast, Toaster } from 'sonner'
import { signIn, signOut, useSession, getSession } from "next-auth/react";

interface ProfileData {
    id: string;
    email: string;
    name: string;
    email_verified: boolean;
    status: string;
    subscription_status: 'BASIC' | 'STANDARD' | 'PREMIUM';
    profile_picture: string;
}

function Login() {
    const { login } = useAuth();
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    const router = useRouter()
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })

    const emailValidation = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    const handleLogin = async () => {
        const response = await fetch('/backend/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        })
        
        const data = await response.json();

        if (response.ok) {
            // Use auth context to set authentication
            login(data.token, data.user);
            router.push('/frontend/home');
          } else {
            toast.error(data.message || 'Login failed');
          }

    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
        
    }

  return (
    <div>
        <header className='bg-white shadow-sm border-b'>
            <Header />
        </header>

        <main className='flex flex-row  w-full'>
            <div className='flex flex-col  items-start mx-50 w-1/2 px-10 py-20 justify-center gap-2'>
                <h1 className='text-4xl font-bold font-serif'>Sign In</h1>
                <p className='text-gray-600 mb-4'>Welcome back to LegalynX</p>

                <div className='flex flex-col items-start justify-center gap-4 w-2/3'>
                    <span className='flex flex-col items-start gap-2 justify-start w-full'>
                        <p className='text-sm text-gray-600'>Email address</p>
                        <Input
                            name='email'
                            type='email'
                            placeholder='Enter your email'
                            value={formData.email}
                            onChange={handleChange}
                            className={
                                formData.email && !emailValidation(formData.email)
                                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                                    : ''
                            }
                        />
                        {formData.email && !emailValidation(formData.email) && (
                            <p className='text-red-500 text-xs'>Must be a valid email address</p>
                        )}
                    </span>
                    <span className='flex flex-col items-start gap-2 justify-start w-full'>
                        <p className='text-sm text-gray-600'>Password</p>
                        <Input name='password' type='password' placeholder='Enter your password' value={formData.password} onChange={handleChange} />
                    </span>


                    <span className='text-sm text-gray-600'>
                        Forgot Password?
                    </span>
                    <Button onClick={handleLogin} className='w-full cursor-pointer bg-blue-600 text-white'>Sign In</Button>

                    <span className='flex flex-row items-center justify-center gap-2 w-full'>
                        <div className='w-full h-px bg-gray-200 my-4'></div>
                        <p className='text-sm text-gray-600'>or</p>
                        <div className='w-full h-px bg-gray-200 my-4'></div>
                    </span>

                        <Button 
                            className='w-full cursor-pointer' 
                            variant='outline'
                            disabled={isGoogleLoading}
                        >
                            {isGoogleLoading ? (
                                <div className="flex items-center">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                                    Signing in with Google...
                                </div>
                            ) : (
                                <>
                                    <FcGoogle className="mr-2" />
                                    Sign In with Google
                                </>
                            )}
                        </Button>

                    <span className='text-sm text-gray-600'>
                        <Link href="/frontend/register" className='cursor-pointer hover:text-blue-600'>
                            I don't have an account yet
                        </Link>
                    </span>
                </div>  
            </div>

            <div className='flex flex-col  items-center justify-center w-1/2 mx-auto px-4 sm:px-6 lg:px-8 my-30 gap-2'>
                <img src="/images/login.png" alt="Login" className='w-1/2' />
            </div>
        </main>
        <Toaster position='top-right' richColors />
    </div>
  )
}

export default Login