import React from 'react'
import { GoCheck } from 'react-icons/go'
import SpotlightCard from './reactbits/SpotlightCard'
import Link from 'next/link'

const tierColor: Record<string, string> = {
  "Basic": "bg-blue-500/5 border-blue-500",
  "Standard": "bg-blue-500/15 border-blue-500",
  "Premium": "bg-gradient-to-br from-blue-500/20 to-blue-500/80 border-blue-500",
}

function TierComponent({ tierName, tierPrice, tierFeatures }: { tierName: string, tierPrice: string, tierFeatures: string[] }) {
  return (
    <SpotlightCard className={`custom-spotlight-card flex flex-col h-110 md:h-100 w-10/11 md:w-5/6 justify-start items-center border ${tierColor[tierName]} rounded-lg p-10`} spotlightColor="rgba(18, 96, 156, 0.8)">

    {/* <div className={`relative flex flex-col items-center h-100 w-5/6 justify-start border ${tierColor[tierName]} rounded-lg p-10`}> */}
      <h1 className="text-3xl font-bold">{tierName}</h1>
      <p className='text-lg text-neutral-600 mb-4'>{tierPrice}</p>

      <span className='flex flex-col items-start justify-center gap-3'>
          {tierFeatures.map((feature, index) => (
              <p key={index} className='flex text-sm items-center gap-2'><GoCheck className='w-4 h-4' /> {feature}</p>
          ))}
      </span>

      <Link href="/frontend/login" className='absolute bottom-5 cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md'>
          Get Started
      </Link>
    {/* </div> */}
    </SpotlightCard>
  )
}

export default TierComponent