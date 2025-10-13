'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { CircleUser, Shield, FileCog, CreditCard, LogOut, Lock, FolderCog, Menu, X, ChevronLeft, Star } from 'lucide-react';
import { SystemStatus } from '../../../lib/api';
import NavBar from '../components/layout/NavBar';
import FileSettings from './file-settings/FileSettings'
import ProfileSettings from './profile-settings/ProfileSettings'
import SubscriptionPage from '../home/subscription/SubscriptionPage'
import SecuritySettings from './privacy-security/SecurityLogSettings'
import PrivacySecuritySettings from './privacy-security/PrivacySecuritySettings'
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
      // Preserve existing parameters when setting default tab
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set('tab', 'profile');
      router.replace(`/frontend/settings?${currentParams.toString()}`);
    }
  }, [searchParams, router]);

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    // Close mobile sidebar when a tab is selected
    setIsMobileSidebarOpen(false);
    // Preserve PayPal parameters when switching tabs
    const currentParams = new URLSearchParams(window.location.search);
    currentParams.set('tab', tab);
    router.push(`/frontend/settings?${currentParams.toString()}`);
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
    { id: 'security_settings', label: 'Privacy & Security', icon: Lock },
    { id: 'subscription', label: 'Subscription', icon: Star },
  ];

  return (
    <div className="h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-primary shadow-sm border-b flex-shrink-0 flex px-6 md:px-0">
        <div className="flex items-center justify-between">
          <button
            onClick={toggleMobileSidebar}
            className="lg:hidden bg-primary"
          >
            {isMobileSidebarOpen ? (
              <ChevronLeft className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>
        <div className="flex-1 items-center justify-between">
          <NavBar />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex bg-primary flex-1 overflow-hidden relative">
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
          fixed top-0 left-0 h-full w-64 bg-primary p-4 gap-2 flex flex-col flex-shrink-0 z-40 shadow-2xl border-r border-tertiary
          transform transition-transform duration-300 ease-in-out
          ${isMobileSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center justify-between mb-2 pt-4">
            <h2 className="text-lg font-semibold text-foreground">Settings</h2>
            <button
              onClick={() => setIsMobileSidebarOpen(false)}
              className="p-1 rounded-lg hover:bg-accent"
            >
              <ChevronLeft className="w-5 h-5 text-foreground" />
            </button>
          </div>

          {/* Menu Items */}
          <div className="space-y-1">
            {menuItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabClick(item.id as ActiveTab)}
                  className={`w-full relative cursor-pointer flex items-center gap-3 text-left p-3 rounded-md transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue/10 text-blue-700 font-semibold rounded-md '
                      : 'text-foreground hover:bg-accent'
                  }`}
                >
                  <IconComponent className={`${activeTab === item.id ? 'ml-1 stroke-2' : 'ml-0' } transition-all duration-300 w-5 h-5 flex-shrink-0`} strokeWidth={1.5} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Logout Button */}
          <div className="mt-auto space-y-3">
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 text-sm p-3 py-2 rounded-md hover:bg-destructive/20 border border-destructive transition-colors cursor-pointer text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Sign out
            </button>
          </div>

          <div className="flex items-center text-xs gap-1 mt-4 border-t border-tertiary pt-2 text-muted-foreground">
            <a href="/frontend/privacy-policy" target="_blank" rel="noopener noreferrer">
              Privacy Policy •
            </a>
            <p className="text-xs text-muted-foreground">v 0.3.8</p>
          </div>
        </aside>
        
        {/* Main Content Area */}
        <section className="flex-1 flex flex-col overflow-hidden lg:ml-0">
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
      <header className="bg-primary shadow-sm border-b flex-shrink-0 px-6 md:px-0">
        <NavBar />
      </header>
      <main className="flex bg-primary flex-1 overflow-hidden relative">
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-foreground">Loading settings...</p>
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