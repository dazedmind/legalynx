'use client'
import React, { useEffect, useState } from 'react'
import { profileService } from '../lib/api'
import LoaderComponent from '../components/ui/LoaderComponent'
import { 
  Crown, 
  Zap, 
  Calendar, 
  CreditCard, 
  TrendingUp, 
  AlertCircle,
  Gift,
  RefreshCw,
  ExternalLink
} from 'lucide-react'
import { Progress } from "@/components/ui/progress"

function SubscriptionPage() {
    const [subscription, setSubscription] = useState('')
    const [isLoading, setIsLoading] = useState(true);
    const [tokensUsed, setTokensUsed] = useState(0);
    const [tokenLimit, setTokenLimit] = useState(0);
    const [billingDate, setBillingDate] = useState('');
    const [subscriptionDays, setSubscriptionDays] = useState(0);

    useEffect(() => {
        const fetchSubscription = async () => {
            try {
                const profile = await profileService.getProfile()
                setSubscription(profile.subscription?.plan_type?.toUpperCase() || '')
                setTokensUsed(profile.subscription?.tokens_used || 0)
                setTokenLimit(profile.subscription?.token_limit || 0)
                setBillingDate(profile.subscription?.billing_date || '')
                setSubscriptionDays(profile.subscription?.days_remaining || 0)
            } catch (error) {
                console.error('Failed to fetch subscription:', error)
            } finally {
                setIsLoading(false)
            }
        }
        fetchSubscription()
    }, [])


    const getSubscriptionColor = (plan: string) => {
        switch(plan) {
            case 'PREMIUM':
                return 'from-purple-500 to-indigo-700'
            case 'STANDARD':
                return 'from-blue-500 to-indigo-700'
            case 'BASIC':
                return 'from-gray-400 to-gray-600'
            default:
                return 'from-blue-500 to-indigo-700'
        }
    }

    const getSubscriptionIcon = (plan: string) => {
        switch(plan) {
            case 'PREMIUM':
                return <Crown className="w-5 h-5" />
            case 'STANDARD':
                return <Zap className="w-5 h-5" />
            default:
                return <Gift className="w-5 h-5" />
        }
    }

    const tokenPercentage = (tokensUsed / tokenLimit) * 100;
    const isNearLimit = tokenPercentage >= 80;
    const daysUntilBilling = Math.ceil((new Date(billingDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

    if (isLoading) {
        return <LoaderComponent />
    }

    return (
        <div>
            <span className='flex flex-col gap-1 p-6 px-8'>
                <h1 className='text-3xl font-bold font-serif'>Subscription</h1>
                <p className='text-sm text-muted-foreground'>Manage your subscription and preferences.</p>
            </span>        
            
            <section className='space-y-4 mb-8'>
                {/* Current Subscription Card */}
                <div className='p-4 rounded-md border flex flex-col gap-2 border-tertiary mx-8'>
                    <p className='text-sm text-muted-foreground'>Your current subscription is</p>
                    <div className='flex items-center justify-between'>
                        <span className={`w-fit font-bold text-2xl rounded-md p-3 bg-gradient-to-bl ${getSubscriptionColor(subscription)} text-white border border-tertiary flex items-center gap-2`}>
                            {getSubscriptionIcon(subscription)}
                            {subscription}
                        </span>
                        {subscription !== 'BASIC' && (
                            <div className='text-right'>
                                <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                                    <Calendar className='w-4 h-4' />
                                    {daysUntilBilling > 0 ? `${daysUntilBilling} days until renewal` : 'Renews today'}
                                </div>
                                <div className='text-xs text-muted-foreground mt-1'>
                                    Next billing: {new Date(billingDate).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                    <p className='text-sm text-muted-foreground'>
                        You are currently on the <span className='font-medium'>{subscription}</span> plan.
                        {subscription === 'BASIC' && (
                            <span className='text-blue-600'> Upgrade to unlock more features!</span>
                        )}
                    </p>
                </div>

                {/* Token Usage Card */}
                <div className='p-4 rounded-md border flex flex-col gap-3 border-tertiary mx-8'>
                    <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                            <Zap className='w-5 h-5 text-yellow-500' />
                            <h1 className='text-lg font-bold'>Tokens Used</h1>
                        </div>
                        <button className={`flex items-center gap-1 text-sm text-muted-foreground ${subscription === 'BASIC' || subscription === 'STANDARD' ? 'hidden' : ''} hover:text-gray-800 transition-colors cursor-pointer`}>
                            <RefreshCw className='w-4 h-4' />
                            Refresh
                        </button>
                    </div>
                    
                    <div className='flex items-center justify-between'>
                        <span className='flex items-baseline gap-2'>
                            <h1 className='text-3xl font-bold text-foreground'>
                                {typeof tokensUsed === 'number' ? tokensUsed.toLocaleString() : '--'}
                            </h1>
                            <span className='text-lg text-muted-foreground'>/ {typeof tokenLimit === 'number' ? tokenLimit.toLocaleString() : '--'}</span>
                        </span>
                        <div className='text-right'>
                            <div className='text-sm font-medium text-muted-foreground'>
                                {tokenPercentage.toFixed(1)}% used
                            </div>
                            <div className='text-xs text-muted-foreground'>
                                {/* {(tokenLimit - tokensUsed).toLocaleString()} remaining */}
                            </div>
                        </div>
                    </div>

                    <div className='space-y-2'>
                        <Progress value={tokenPercentage} className="h-2" />
                        {isNearLimit && (
                            <div className="flex items-center gap-2 p-2 bg-yellow/20 border border-amber-200 rounded text-foreground text-sm mt-4">
                                <AlertCircle className="w-4 h-4" />
                                {tokenPercentage === 100
                                    ? 'You\'ve reached your token limit! Consider upgrading your plan.'
                                    : tokenPercentage >= 95 
                                    ? 'You\'re almost out of tokens! Consider upgrading your plan.'
                                    : 'You\'re running low on tokens. Consider upgrading soon.'
                                }
                            </div>
                        )}
                    </div>
                </div>

                {/* Usage Statistics */}
                <div className='p-4 rounded-md border flex flex-col gap-3 border-tertiary mx-8'>
                    <div className='flex items-center gap-2'>
                        <TrendingUp className='w-5 h-5 text-yellow-500' />
                        <h1 className='text-lg font-bold'>Usage Statistics</h1>
                    </div>
                    
                    <div className='grid grid-cols-2 gap-4'>
                        <div className='text-center p-3 border border-tertiary rounded'>
                            <div className='text-2xl font-bold text-blue-600'>47</div>
                            <div className='text-xs text-muted-foreground'>Documents</div>
                        </div>
                        <div className='text-center p-3 border border-tertiary rounded'>
                            <div className='text-2xl font-bold text-yellow'>127</div>
                            <div className='text-xs text-muted-foreground'>Chat Sessions</div>
                        </div>
                    </div>
                </div>

                {/* Billing Information */}
                {billingDate !== '' && (
                    <div className='p-4 rounded-md border flex flex-col gap-3 border-tertiary mx-8'>
                        <div className='flex items-center gap-2'>
                            <h1 className='text-lg font-bold'>Billing Information</h1>
                            <CreditCard className='w-5 h-5 text-muted-foreground' />
                        </div>
                        
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            <div className='space-y-2'>
                                <div className='text-sm text-muted-foreground'>Payment Method</div>
                                <div className='flex items-center gap-2'>
                                    <div className='w-8 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold'>
                                        VISA
                                    </div>
                                    <span className='text-sm'>•••• •••• •••• 4242</span>
                                </div>
                            </div>
                            <div className='space-y-2'>
                                <div className='text-sm text-muted-foreground'>Next Billing Date</div>
                                <div className='text-sm font-medium'>
                                    {new Date(billingDate).toLocaleDateString('en-US', { 
                                        year: 'numeric', 
                                        month: 'long', 
                                        day: 'numeric' 
                                    })}
                                </div>
                            </div>
                        </div>
                        
                        <div className='flex gap-2 pt-2 border-t border-tertiary'>
                            <button className='flex items-center gap-2 px-3 py-2 text-sm border border-tertiary rounded hover:bg-accent transition-colors'>
                                <CreditCard className='w-4 h-4' />
                                Update Payment
                            </button>
                            <button className='flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors'>
                                <ExternalLink className='w-4 h-4' />
                                View Invoices
                            </button>
                        </div>
                    </div>
                )}

                {/* Plan Comparison / Upgrade */}
                <div className='p-4 rounded-md border flex flex-col gap-3 border-tertiary mx-8'>
                    <h1 className='text-lg font-bold'>Available Plans</h1>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div className={`p-4 border rounded-lg ${subscription === 'BASIC' ? 'border-blue-500 bg-blue/20' : 'border-tertiary'}`}>
                            <div className='flex items-center gap-2 mb-2'>
                                <Gift className='w-5 h-5 text-muted-foreground' />
                                <span className='font-medium'>Basic</span>
                                {subscription === 'BASIC' && (
                                    <span className='text-xs bg-blue-600 text-white px-2 py-1 rounded'>Current</span>
                                )}
                            </div>
                            <div className='text-2xl font-bold mb-2'>$0<span className='text-sm text-muted-foreground'>/month</span></div>
                            <div className='text-sm text-muted-foreground space-y-1'>
                                <div>• 1,000 tokens/month</div>
                                <div>• Basic features</div>
                                <div>• Community support</div>
                            </div>
                        </div>
                        
                        <div className={`p-4 border rounded-lg ${subscription === 'STANDARD' ? 'border-blue-500 bg-blue/20' : 'border-tertiary'}`}>
                            <div className='flex items-center gap-2 mb-2'>
                                <Zap className='w-5 h-5 text-blue-600' />
                                <span className='font-medium'>Standard</span>
                                {subscription === 'STANDARD' && (
                                    <span className='text-xs bg-purple-600 text-white px-2 py-1 rounded'>Current</span>
                                )}
                            </div>
                            <div className='text-2xl font-bold mb-2'>₱149<span className='text-sm text-muted-foreground'>/month</span></div>
                            <div className='text-sm text-muted-foreground space-y-1'>
                                <div>• 10,000 tokens/month</div>
                                <div>• Access to Chat History</div>
                                <div>• Save Chat Sessions</div>
                            </div>
                            {subscription !== 'STANDARD' && (
                                <button className='w-full mt-3 px-3 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors cursor-pointer'>
                                    Upgrade to Standard
                                </button>
                            )}
                        </div>
                        
                        <div className={`p-4 border rounded-lg ${subscription === 'PREMIUM' ? 'border-blue-500 bg-blue/20' : 'border-tertiary'}`}>
                            <div className='flex items-center gap-2 mb-2'>
                                <Crown className='w-5 h-5 text-yellow-600' />
                                <span className='font-medium'>Premium</span>
                                {subscription === 'PREMIUM' && (
                                    <span className='text-xs bg-gray-800 text-white px-2 py-1 rounded'>Current</span>
                                )}
                            </div>
                            <div className='text-2xl font-bold mb-2'>₱249<span className='text-sm text-muted-foreground'>/month</span></div>
                            <div className='text-sm text-muted-foreground space-y-1'>
                                <div>• Unlimited tokens</div>
                                <div>• All features</div>
                                <div>• Dedicated support</div>
                            </div>
                            {subscription !== 'PREMIUM' && (
                                <button className='w-full mt-3 px-3 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-900 transition-colors cursor-pointer'>
                                    Upgrade to Premium
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}

export default SubscriptionPage