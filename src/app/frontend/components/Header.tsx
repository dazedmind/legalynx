import { Brain, ChevronDown, FileText, Zap } from 'lucide-react'
import React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import Image from 'next/image'
import logo from '../img/legalynxlogo.png'
import { GoLaw } from 'react-icons/go'
import { PiNetwork, PiSuitcaseSimple } from 'react-icons/pi'

function Header() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-1">
          <Image src={logo} alt="LegalynX" width={60} height={60} />
        <div>
            <Link href="/">
                <h1 className="text-2xl font-bold text-gray-900">LegalynX</h1>
            </Link>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="hidden md:flex items-center space-x-10 text-sm text-gray-600">
          <Link href="/frontend/pricing">
            <div>
              Pricing
            </div>  
          </Link>
            
            <HoverCard>
              <HoverCardTrigger className='cursor-pointer flex items-center gap-1'>Solutions <ChevronDown className='w-4 h-4' /></HoverCardTrigger>
              <HoverCardContent align='end' className='flex flex-col gap-2 text-sm'>
                <div className='flex items-center gap-2 '>
                  <span className='p-2 bg-accent rounded-md'>
                  <PiSuitcaseSimple className='w-4 h-4' />
                  </span>
                  <p>Paralegals</p>
                </div>

                <div className='flex items-center gap-2 '>
                  <span className='p-2 bg-accent rounded-md'>
                  <PiNetwork className='w-4 h-4' />

                  </span>
                  <p>Social Media Managers</p>
                </div>

                <div className='flex items-center gap-2 '>
                  <span className='p-2 bg-accent rounded-md'>
                  <GoLaw className='w-4 h-4' />
                  </span>
                  <p>Lawyers</p>
                </div>

              </HoverCardContent>
            </HoverCard>
          <Link href="/frontend/login">
            <button className='cursor-pointer bg-yellow text-white px-4 py-2 rounded-md'>Sign In</button>
          </Link>
        </div>
      </div>
    </div>
  </div>    
  )
}

export default Header