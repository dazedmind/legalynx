import React, { useState } from 'react';
import InputField from '../components/ui/InputField'
import { ChevronDown, HardDrive, Save } from 'lucide-react'
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';

const retentionOptions = [
  { value: '', label: 'Select' },
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
];

export default function FileSettings() {
  const [retention, setRetention] = useState('');

  return (
    <div>
        <span className='flex flex-col gap-1 p-6 px-8'>
            <h1 className='text-3xl font-bold font-serif'>File Settings</h1>
            <p className='text-sm text-gray-500'>Manage your file settings and preferences  .</p>
        </span>
        <section className='space-y-4'>
            <div className='p-4 rounded-md border flex flex-col gap-1 border-gray-200 mx-8'>
                <div className='flex justify-between items-center'>
                    <span>
                        <h1 className='text-lg font-bold'>File Expiration</h1>
                        <p className='text-sm text-gray-500'>Select a file rename format</p>
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          className="flex items-center justify-between border border-gray-300 rounded-md p-2 text-sm cursor-pointer min-w-[120px] text-left bg-white"
                          type="button"
                        >
                          {retentionOptions.find(opt => opt.value === retention)?.label || 'Select'}
                          <ChevronDown className='w-4 h-4' />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {retentionOptions.map(option => (
                          <DropdownMenuItem
                            key={option.value}
                            onSelect={() => setRetention(option.value)}
                            className={retention === option.value ? 'font-semibold bg-accent' : ''}
                          >
                            {option.label}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                </div>
      
               
            </div>
            <div className='p-4 rounded-md border flex flex-col gap-1 border-gray-200 mx-8'>
                <h1 className='text-lg font-bold'>File Renaming</h1>
                <p className='text-sm text-gray-500'>Select a file rename format</p>
                {/* <InputField
                    label=""
                    type="text"
                    id="new_name"
                    name="new_name"
                    className="w-auto p-2 border border-gray-300 rounded-md text-sm"
                /> */}
            </div>

            <div className='p-4 rounded-md border flex flex-col gap-2 border-gray-200 mx-8'>
                <div className='space-y-4'>
                    <span className='flex flex-col gap-1'>
                        <h1 className='text-lg font-bold'>Storage Usage</h1>
                        <p className='text-sm text-gray-500'>View and manage your storage usage.</p>
                    </span>
                    <span className='flex items-center gap-2'>
                        <HardDrive className='w-8 h-8' />
                        <h1 className='text-xl font-bold'>5GB / 10 GB</h1>
                        <p>used</p>
                    </span>
                </div>
           
             
                <Progress value={50} />
            </div>
        </section>
    </div>
  )
}