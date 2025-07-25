'use client'
import React, { useEffect, useState } from 'react'
import InputField from '../components/ui/InputField'
import Image from 'next/image'
import avatar from '../img/user.png'
import { profileService } from '../lib/api'
import LoaderComponent from '../components/ui/LoaderComponent'
import { Save } from 'lucide-react'
import { toast, Toaster } from 'sonner'

function ProfileSettings() {
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [jobTitle, setJobTitle] = useState('')
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmNewPassword, setConfirmNewPassword] = useState('')
    const [isLoading, setIsLoading] = useState(true)
    const [changes, setChanges] = useState(false)
    
    const formData = {
        name: name,
        email: email,
        job_title: jobTitle,
        current_password: currentPassword,
        new_password: newPassword,
    }

    useEffect(() => {
        const fetchProfile = async () => {
            const user = await profileService.getProfile()
            setName(user.name)
            setEmail(user.email)
            setJobTitle(user.job_title || '')
            setIsLoading(false)
        }
        fetchProfile()
    }, [])

    if (isLoading) {
        return <LoaderComponent />
    }

    
    const handleSaveProfile = async () => {
        try {
            const response = await profileService.updateProfile(formData)
            toast.success('Profile updated successfully')
        } catch (error) {
            toast.error('Failed to update profile')
        }

    }

    return (
    <div className='flex flex-col gap-1 overflow-y-auto'>
        <span className='flex flex-col gap-1 p-6 px-8'>
            <h1 className='text-3xl font-bold font-serif'>Profile Settings</h1>
            <p className='text-sm text-gray-500'>Manage your profile information and settings.</p>
        </span>
    
        <section className='flex flex-col-reverse md:flex-row space-x-50 px-2 md:px-10 h-full overflow-y-auto overflow-x-hidden'>
         
            <div className='w-full md:w-auto flex flex-col mt-6 md:mt-0'>
                <InputField 
                    label="Name" 
                    type="text" 
                    id="name" 
                    name="name" 
                    className="w-auto p-2 border border-gray-300 rounded-md text-sm" 
                    placeholder='Enter your name'
                    onChange={(e) => {
                        setName(e.target.value)
                        setChanges(true)
                    }}
                    value={name}
                />
                <InputField 
                    label="Email" 
                    type="text" 
                    id="email" 
                    name="email" 
                    className="w-auto p-2 border border-gray-300 rounded-md text-sm" 
                    placeholder='Enter your email'
                    onChange={(e) => {
                        setEmail(e.target.value)
                        setChanges(true)
                    }}
                    value={email}
                />
                <InputField 
                    label="Job Title" 
                    type="text" 
                    id="job_title" 
                    name="job_title" 
                    className="w-auto p-2 border border-gray-300 rounded-md text-sm" 
                    placeholder='Lawyer, Paralegal, etc.'
                    onChange={(e) => {
                        setJobTitle(e.target.value)
                        setChanges(true)
                    }}
                    value={jobTitle}
                />
                <InputField 
                    label="Current Password" 
                    type="password" 
                    id="current_password" 
                    name="current_password" 
                    className="w-auto p-2 border border-gray-300 rounded-md text-sm" 
                    placeholder='Enter your current password'
                    onChange={(e) => {
                        setCurrentPassword(e.target.value)
                        setChanges(true)
                    }}
                    value={currentPassword}
                />
                <InputField 
                    label="New Password" 
                    type="password" 
                    id="new_password" 
                    name="new_password" 
                    className="w-auto p-2 border border-gray-300 rounded-md text-sm" 
                    placeholder='Enter new password'
                    onChange={(e) => {
                        setNewPassword(e.target.value)
                        setChanges(true)
                    }}
                    value={newPassword}
                />
            
                <InputField 
                    label="Confirm New Password" 
                    type="password" 
                    id="confirm_new_password" 
                    name="confirm_new_password" 
                    className="w-auto p-2 border border-gray-300 rounded-md text-sm" 
                    placeholder='Confirm new password'
                    onChange={(e) => {
                        setConfirmNewPassword(e.target.value)
                        setChanges(true)
                    }}
                    value={confirmNewPassword}
                />

                {changes && (
                    <button onClick={handleSaveProfile} className='block md:hidden w-fit p-2 m-2 border bg-gradient-to-bl from-blue-500 to-blue-800 text-white rounded-md text-sm cursor-pointer'>
                        <span className='flex items-center gap-2'>
                            <Save className='w-4 h-4' />
                            Save Changes
                        </span>
                    </button>
                )}
            </div>   

            <div className='flex flex-col justify-between'>
                <div className='flex flex-col items-center gap-4'>
                    <Image 
                    src={avatar} 
                    alt="Profile" 
                    width={100} 
                    height={100} 
                    className='w-30 h-30 rounded-full'
                    />
                    <span>
                        <p className='text-sm text-blue-500'>Set your profile picture</p>
                        <p className='text-xs text-gray-500'>JPG, PNG, or GIF, max 1MB</p>
                    </span>
                   
                </div>
                <div className='flex flex-col justify-end'>
                    {changes && (
                        <button onClick={handleSaveProfile} className='hidden md:block w-fit mt-5 p-2 border bg-gradient-to-bl from-blue-500 to-blue-800 text-white rounded-md text-sm cursor-pointer'>
                            <span className='flex items-center gap-2'>
                                <Save className='w-4 h-4' />
                                Save Changes
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </section>
       <Toaster />
    </div>
  )
}

export default ProfileSettings