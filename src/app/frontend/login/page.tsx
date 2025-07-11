import React from 'react'
import Header from '../components/Header'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

function Login() {
  return (
    <div>
        <header className='bg-white shadow-sm border-b'>
            <Header />
        </header>

        <main className='flex flex-row  w-full'>
            <div className='flex flex-col  items-start mx-40 w-1/2 px-10 py-20 justify-center my-10 gap-2'>
                <h1 className='text-4xl font-bold'>Sign In</h1>
                <p className='text-gray-600'>Welcome back to LegalynX</p>
                <div className='flex flex-col items-start justify-center gap-4 w-2/3'>
                    <Input type='email' placeholder='Email' />
                    <Input type='password' placeholder='Password' />

                    <span className='text-sm text-gray-600'>
                        Forgot Password?
                    </span>
                    <Button className='w-full cursor-pointer bg-blue-600 text-white'>Sign In</Button>

                    <span className='flex flex-row items-center justify-center gap-2 w-full'>
                        <div className='w-full h-px bg-gray-200 my-4'></div>
                        <p className='text-sm text-gray-600'>or</p>
                        <div className='w-full h-px bg-gray-200 my-4'></div>
                    </span>

                    <Button className='w-full cursor-pointer'>Sign In with Google</Button>
           

                    <span className='text-sm text-gray-600'>
                        I don't have an account yet
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