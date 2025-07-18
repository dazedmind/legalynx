'use client'
import React, { useEffect, useState } from 'react'
import { profileService } from '../lib/api'
import LoaderComponent from '../components/ui/LoaderComponent'

function SubscriptionPage() {
    const [subscription, setSubscription] = useState('')
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSubscription = async () => {
            const subscription = await profileService.getProfile()
            setSubscription(subscription.subscription_status)
            setIsLoading(false)
        }
        fetchSubscription()
    }, [])

    if (isLoading) {
        return <LoaderComponent />
    }
  return (
    <div>
        <span className='flex flex-col gap-1 p-6 px-8'>
            <h1 className='text-3xl font-bold font-serif'>Subscription</h1>
            <p className='text-sm text-gray-500'>Manage your subscription and preferences.</p>
        </span>        
        <section className='space-y-4'>
            <div className='p-4 rounded-md border flex flex-col gap-2 border-gray-200 mx-8'>
                <p className='text-sm text-gray-500'>Your current subscription is</p>
                <span className='w-fit font-bold text-2xl rounded-md p-2 bg-gradient-to-bl from-blue-500 to-indigo-700 text-white border border-gray-300'>
                    {subscription}
                </span>
                <p className='text-sm text-gray-500'>
                    You are currently on the {subscription} plan.
                </p>
            </div>
            <div className='p-4 rounded-md border flex flex-col gap-2 border-gray-200 mx-8'>
                <h1 className='text-lg font-bold'>Tokens Used</h1>
                <div>
                    <span>
                        <h1 className='text-2xl'>100</h1>
                    </span>
                </div>
            </div>
        </section>
    </div>
  )
}

export default SubscriptionPage