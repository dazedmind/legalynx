'use client';

import React, { useState, useEffect } from 'react';
import { User, Shield, FileCog, CreditCard, LogOut } from 'lucide-react';
import { apiService, handleApiError, profileService, SystemStatus, UploadResponse } from '../lib/api';
import NavBar from '../components/NavBar';
import { GoArchive } from 'react-icons/go';
import FileSettings from './FileSettings'
import ProfileSettings from './ProfileSettings'
import SubscriptionPage from './SubscriptionPage'
import SecuritySettings from './SecuritySettings'

type ActiveTab = 'profile' | 'file_settings' | 'security_settings' | 'subscription';

export default function Home() {
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
  };

  const logout = () => {
    console.log('logout');
  };

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b flex-shrink-0">
        <NavBar />
      </header>

      {/* Main Content */}
      <main className="flex bg-white flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-1/5 bg-neutral-100 p-6 gap-2 flex flex-col flex-shrink-0">
          <button
            onClick={() => handleTabClick('profile')}
            className={`w-full cursor-pointer flex items-center gap-3 text-left p-3 rounded-lg transition-colors ${
              activeTab === 'profile'
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <User className="w-5 h-5" />
            Profile Settings
          </button>

          <button
            onClick={() => handleTabClick('file_settings')}
            className={`w-full cursor-pointer flex items-center gap-3 text-left p-3 rounded-lg transition-colors ${
              activeTab === 'file_settings'
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <FileCog className="w-6 h-6" />
            File Settings
          </button>

          <button
            onClick={() => handleTabClick('security_settings')}
            className={`w-full cursor-pointer flex items-center gap-3 text-left p-3 rounded-lg transition-colors ${
              activeTab === 'security_settings'
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Shield className="w-6 h-6" />
            Security
          </button>

          <button
            onClick={() => handleTabClick('subscription')}
            className={`w-full cursor-pointer flex items-center gap-3 text-left p-3 rounded-lg transition-colors ${
              activeTab === 'subscription'
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CreditCard className="w-6 h-6" />
            Subscription
          </button>
          <div className="mt-auto space-y-3">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 text-sm p-3 rounded-lg text-orange-600 hover:bg-orange-50 border border-orange-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </aside>
        
        {/* Main Content Area */}
        <section className="flex-1 flex flex-col justify-between overflow-y-auto">
          <div>
            {activeTab === 'profile' && 
            <ProfileSettings />}

            {activeTab === 'file_settings' && 
            <FileSettings />}

            {activeTab === 'security_settings' && 
            <SecuritySettings />}

            {activeTab === 'subscription' && 
            <SubscriptionPage />}
          </div>
              
        </section>
      </main>
    </div>
  );
}