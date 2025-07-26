import React, { useState } from 'react';
import InputField from '../components/ui/InputField'
import { 
  ChevronDown, 
  HardDrive, 
  Save, 
  AlertCircle
} from 'lucide-react'
import { Progress } from "@/components/ui/progress"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';

const retentionOptions = [
  { value: '', label: 'Never'},
  { value: '7', label: '7 days'},
  { value: '30', label: '30 days'},
  { value: '60', label: '60 days'},
  { value: '90', label: '90 days'},
];

const renamingFormats = [
  { value: 'original', label: 'Keep original names', example: 'document.pdf' },
  { value: 'timestamp', label: 'Add timestamp', example: 'document_2024-01-15.pdf' },
  { value: 'sequential', label: 'Sequential numbering', example: 'document_001.pdf' },
];

export default function FileSettings() {
  const [retention, setRetention] = useState('');
  const [autoRename, setAutoRename] = useState(false);
  const [renamingFormat, setRenamingFormat] = useState('original');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleRetentionChange = (value: string) => {
    setRetention(value);
    setHasUnsavedChanges(true);
  };

  const handleAutoRenameChange = (checked: boolean) => {
    setAutoRename(checked);
    setHasUnsavedChanges(true);
  };

  const handleRenamingFormatChange = (value: string) => {
    setRenamingFormat(value);
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = () => {
    setHasUnsavedChanges(false);
  };

  const storageUsed = 5; // GB
  const storageTotal = 10; // GB
  const storagePercentage = (storageUsed / storageTotal) * 100;

  return (
    <div>
      <span className='flex flex-col gap-1 p-6 px-8'>
        <div className="flex items-center justify-between">
          <div>
            <h1 className='text-3xl font-bold font-serif'>File Settings</h1>
            <p className='text-sm text-gray-500'>Manage your file settings and preferences.</p>
          </div>
          
        </div>

        {hasUnsavedChanges && (
          <div>
          <div className="flex justify-between items-center gap-2 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-sm">
            <span className='flex items-center gap-2'>
              <AlertCircle className="w-4 h-4" />
              You have unsaved changes
            </span>
       
            <button 
            onClick={handleSaveSettings}
            className="flex items-center gap-2 p-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors cursor-pointer"
          >
            Save Settings
          </button>
          </div>

     
          </div>
        )}
      </span>
      
      <section className='space-y-4'>
        <div className='p-4 rounded-md border flex flex-col gap-1 border-gray-200 mx-8'>
          <div className='flex justify-between items-center'>
            <span>
              <h1 className='text-lg font-bold'>File Expiration</h1>
              <p className='text-sm text-gray-500'>Select file retention time</p>
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
              <DropdownMenuContent align="end" className="w-32">
                {retentionOptions.map(option => (
                  <DropdownMenuItem
                    key={option.value}
                    onSelect={() => handleRetentionChange(option.value)}
                    className={`flex flex-col items-start p-2 ${retention === option.value ? 'font-semibold bg-accent' : ''} cursor-pointer`}
                  >
                    <span>{option.label}</span>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {retention && (
            <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 rounded text-blue-800 text-sm">
              <AlertCircle className="w-4 h-4" />
              Files will be automatically deleted after {retentionOptions.find(opt => opt.value === retention)?.label.toLowerCase()}
            </div>
          )}
        </div>

        <div className='p-4 rounded-md border flex flex-col gap-1 border-gray-200 mx-8'>
          <div className='flex justify-between items-center'>
            <span>
              <h1 className='text-lg font-bold'>Auto-rename files</h1>
              <p className='text-sm text-gray-500'>Enable auto-rename files</p>
            </span>
            <Switch 
              checked={autoRename}
              onCheckedChange={handleAutoRenameChange}
              className="cursor-pointer"
            />
          </div>
        </div>

        {autoRename && (
          <div className='p-4 rounded-md border flex flex-col gap-3 border-gray-200 mx-8'>
            <div>
              <h1 className='text-lg font-bold'>File Renaming</h1>
              <p className='text-sm text-gray-500'>Select a file rename format</p>
            </div>
            
            <div className="space-y-2">
              {renamingFormats.map(format => (
                <label
                  key={format.value}
                  className={`flex items-center gap-3 p-3 border rounded cursor-pointer transition-colors ${
                    renamingFormat === format.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="renamingFormat"
                    value={format.value}
                    checked={renamingFormat === format.value}
                    onChange={() => handleRenamingFormatChange(format.value)}
                    className="text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium">{format.label}</div>
                    <div className="text-sm text-gray-500">
                      Example: <code className="bg-gray-100 px-1 rounded text-xs">{format.example}</code>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        <div className='p-4 rounded-md border flex flex-col gap-2 border-gray-200 mx-8'>
          <div className='space-y-4'>
            <span className='flex flex-col gap-1'>
              <h1 className='text-lg font-bold'>Storage Usage</h1>
              <p className='text-sm text-gray-500'>View and manage your storage usage.</p>
            </span>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-gray-50 rounded">
                <div className="text-lg font-bold">{storageTotal} GB</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="p-3 bg-blue-50 rounded">
                <div className="text-lg font-bold text-blue-600">{storageUsed} GB</div>
                <div className="text-xs text-gray-500">Used</div>
              </div>
              <div className="p-3 bg-green-50 rounded">
                <div className="text-lg font-bold text-green-600">{storageTotal - storageUsed} GB</div>
                <div className="text-xs text-gray-500">Available</div>
              </div>
            </div>
            
            <span className='flex items-center gap-2'>
              <HardDrive className='w-8 h-8' />
              <h1 className='text-xl font-bold'>{storageUsed}GB / {storageTotal} GB</h1>
              <p>used ({storagePercentage.toFixed(1)}%)</p>
            </span>
          </div>
          
          <Progress value={storagePercentage} />
          
          {storagePercentage >= 80 && (
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm">
              <AlertCircle className="w-4 h-4" />
              {storagePercentage >= 90 
                ? 'Storage is almost full. Consider upgrading or deleting unused files.'
                : 'Storage is getting full. You may want to clean up old files.'
              }
            </div>
          )}
        </div>
      </section>
    </div>
  )
}