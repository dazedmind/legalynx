"use client"
import React, { useState } from 'react'
import Header from '../components/Header'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/lib/context/AuthContext';
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { FcGoogle } from 'react-icons/fc'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

function Login() {
    const { login } = useAuth();

    const router = useRouter()
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    })
    
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
            toast.success('Login successful!');
            router.push('/frontend/home');
          } else {
            toast.error(data.message || 'Login failed');
          }
        // } else {
        //     toast.error('Login failed')
        // }
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
            <div className='flex flex-col  items-start mx-40 w-1/2 px-10 py-20 justify-center gap-2'>
                <h1 className='text-4xl font-bold font-serif'>Sign In</h1>
                <p className='text-gray-600 mb-4'>Welcome back to LegalynX</p>

                <div className='flex flex-col items-start justify-center gap-4 w-2/3'>
                    <span className='flex flex-col items-start gap-2 justify-start w-full'>
                        <p className='text-sm text-gray-600'>Email address</p>
                        <Input name='email' type='email' placeholder='Enter your email' value={formData.email} onChange={handleChange} />
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

                    <Button className='w-full cursor-pointer' variant='outline'>
                        <FcGoogle />
                        Sign In with Google</Button>
           

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

    </div>
  )
}

export default Login