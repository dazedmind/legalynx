import { Brain, Home, LogOut, Settings, User } from 'lucide-react'
import React from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import avatar from '../img/user.png'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/lib/context/AuthContext'

export default function NavBar() {
    const { logout } = useAuth();
  return (
    <div className="px-8 py-4">
        <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
            <div className="bg-blue-600 p-2 rounded-lg">
            <Brain className="w-8 h-8 text-white" />
            </div>
            <div>
            <Link href="/frontend/home">
                <h1 className="text-2xl font-bold text-gray-900">LegalynX</h1>
            </Link>
            </div>
        </div>
        <div className="flex items-center space-x-4">
            <div className="hidden md:flex items-center space-x-6 text-sm text-gray-600">
            <DropdownMenu>
                <DropdownMenuTrigger>
                    <Image src={avatar} alt="profile" width={40} height={40} className='rounded-full cursor-pointer' />
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-40'>
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <Link href="/frontend/home" className='cursor-pointer'>
                        <DropdownMenuItem className='cursor-pointer'>
                            <Home className='w-4 h-4 ' />
                            Home
                        </DropdownMenuItem>
                    </Link>
                    <Link href="/frontend/settings" className='cursor-pointer'>
                        <DropdownMenuItem className='cursor-pointer'>
                            <Settings className='w-4 h-4 ' />
                            Settings
                        </DropdownMenuItem>
                    </Link>
                    <DropdownMenuSeparator />
                    <Link href="/" onClick={logout}>
                        <DropdownMenuItem className='cursor-pointer'>
                            <LogOut className='w-4 h-4 ' />
                            Logout
                        </DropdownMenuItem>
                    </Link>
                </DropdownMenuContent>
            </DropdownMenu>            
            </div>
        </div>
        </div>
  </div>
  )
}
