import React from 'react'
import Header from '../../components/Header'
import { Button } from '@/components/ui/button'

function Verification() {
  return (
    <div>
        <Header />
        
        <main className='flex flex-col items-center justify-center'>
            <div className='flex flex-col border border-gray-300 rounded-lg p-8 w-md text-center gap-4 items-center my-50 justify-center'>
                <h1 className='text-3xl font-bold font-serif'>Verify Your Email</h1>
                <p className='text-gray-600 text-wrap'>We just sent a verification link to your email. Please check your email for a verification link</p>
                <span className='flex flex-row gap-4'>
                    <Button className='cursor-pointer' variant='outline'>Resend Verification</Button>
                    <Button className='cursor-pointer bg-blue-600 text-white'>Check Email</Button>
                </span>
               

            </div>
        </main>
    </div>
  )
}

export default Verification
