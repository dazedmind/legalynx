"use client"
import React, { useState } from 'react'
import Header from '../components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import { toast , Toaster } from 'sonner'
import { useRouter } from 'next/navigation'
import logo from '../img/legalynxlogo.png'
import Image from 'next/image'


function Register() {
    const router = useRouter()
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false
        })
    
    const emailValidation = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email)
    }

    const validateForm = () => {
        if (formData.email === '' || formData.password === '') {
            toast.error('Please fill in all fields')
            return false
        }
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match')
            return false
        }
        if (!formData.acceptTerms) {
            toast.error('You must accept the terms and conditions')
            return false
        }
        
        return true
    }
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value })
    }

    const handleCheckboxChange = (checked: boolean) => {
        setFormData({ ...formData, acceptTerms: checked })
    }


    const handleSubmit = async () => {
        if (!validateForm()) {
            return
        }
    
        try {
            // Store form data in sessionStorage for later use
            sessionStorage.setItem('registrationData', JSON.stringify({
                email: formData.email,
                password: formData.password
            }));
    
            const response = await fetch('/backend/api/send-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.email,
                    password: formData.password,
                    confirmPassword: formData.confirmPassword
                })
            });
    
            const data = await response.json();
    
            if (response.ok) {
                router.push('/frontend/register/verification');
            } else {
                toast.error(data.error || 'Failed to send verification email');
            }
        } catch (error) {
            toast.error('Something went wrong. Please try again.');
            console.error('Registration error:', error);
        }
    };

  return (
    <div>
        <header className='bg-white shadow-sm border-b'>
            <Header />
        </header>

        <main className='flex flex-col md:flex-row  w-full'>
            <div className='flex flex-col  items-center md:items-start mx-0 md:ml-60 w-full md:w-1/2 px-0 md:px-10 py-20 justify-center my-0 gap-2'>
                <h1 className='text-4xl font-bold font-serif'>Sign Up</h1>
                <p className='text-gray-600 mb-4'>Create your account</p>

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
                        <Input type='password' name='password' placeholder='Enter your password' value={formData.password} onChange={handleChange} />
                    </span>

                    <span className='flex flex-col items-start gap-2 justify-start w-full'>
                        <p className='text-sm text-gray-600'>Confirm Password</p>
                        <Input type='password' name='confirmPassword' placeholder='Confirm your password' value={formData.confirmPassword} onChange={handleChange}/>
                    </span>
           

                    <span className='text-sm text-gray-600 flex flex-row justify-start gap-1'>
                        <Checkbox className='w-4 h-4 mr-2' checked={formData.acceptTerms} onCheckedChange={handleCheckboxChange}/>
                        <p className='text-xs text-gray-600'>
                            By creating your account, you agree to the processing of your personal data by LegalynX as described in the <Link href="/frontend/privacy-policy" className='cursor-pointer underline hover:text-blue-600'>Privacy Policy</Link>.
                        </p>
                        
                    </span>
                    <Button className='w-full cursor-pointer bg-blue-600 text-white' onClick={handleSubmit}>
                        Sign Up
                    </Button>


                    <span className='text-sm text-gray-600'>
                        <Link href="/frontend/login" className='cursor-pointer hover:text-blue-600'>
                            I already have an account
                        </Link>
                    </span>
                </div>  
            </div>

            <div className='hidden md:flex flex-col  items-center justify-center mr-40 w-full md:w-1/2 gap-2 relative'>
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

export default Register