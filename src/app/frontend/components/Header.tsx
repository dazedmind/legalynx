'use client'
import { ChevronDown, Menu, X } from 'lucide-react'
import React, { useState } from 'react'
import Link from 'next/link'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import Image from 'next/image'
import logo from '../img/legalynxlogo.png'
import { GoLaw } from 'react-icons/go'
import { PiNetwork, PiSuitcaseSimple } from 'react-icons/pi'
import ThemeToggle from './ThemeToggle'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
      <div className="flex items-center justify-between ">
        {/* Logo Section */}
        <div className="flex items-center space-x-1">
          <Image src={logo} alt="LegalynX" width={60} height={60} />
          <div>
            <Link href="/">
              <h1 className="text-2xl font-bold font-serif text-foreground">LegalynX</h1>
            </Link>
          </div>
        </div>

        {/* Desktop Navigation */}
        <div className="flex items-center space-x-2">
          <div className="hidden md:flex items-center space-x-8 text-sm text-muted-foreground">
            <Link href="/frontend/pricing">
              <div className="hover:text-foreground transition-colors cursor-pointer">
                Pricing
              </div>  
            </Link>
              

            <Link href="/frontend/login">
              <button className='cursor-pointer bg-gradient-to-tr from-yellow-500 to-yellow-300 hover:brightness-110 transition-all duration-300 text-white font-bold px-4 py-2 rounded-md'>
                Sign In
              </button>
            </Link>
            
            <ThemeToggle />
          </div>

          {/* Mobile Menu Button and Theme Toggle */}
          <div className="md:hidden flex items-center space-x-2">
            <ThemeToggle />
            <button
              onClick={toggleMobileMenu}
              className="p-2 rounded-lg hover:bg-accent transition-colors"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Slide-out Panel */}
      <div className={`
        md:hidden fixed top-0 right-0  w-full bg-primary border-l border-accent -z-10
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? '-translate-y-0 shadow-2xl' : '-translate-y-full'}
      `}>


        {/* Mobile Menu Content */}
        <div className="flex flex-col mt-12 p-6 space-y-6 h-full bg-primary">
          {/* Navigation Links */}
          <div className="space-y-4">
            {/* Pricing Link */}
            <Link href="/frontend/pricing" onClick={closeMobileMenu}>
              <div className="flex items-center gap-3 p-4 rounded-lg hover:bg-accent transition-colors cursor-pointer">
                <span className="text-lg font-medium text-muted-foreground">Pricing</span>
              </div>
            </Link>
          </div>

          {/* Sign In Button - Pushed to bottom */}
          <div className="mt-auto">
            <Link href="/frontend/login" onClick={closeMobileMenu}>
              <button className='w-full bg-gradient-to-tr from-yellow-500 to-yellow-300 hover:brightness-110 transition-all duration-300 text-white font-bold px-6 py-4 rounded-lg text-lg'>
                Sign In
              </button>
            </Link>
            
            {/* Additional Links */}
            <div className="mt-4 space-y-2 text-center">
              <Link href="/frontend/register" onClick={closeMobileMenu}>
                <p className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                  Don't have an account? Sign up
                </p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>    
  )
}

export default Header