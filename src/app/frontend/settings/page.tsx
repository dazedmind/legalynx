'use client';

import React, { useState } from 'react';
import { CircleUser, Shield, FileCog, CreditCard, LogOut, Lock, FolderCog } from 'lucide-react';
import { SystemStatus } from '../lib/api';
import NavBar from '../components/NavBar';
import FileSettings from './FileSettings'
import ProfileSettings from './ProfileSettings'
import SubscriptionPage from './SubscriptionPage'
import SecuritySettings from './SecuritySettings'
import PrivacySecuritySettings from './PrivacySecuritySettings'

type ActiveTab = 'profile' | 'file_settings' | 'security_log' | 'security_settings' | 'subscription';

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
            <CircleUser className="w-6 h-6" strokeWidth={1.5} />
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
            <FolderCog className="w-6 h-6" strokeWidth={1.5} />
            File Settings
          </button>

          <button
            onClick={() => handleTabClick('security_log')}
            className={`w-full cursor-pointer flex items-center gap-3 text-left p-3 rounded-lg transition-colors ${
              activeTab === 'security_log'
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Shield className="w-6 h-6" strokeWidth={1.5} />
            Security Log
          </button>

          <button
            onClick={() => handleTabClick('security_settings')}
            className={`w-full cursor-pointer flex items-center gap-3 text-left p-3 rounded-lg transition-colors ${
              activeTab === 'security_settings'
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Lock className="w-6 h-6" strokeWidth={1.5} />
            Privacy & Security
          </button>


          <button
            onClick={() => handleTabClick('subscription')}
            className={`w-full cursor-pointer flex items-center gap-3 text-left p-3 rounded-lg transition-colors ${
              activeTab === 'subscription'
                ? 'bg-blue-100 text-blue-700 font-semibold'
                : 'text-gray-700 hover:bg-gray-200'
            }`}
          >
            <CreditCard className="w-6 h-6" strokeWidth={1.5} />
            Subscription
          </button>
          <div className="mt-auto space-y-3">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 text-sm p-3 rounded-lg text-red-600 hover:bg-red-100 border border-red-200 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>
        </aside>
        
        {/* Main Content Area */}
        <section className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {activeTab === 'profile' && 
            <ProfileSettings />}

            {activeTab === 'file_settings' && 
            <FileSettings />}

            {activeTab === 'security_log' && 
            <SecuritySettings />}

            {activeTab === 'security_settings' && 
            <PrivacySecuritySettings />}

            {activeTab === 'subscription' && 
            <SubscriptionPage />}
          </div>
              
        </section>
      </main>
    </div>
  );
}