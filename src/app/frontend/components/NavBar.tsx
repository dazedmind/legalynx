import { LogOut, Settings } from 'lucide-react'
import React, { useEffect, useState } from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import avatar from '../img/user.png'
import Image from 'next/image'
import Link from 'next/link'
import { useAuth } from '@/lib/context/AuthContext'
import { profileService } from '../lib/api'
import { UserProfile } from '../types/profile'
import { GoGift } from 'react-icons/go'
import logo from '../img/legalynxlogo.png'

export default function NavBar() {
    const { logout, user } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        if (user) {
            loadProfile();
        }
    }, [user]);

    const loadProfile = async () => {
        if (!user) return;
        
        try {
            setLoading(true);
            setError(''); // Clear any previous errors
            
            console.log('🔄 NavBar: Starting profile load for user:', user.email);
            
            const userProfile = await profileService.getProfile();
            
            console.log('✅ NavBar: Profile loaded successfully:', {
                id: userProfile.id,
                email: userProfile.email,
                name: userProfile.name,
                subscription_status: userProfile.subscription_status
            });
            
            setProfile(userProfile);
            setError(''); // Explicitly clear error on success
            
        } catch (error) {
            console.error('❌ NavBar: Profile load failed:', error);
            
            // Set a specific error message
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setError(errorMessage);
            
            // Don't set profile to null if we already have it - keep showing the cached data
            // setProfile(null);
            
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => {
        logout();
        setProfile(null);
        setError('');
    };

    // Simple display name logic
    const getDisplayName = () => {
        if (loading) return 'Loading...';
        
        // Try profile first, then fallback to auth user, then default
        if (profile?.name) return profile.name;
        if (profile?.email) return profile.email.split('@')[0];
        if (user?.email) return user.email.split('@')[0];
        return 'User';
    };

    const getSubscriptionStatus = () => {
        if (profile?.subscription_status === 'PREMIUM') return 'Premium';
        if (profile?.subscription_status === 'STANDARD') return 'Standard';
        if (profile?.subscription_status === 'BASIC') return 'Basic';
    };

    const getProfilePicture = () => {
        return profile?.profile_picture || avatar;
    };

    const getInitials = () => {
        if (profile?.name) {
            const names = profile.name.trim().split(' ');
            if (names.length === 1) return names[0][0]?.toUpperCase() || '';
            return (names[0][0] + names[names.length - 1][0]).toUpperCase();
        }
        if (profile?.email) return profile.email[0]?.toUpperCase() || '';
        if (user?.email) return user.email[0]?.toUpperCase() || '';
    };

    // Debug: Log current state
    useEffect(() => {
        console.log('🔍 NavBar State:', {
            hasUser: !!user,
            hasProfile: !!profile,
            loading,
            error,
            displayName: getDisplayName()
        });
    }, [user, profile, loading, error]);

    return (
        <div className="px-0 md:px-8 py-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1">
                    <Image src={logo} alt="LegalynX" width={60} height={60} />

                    <div>
                        <Link href="/frontend/home">
                            <h1 className="text-2xl font-bold font-serif text-gray-900">LegalynX</h1>
                        </Link>
                    </div>
                </div>
                
                <div className="flex items-center space-x-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger>
                            {profile?.profile_picture && (
                            <Image 
                                src={getProfilePicture()} 
                                alt="profile" 
                                width={40} 
                                height={40} 
                                className='rounded-full cursor-pointer' 
                            />
                            )}
                            {!profile?.profile_picture && (
                                <div className=' cursor-pointer w-10 h-10 rounded-full bg-gradient-to-bl from-blue-700 to-blue-300 flex items-center justify-center text-white text-lg'>
                                    {getInitials()}
                                </div>
                            )}
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end' className='w-56'>
                            <DropdownMenuLabel className='flex items-center gap-2 text-md font-bold'>
                                    {profile?.profile_picture && (
                                    <Image 
                                        src={getProfilePicture()} 
                                        alt="profile" 
                                        width={40} 
                                        height={40} 
                                        className='rounded-full cursor-pointer' 
                                    />
                                    )}
                                    {!profile?.profile_picture && (
                                        <div className=' cursor-pointer w-10 h-10 rounded-full bg-gradient-to-bl from-blue-700 to-blue-300 flex items-center justify-center text-white text-lg'>
                                            {getInitials()}
                                        </div>
                                    )}                                    
                                    <span className='flex flex-col'>
                                        {getDisplayName()}

                                        <p className='border border-gray-300 rounded-md px-1 py-1 text-xs text-gray-500 w-fit'>
                                            {getSubscriptionStatus()}
                                        </p>
                                    </span>
                            </DropdownMenuLabel>
                            
                            <DropdownMenuSeparator />
                     
                            <Link href="/frontend/subscription" className='cursor-pointer'>
                                <DropdownMenuItem className='cursor-pointer p-2 px-3'>
                                    <GoGift className='w-4 h-4' />
                                    Manage Subscription
                                </DropdownMenuItem>
                            </Link>
                            <Link href="/frontend/settings" className='cursor-pointer'>
                                <DropdownMenuItem className='cursor-pointer p-2 px-3'>
                                    <Settings className='w-4 h-4' />
                                    Settings
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={handleLogout} className='cursor-pointer p-2 px-3'>
                                <LogOut className='w-4 h-4' />
                                Logout
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>                     
                </div>
            </div>
        </div>
    )
}