"use client"
import React, { useState } from 'react'
import Header from '../components/Header'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/context/AuthContext';
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { toast, Toaster } from 'sonner'
import logo from '../img/legalynxlogo.png'
import Image from 'next/image';

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
    <div className='h-screen overflow-hidden'>
        <header className='bg-white shadow-sm border-b'>
            <Header />
        </header>

        <main className='flex flex-col md:flex-row-reverse w-full h-[calc(100vh-var(--header-height,64px))]'>
            <div className='flex flex-col items-center md:items-start mx-0 w-full md:w-1/2 px-20 md:px-10 py-20 md:py-10 justify-center gap-2 overflow-y-auto'>
                <div className='w-full flex flex-col items-start md:pl-20 gap-2'>
                    <span>
                        <h1 className='text-4xl font-bold font-serif'>Sign In</h1>
                        <p className='text-gray-600 mb-4'>Welcome back to LegalynX</p>

                    </span>

                <div className='flex flex-col items-start justify-center gap-4 w-full md:not-first:w-2/3'>
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

                    <span className='text-sm text-gray-600'>
                        <Link href="/frontend/register" className='cursor-pointer hover:text-blue-600'>
                            I don't have an account yet
                        </Link>
                    </span>
                </div>  
                </div>
               
            </div>

            <div className='hidden md:flex flex-col bg-blue/5 border-l border-gray-400/20 shadow-md border items-center justify-center h-full w-full md:w-1/2 gap-2 relative'>
                <Image
                    src={logo}
                    alt="Login"
                    width={600}
                    height={500}
                    className="fade-gradient"
                />
                <p className='text-2xl mx-auto text-center absolute bottom-20 text-gray-600'>Linking you to legal clarity</p>

            </div>
        </main>
        <Toaster position='top-right' richColors />
    </div>
  )
}

export default Login