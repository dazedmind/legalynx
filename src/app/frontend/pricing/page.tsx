import React from 'react'
import Header from '../components/Header'
import { CheckCircle } from 'lucide-react'
import { GoCheck } from 'react-icons/go'
import TierComponent from '../components/TierComponent'
import SpotlightCard from '../components/reactbits/SpotlightCard'
import BlurText from '../components/reactbits/BlurText'

function Pricing() {
  return (
    <div className='min-h-screen bg-secondary'>
        <header className="bg-white shadow-sm border-b">
            <Header />
        </header>

        <div className='flex flex-col gap-6 items-center my-15 justify-center h-full'>  
            {/* <h1 className='text-4xl font-bold font-serif mb-4'>Power Up Your Legal Workflow</h1> */}
            <BlurText
                text="Power Up Your Legal Workflow"
                className="text-4xl font-bold font-serif mb-4"
                delay={150}

            />
            <div className='flex items-start justify-start gap-6'>
                <TierComponent 
                    tierName="Basic" 
                    tierPrice="Free" 
                    tierFeatures={["Upload documents", "Chat with Lynx AI", "Limited Queries per session", "100 messages"]} 
                />

                <TierComponent 
                    tierName="Standard" 
                    tierPrice="P 129.00/month" 
                    tierFeatures={["Upload documents", "Chat with Lynx AI", "Extended Limit per session", "Access to Chat History", "up to 300 messages"]} 
                />

                <TierComponent 
                    tierName="Premium" 
                    tierPrice="P 249.00/month" 
                    tierFeatures={["Upload documents", "Chat with Lynx AI", "Unlimited per session", "Access to Chat History", "Voice Assistant option", "Priority Support"]} 
                />

            </div>

 
        </div>
    </div>
  )
}

export default Pricing