'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { CircleUser, Shield, FileCog, CreditCard, LogOut, Lock, FolderCog, Menu, X } from 'lucide-react';
import { SystemStatus } from '../lib/api';
import NavBar from '../components/NavBar';
import FileSettings from './FileSettings'
import ProfileSettings from './ProfileSettings'
import SubscriptionPage from './SubscriptionPage'
import SecuritySettings from './SecuritySettings'
import PrivacySecuritySettings from './PrivacySecuritySettings'
import { useSearchParams, useRouter } from 'next/navigation';

type ActiveTab = 'profile' | 'file_settings' | 'security_log' | 'security_settings' | 'subscription';

function SettingsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>('profile');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Handle URL parameter for initial tab
  useEffect(() => {
    const tabParam = searchParams.get('tab') as ActiveTab;
    if (tabParam && ['profile', 'file_settings', 'security_log', 'security_settings', 'subscription'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Update URL when component mounts if no tab parameter is present
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (!tabParam) {
      // Set default tab in URL if none is specified
      router.replace(`/frontend/settings?tab=profile`);
    }
  }, [searchParams, router]);

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    // Close mobile sidebar when a tab is selected
    setIsMobileSidebarOpen(false);
    // Update URL to reflect current tab
    router.push(`/frontend/settings?tab=${tab}`);
  };

  const logout = () => {
    console.log('logout');
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const menuItems = [
    { id: 'profile', label: 'Profile Settings', icon: CircleUser },
    { id: 'file_settings', label: 'File Settings', icon: FolderCog },
    { id: 'security_log', label: 'Security Log', icon: Shield },
    { id: 'security_settings', label: 'Privacy & Security', icon: Lock },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white shadow-sm border-b flex-shrink-0 px-6 md:px-0">
        <NavBar />
      </header>

      {/* Main Content */}
      <main className="flex bg-white flex-1 overflow-hidden relative">
        {/* Mobile Menu Button */}
 

        {/* Mobile Overlay */}
        {isMobileSidebarOpen && (
          <div 
            className="lg:hidden fixed inset-0 bg-black/20 z-30"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside className={`
          lg:w-1/5 lg:relative lg:translate-x-0 lg:shadow-none
          fixed top-0 left-0 h-full w-80 bg-neutral-100 p-6 gap-2 flex flex-col flex-shrink-0 z-40 shadow-2xl
          transform transition-transform duration-300 ease-in-out
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between mb-6 pt-4">
            <h2 className="text-lg font-semibold text-gray-800">Settings</h2>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-gray-200"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id as ActiveTab)}
                  className={`w-full relative cursor-pointer flex items-center gap-3 text-left p-3 rounded-r-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-100 text-blue-700 font-semibold'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {activeTab === item.id && (
                    <div className="h-full w-1 bg-blue-700 absolute left-0 overflow-hidden rounded-full"></div>
                  )}
                  <IconComponent className={`${activeTab === item.id ? 'ml-2' : 'ml-0' } transition-all duration-300 w-6 h-6 flex-shrink-0`} strokeWidth={1.5} />
                  <span className="text-sm lg:text-base">{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Logout Button */}
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
        <section className="flex-1 flex flex-col overflow-hidden lg:ml-0">
          {/* Mobile Content Header - Shows active tab */}
          <div className="lg:hidden bg-white border-b px-4 py-3 flex items-center gap-3">
            <button
              onClick={toggleMobileSidebar}
              className="lg:hidden bg-white rounded-lg p-2 border"
            >
              {isMobileSidebarOpen ? (
                <X className="w-6 h-6 text-gray-600" />
              ) : (
                <Menu className="w-6 h-6 text-gray-600" />
              )}
            </button>
            <h1 className="text-lg font-semibold text-gray-800">
              {menuItems.find(item => item.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {activeTab === 'profile' && <ProfileSettings />}
            {activeTab === 'file_settings' && <FileSettings />}
            {activeTab === 'security_log' && <SecuritySettings />}
            {activeTab === 'security_settings' && <PrivacySecuritySettings />}
            {activeTab === 'subscription' && <SubscriptionPage />}
          </div>
        </section>
      </main>
    </div>
  );
}

// Loading component for Suspense fallback
function SettingsLoading() {
  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden">
      <header className="bg-white shadow-sm border-b flex-shrink-0 px-6 md:px-0">
        <NavBar />
      </header>
      <main className="flex bg-white flex-1 overflow-hidden relative">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading settings...</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsContent />
    </Suspense>
  );
}