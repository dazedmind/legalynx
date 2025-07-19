'use client'
import React, { useState } from 'react'
import { Switch } from '@/components/ui/switch'
import InputField from '../components/ui/InputField'
import Image from 'next/image'
import qrCode from '../img/frame.png'

function PrivacySecuritySettings() {

    const [isAuthTrue, setIsAuthTrue] = useState(false)

    const handleSwitchChange = () => {
        setIsAuthTrue(!isAuthTrue)
    }
  return (
    <div>
        <span className='flex flex-col gap-1 p-6 px-8'>
            <h1 className='text-3xl font-bold font-serif'>Privacy & Security</h1>
            <p className='text-sm text-gray-500'>Manage your privacy and security settings.</p>
        </span>

        <section className='space-y-4'>
            <div className='p-4 rounded-md border flex justify-between items-center gap-1 border-gray-200 mx-8'>
                <span>
                    <h1 className='text-lg font-bold'>Two-Factor Authentication</h1>
                    <p className='text-sm text-gray-500'>Enable or disable two-factor authentication for your account.</p>
                </span>
               
                <div className='flex flex-row gap-2'>
                    <Switch 
                    //  checked={true}
                     onCheckedChange={handleSwitchChange}
                     className='cursor-pointer'
                     />
                </div>
            </div>

            {isAuthTrue && (
                <div className='p-4 rounded-md border flex flex-col gap-1 border-gray-200 mx-8'>
                     <span>
                         <h1 className='text-lg font-bold'>Set Up Two-Factor Authentication</h1>
                         <p className='text-sm text-gray-500'>Scan the QR code with your authenticator app to set up two-factor authentication or enter the code manually.</p>
                     </span>
                     <div>
                        <Image src={qrCode} alt="QR Code" width={200} height={200} />
                     </div>
                    
                     <div className='flex flex-row gap-2 items-center'>
                         <InputField
                              label=""
                              type="text"
                              id="code"
                              name="code"
                              className='w-auto p-2 border border-gray-300 rounded-md text-sm'
                              placeholder='Enter the code'
                              value={''}
                              onChange={() => { } } 
                         />
                         <button className='bg-yellow text-white p-2 px-4 rounded-md cursor-pointer'>
                            Submit
                         </button>
                     </div>
                 </div>
            )}
        </section>
    </div>
  )
}

export default PrivacySecuritySettings