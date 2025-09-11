"use client"
import React, { useState } from 'react'
import Header from '../components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { Checkbox } from '@/components/ui/checkbox'
import { toast , Toaster } from 'sonner'
import { useRouter, useSearchParams } from 'next/navigation'
import logo from '../img/legalynxlogo.png'
import Image from 'next/image'
import { Loader2 } from 'lucide-react'


function Register() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const returnUrl = searchParams.get('returnUrl')
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        confirmPassword: '',
        acceptTerms: false
        })
    
    const calculatePasswordStrength = (password: string) => {
        if (!password) return { strength: 0, label: '', color: '' }
        
        let score = 0
        
        // Length check
        if (password.length >= 8) score += 1
        if (password.length >= 12) score += 1
        
        // Character variety checks
        if (/[a-z]/.test(password)) score += 1
        if (/[A-Z]/.test(password)) score += 1
        if (/[0-9]/.test(password)) score += 1
        if (/[^A-Za-z0-9]/.test(password)) score += 1
        
        // Determine strength level
        if (score <= 2) {
            return { strength: (score / 6) * 100, label: 'Weak', color: 'bg-red-500' }
        } else if (score <= 4) {
            return { strength: (score / 6) * 100, label: 'Medium', color: 'bg-yellow-500' }
        } else if (score <= 5) {
            return { strength: (score / 6) * 100, label: 'Strong', color: 'bg-green-400' }
        } else {
            return { strength: (score / 6) * 100, label: 'Very Strong', color: 'bg-green-500' }
        }
    }
    
    const passwordStrength = calculatePasswordStrength(formData.password)
    
    const validatePassword = (password: string) => {
        if (formData.password !== formData.confirmPassword) {
            return false
        }
        return true
    }

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
        if (formData.password.length < 8) {
            toast.error('Password must be at least 8 characters long')
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
        setIsLoading(true);
        if (!validateForm()) {
            setIsLoading(false);
            return
        }

        try {
            // Store form data and return URL in sessionStorage for later use
            sessionStorage.setItem('registrationData', JSON.stringify({
                email: formData.email,
                password: formData.password,
                returnUrl: returnUrl
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
        } finally {
            setIsLoading(false);
        }
    };

  return (
    <div className='h-screen overflow-hidden'>
        {/* Header */}
        <header className="bg-primary backdrop-blur-md shadow-sm border-b sticky top-0 z-50">
            <Header />
        </header>

        <main className='flex flex-col md:flex-row-reverse w-full h-[calc(100vh-var(--header-height,64px))]'>
            <div className='flex flex-col items-center md:items-start mx-0 w-full md:w-1/2 px-10 py-20 md:py-10 justify-center gap-2 overflow-y-auto'>
                <div className='w-full flex flex-col items-start md:pl-20 gap-2'>
                    <span>
                        <h1 className='text-4xl font-bold font-serif'>Sign Up</h1>
                        <p className='text-muted-foreground mb-4'>Create your account to get started</p>

                    </span>

                <div className='flex flex-col items-start justify-center gap-4 w-full md:not-first:w-2/3'>
                    <span className='flex flex-col items-start gap-2 justify-start w-full'>
                        <p className='text-sm text-muted-foreground'>Email address</p>
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
                        <p className='text-sm text-muted-foreground'>Password</p>
                        <Input type='password' name='password' placeholder='Enter your password' value={formData.password} onChange={handleChange} />
                        {formData.password && (
                            <div className='w-full space-y-2'>
                                <div className='relative w-full h-2 bg-accent rounded-full overflow-hidden'>
                                    <div 
                                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                                        style={{ width: `${passwordStrength.strength}%` }}
                                    />
                                </div>
                                <div className='flex justify-between items-center'>
                                    <span className={`text-xs font-medium ${
                                        passwordStrength.label === 'Weak' ? 'text-red-500' :
                                        passwordStrength.label === 'Medium' ? 'text-yellow-600' :
                                        passwordStrength.label === 'Strong' ? 'text-green-400' :
                                        'text-green-500'
                                    }`}>
                                        {passwordStrength.label}
                                    </span>
                                </div>
                            </div>
                        )}
                    </span>

                    <span className='flex flex-col items-start gap-2 justify-start w-full'>
                        <p className='text-sm text-muted-foreground'>Confirm Password</p>
                        <Input type='password' name='confirmPassword' placeholder='Confirm your password' value={formData.confirmPassword} onChange={handleChange}/>
                        {formData.confirmPassword && !validatePassword(formData.confirmPassword) && (
                            <p className='text-destructive text-xs'>Passwords do not match</p>
                        )}
                    </span>
           

                    <span className='text-sm text-muted-foreground flex flex-row justify-start gap-1'>
                        <Checkbox className='w-4 h-4 mr-2' checked={formData.acceptTerms} onCheckedChange={handleCheckboxChange}/>
                        <p className='text-xs text-muted-foreground'>
                            By creating your account, you agree to the processing of your personal data by LegalynX as described in the <Link href="/frontend/privacy-policy" className='cursor-pointer underline text-blue-600 hover:text-blue-600'>Privacy Policy</Link>.
                        </p>
                        
                    </span>
                    <Button className='w-full cursor-pointer bg-blue-600 text-white' onClick={handleSubmit} disabled={isLoading}>
                        {isLoading ? <Loader2 className='w-4 h-4 animate-spin' /> : 'Sign Up'}
                    </Button>


                    <span className='text-sm text-muted-foreground'>
                        <Link href="/frontend/login" className='cursor-pointer hover:text-blue-600'>
                            I already have an account
                        </Link>
                    </span>
                </div>  
                </div>
               
            </div>

            <div className='hidden md:flex flex-col bg-gradient-to-bl from-blue/0 to-blue/20 border-l border-tertiary shadow-md border items-center justify-center h-full w-full md:w-1/2 gap-2 relative'>
                <Image
                    src={logo}
                    alt="Login"
                    width={600}
                    height={500}
                    className="fade-gradient"
                />
                <p className='text-2xl mx-auto text-center absolute bottom-20 text-muted-foreground'>Linking you to legal clarity</p>

            </div>
        </main>
        <Toaster />
    </div>
  )
}

export default Register