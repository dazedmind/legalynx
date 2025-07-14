import { Brain, Home, LogOut, Settings, User, Mail, Crown, Loader2 } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import avatar from '../img/user.png'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/lib/context/AuthContext'
import { profileService } from '../lib/api' // Import from your api file
import { UserProfile } from '../types/profile'
import { toast } from 'sonner'

export default function NavBar() {
    const { logout, user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    useEffect(() => {
        // Only load profile if user is authenticated
        if (user) {
            loadProfile();
        } else {
            setLoading(false);
        }
    }, [user]);

    const loadProfile = async () => {
        try {
            setLoading(true);
            const userProfile = await profileService.getProfile();
            setProfile(userProfile);
        } catch (error) {
            console.error('Failed to load profile:', error);
            // Don't show error toast in navbar - it's not critical
            setProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        setProfile(null); // Clear profile data on logout
    };

    // Get display name - fallback to email username if name not set
    const getDisplayName = () => {
        if (profile?.name) return profile.name;
        if (profile?.job_title) return profile.job_title;
        if (profile?.email) {
            // Extract username from email (part before @)
            return profile.email.split('@')[0];
        }
        return 'User';
    };

    // Get profile picture or avatar
    const getProfilePicture = () => {
        return profile?.profile_picture || avatar;
    };

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
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            <Image src={avatar} alt="profile" width={40} height={40} className='rounded-full cursor-pointer' />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='w-40'>
                            <DropdownMenuLabel className='flex items-center gap-2 text-md font-bold'>
                                <User className='w-4 h-4' />
                                {getDisplayName()}
                            </DropdownMenuLabel>
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
    )
}