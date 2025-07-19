import React from 'react'
import Header from '../components/Header'
import { CheckCircle } from 'lucide-react'
import { GoCheck } from 'react-icons/go'
import TierComponent from '../components/TierComponent'
import SpotlightCard from '../components/reactbits/SpotlightCard'
import BlurText from '../components/reactbits/BlurText'

function Pricing() {
  return (
    <div className=' bg-secondary'>
        <header className="bg-white shadow-sm border-b">
            <Header />
        </header>

        <div className='flex flex-col gap-6 items-center justify-center h-full'>  
            <div className='mt-15'>
                <BlurText
                    text="Power Up Your Legal Workflow"
                    className="text-3xl md:text-4xl font-bold font-serif mb-4 text-wrap text-center px-10"
                    delay={150}
                />
            </div>
          
            <div className='flex flex-col md:flex-row items-center justify-center md:justify-start gap-6 mb-10'>
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