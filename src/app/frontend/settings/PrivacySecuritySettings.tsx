import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Smartphone, 
  Key, 
  AlertTriangle, 
  Copy, 
  RefreshCw, 
  Check, 
  X,
  Lock,
  Loader2,
  Save,
  Undo
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useAuth } from '@/lib/context/AuthContext';
import { authUtils } from '@/lib/auth';
import LoaderComponent from '../components/ui/LoaderComponent';
import { Separator } from '@/components/ui/separator';

interface SecuritySettings {
  two_factor_enabled: boolean;
  two_factor_secret?: string;
  login_notifications: boolean;
  security_alerts: boolean;
}

interface PrivacySettings {
  data_sharing_consent: boolean;
  analytics_consent: boolean;
  marketing_emails: boolean;
}

// Floating Save Changes Bar Component
const FloatingSaveBar = ({ 
  isVisible, 
  onSave, 
  onDiscard, 
  isSaving 
}: {
  isVisible: boolean;
  onSave: () => void;
  onDiscard: () => void;
  isSaving: boolean;
}) => {
  return (
    <div 
      className={`fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ease-out ${
        isVisible 
          ? 'translate-y-0 opacity-100 scale-100' 
          : 'translate-y-16 opacity-0 scale-95 pointer-events-none'
      }`}
    >
      <div className="bg-primary/50 backdrop-blur-sm border border-tertiary rounded-lg shadow-lg p-4 min-w-3xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <p className="font-medium text-foreground">You have unsaved changes</p>
              <p className="text-xs text-muted-foreground">Your settings will be lost if you leave without saving</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onDiscard}
              disabled={isSaving}
              className="flex items-center gap-2 px-3 py-2 text-sm border border-tertiary rounded-md hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer"
            >
              Discard
            </button>
            
            <button
              onClick={onSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function PrivacySecuritySettings() {
  const { user, isAuthenticated } = useAuth();
  
  // Settings state
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>({
    two_factor_enabled: false,
    login_notifications: true,
    security_alerts: true,
  });
  
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    data_sharing_consent: false,
    analytics_consent: true,
    marketing_emails: false,
  });

  // Store original settings for discard functionality
  const [originalSecuritySettings, setOriginalSecuritySettings] = useState<SecuritySettings>({
    two_factor_enabled: false,
    login_notifications: true,
    security_alerts: true,
  });
  
  const [originalPrivacySettings, setOriginalPrivacySettings] = useState<PrivacySettings>({
    data_sharing_consent: false,
    analytics_consent: true,
    marketing_emails: false,
  });

  // 2FA Setup state
  const [is2FASetup, setIs2FASetup] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [manualEntryKey, setManualEntryKey] = useState<string>('');
  const [verificationCode, setVerificationCode] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isGenerating2FA, setIsGenerating2FA] = useState(false);

  // Account deletion state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // UI state
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadSettings();
    }
  }, [isAuthenticated, user]);

  const getAuthHeaders = () => {
    const token = authUtils.getToken();
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch('/backend/api/user-settings', {
        method: 'GET',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        
        const loadedSecuritySettings = {
          two_factor_enabled: data.two_factor_enabled || false,
          two_factor_secret: data.two_factor_secret,
          login_notifications: data.login_notifications ?? true,
          security_alerts: data.security_alerts ?? true,
        };

        const loadedPrivacySettings = {
          data_sharing_consent: data.data_sharing_consent || false,
          analytics_consent: data.analytics_consent ?? true,
          marketing_emails: data.marketing_emails || false,
        };

        setSecuritySettings(loadedSecuritySettings);
        setPrivacySettings(loadedPrivacySettings);
        
        // Store originals for discard functionality
        setOriginalSecuritySettings(loadedSecuritySettings);
        setOriginalPrivacySettings(loadedPrivacySettings);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load your settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSecuritySettingChange = (key: keyof SecuritySettings, value: any) => {
    setSecuritySettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
  };

  const handlePrivacySettingChange = (key: keyof PrivacySettings, value: any) => {
    setPrivacySettings(prev => ({
      ...prev,
      [key]: value
    }));
    setHasUnsavedChanges(true);
  };

  const saveSettings = async () => {
    try {
      setIsSaving(true);
      
      const response = await fetch('/backend/api/user-settings', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          ...securitySettings,
          ...privacySettings
        })
      });

      if (response.ok) {
        setHasUnsavedChanges(false);
        
        // Update originals to current values
        setOriginalSecuritySettings({ ...securitySettings });
        setOriginalPrivacySettings({ ...privacySettings });
        
        toast.success('Settings saved successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsSaving(false);
    }
  };

  const discardChanges = () => {
    // Revert to original settings
    setSecuritySettings({ ...originalSecuritySettings });
    setPrivacySettings({ ...originalPrivacySettings });
    setHasUnsavedChanges(false);
    toast.info('Changes discarded');
  };

  // 2FA Setup Functions
  const generate2FASecret = async () => {
    try {
      setIsGenerating2FA(true);
      
      const response = await fetch('/backend/api/auth/2fa/setup', {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        const data = await response.json();
        setQrCodeUrl(data.qrCodeUrl);
        setManualEntryKey(data.secret);
        setIs2FASetup(true);
        setSecuritySettings(prev => ({ ...prev, two_factor_secret: data.secret }));
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate 2FA secret');
      }
    } catch (error) {
      console.error('Failed to generate 2FA secret:', error);
      toast.error('Failed to setup 2FA');
    } finally {
      setIsGenerating2FA(false);
    }
  };

  const verify2FA = async () => {
    if (!verificationCode || verificationCode.length !== 6) {
      toast.error('Please enter a 6-digit verification code');
      return;
    }

    try {
      setIsVerifying(true);
      
      const response = await fetch('/backend/api/auth/2fa/verify', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          token: verificationCode,
          secret: securitySettings.two_factor_secret
        })
      });

      if (response.ok) {
        setSecuritySettings(prev => ({ ...prev, two_factor_enabled: true }));
        setIs2FASetup(false);
        setVerificationCode('');
        setHasUnsavedChanges(true);
        toast.success('2FA enabled successfully!');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error('Failed to verify 2FA:', error);
      toast.error('Invalid verification code');
    } finally {
      setIsVerifying(false);
    }
  };

  const disable2FA = async () => {
    try {
      const response = await fetch('/backend/api/auth/2fa/disable', {
        method: 'POST',
        headers: getAuthHeaders()
      });

      if (response.ok) {
        setSecuritySettings(prev => ({ 
          ...prev, 
          two_factor_enabled: false,
          two_factor_secret: undefined 
        }));
        setHasUnsavedChanges(true);
        toast.success('2FA disabled successfully');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to disable 2FA');
      }
    } catch (error) {
      console.error('Failed to disable 2FA:', error);
      toast.error('Failed to disable 2FA');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  // Account Deletion Functions
  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
      toast.error('Please type "DELETE MY ACCOUNT" to confirm');
      return;
    }

    try {
      setIsDeletingAccount(true);
      
      const response = await fetch('/backend/api/auth/delete-account', {
        method: 'DELETE',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          confirmation: deleteConfirmText
        })
      });

      if (response.ok) {
        toast.success('Account deleted successfully');
        // Redirect to home page and clear auth
        authUtils.logout();
        window.location.href = '/';
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete account');
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      toast.error('Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (isLoading) {
    return (
      <LoaderComponent />
    );
  }

  return (
    <div className="space-y-4"> {/* Added padding bottom for floating bar */}
      {/* Header */}
      <div className="p-6 px-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className='text-3xl font-bold font-serif'>Privacy & Security</h1>
            <p className='text-sm text-muted-foreground'>Manage your privacy and security preferences.</p>
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <section className="mx-8 p-6 rounded-lg border border-tertiary bg-primary">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-yellow-500" />
          <div>
            <h2 className="text-xl font-semibold">Two-Factor Authentication</h2>
          </div>
        </div>

        {/* Divider */}
        <Separator className="my-4"/>

        {!securitySettings.two_factor_enabled && !is2FASetup ? (
          <div className="space-y-4">
            <div className=" rounded-lg">
              <div className="flex justify-between gap-3">
                <div className='flex flex-col'>
                    <h3 className="font-bold ">Set up 2FA</h3>
                    <p className="text-sm text-muted-foreground ">
                        Protect your account with two-factor authentication. You'll need your phone to sign in.
                    </p>
                </div>
        

                <button
                    onClick={generate2FASecret}
                    disabled={isGenerating2FA}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                    {isGenerating2FA ? (
                        <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Setting up...
                        </>
                    ) : (
                        <>
                        <Key className="w-4 h-4" />
                        Enable 2FA
                        </>
                    )}
                </button>
              </div>
            </div>
            
          </div>
        ) : securitySettings.two_factor_enabled ? (
          <div className="flex justify-between items-center align-middle gap-4">
            <div className="flex items-center gap-2 text-green-600">
              <Check className="w-5 h-5" />
              <span className="font-medium">Two-factor authentication is enabled</span>
            </div>
            
            <button
              onClick={disable2FA}
              className="flex items-center gap-2 px-4 py-2 border border-red-600 text-red-600 rounded-lg hover:bg-red-600/20 transition-colors cursor-pointer"
            >
              Disable 2FA
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className=" rounded-lg">
              <h3 className="font-medium mb-2">Setup your authenticator app</h3>
              <p className="text-sm ">
                Scan the QR code with your authenticator app or enter the key manually.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* QR Code */}
              <div className="text-center">
                <h4 className="font-medium mb-3">Scan QR Code</h4>
                {qrCodeUrl ? (
                  <img src={qrCodeUrl} alt="2FA QR Code" className="mx-auto border rounded-lg" />
                ) : (
                  <div className="w-48 h-48 mx-auto bg-gray-100 border rounded-lg flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                  </div>
                )}
              </div>

              {/* Manual Entry */}
              <div>
                <h4 className="font-medium mb-3">Manual Entry</h4>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Secret Key
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={manualEntryKey}
                        readOnly
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm font-mono"
                      />
                      <button
                        onClick={() => copyToClipboard(manualEntryKey)}
                        className="px-3 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        title="Copy to clipboard"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Verification Code
                    </label>
                    <input
                      type="text"
                      value={verificationCode}
                      onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="Enter 6-digit code"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={6}
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={verify2FA}
                      disabled={isVerifying || verificationCode.length !== 6}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                    >
                      {isVerifying ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          Verify & Enable
                        </>
                      )}
                    </button>
                    
                    <button
                      onClick={() => setIs2FASetup(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Security Settings */}
      <section className="mx-8 p-6 rounded-lg border border-tertiary bg-primary">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-6 h-6 text-yellow-500" />
          <div>
            <h2 className="text-xl font-semibold">Security Notifications</h2>
          </div>
        </div>

        {/* Divider */}
        <Separator className="my-4"/>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Login Notifications</h3>
              <p className="text-sm text-muted-foreground">Get notified when someone signs into your account</p>
            </div>
            <Switch 
              checked={securitySettings.login_notifications}
              onCheckedChange={(checked) => handleSecuritySettingChange('login_notifications', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Security Alerts</h3>
              <p className="text-sm text-muted-foreground">Receive alerts about unusual account activity</p>
            </div>
            <Switch 
              checked={securitySettings.security_alerts}
              onCheckedChange={(checked) => handleSecuritySettingChange('security_alerts', checked)}
            />
          </div>
        </div>
      </section>

      {/* Privacy Settings */}
      <section className="mx-8 p-6 rounded-lg border border-tertiary bg-primary">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-6 h-6 text-yellow-500" />
          <div>
            <h2 className="text-xl font-semibold">Privacy Preferences</h2>
          </div>
        </div>

        {/* Divider */}
        <Separator className="my-4"/>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Analytics & Usage Data</h3>
              <p className="text-sm text-muted-foreground">Help improve our service by sharing anonymous usage data</p>
            </div>
            <Switch 
              checked={privacySettings.analytics_consent}
              onCheckedChange={(checked) => handlePrivacySettingChange('analytics_consent', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Marketing Emails</h3>
              <p className="text-sm text-muted-foreground">Receive emails about new features and updates</p>
            </div>
            <Switch 
              checked={privacySettings.marketing_emails}
              onCheckedChange={(checked) => handlePrivacySettingChange('marketing_emails', checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Data Sharing</h3>
              <p className="text-sm text-muted-foreground">Allow sharing anonymized data with research partners</p>
            </div>
            <Switch 
              checked={privacySettings.data_sharing_consent}
              onCheckedChange={(checked) => handlePrivacySettingChange('data_sharing_consent', checked)}
            />
          </div>
        </div>
      </section>

      {/* Danger Zone */}
      <section className="mx-8 p-6 mb-8 rounded-lg border border-tertiary bg-destructive/5">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-red-600" />
          <div>
            <h2 className="text-xl font-semibold text-foreground">Danger Zone</h2>
          </div>
        </div>

        {/* Divider */}

        <div className="space-y-4">
          {!showDeleteConfirm ? (
            <div className="flex items-center justify-between p-4 bg-primary border border-tertiary rounded-lg">
              <div>
                <h3 className="font-medium text-red-600">Delete Account</h3>
                <p className="text-sm text-muted-foreground">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
              </div>
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors cursor-pointer"
              >
                Delete Account
              </button>
            </div>
          ) : (
            <div className="p-4 bg-primary border border-tertiary rounded-lg space-y-4">
              <div className="flex items-start gap-3">
                <div>
                  <h3 className="font-medium">Are you absolutely sure?</h3>
                  <p className="text-sm mt-1">
                    This will permanently delete your account, all documents, chat sessions, and associated data. 
                    This action is irreversible.
                  </p>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-red-700 mb-2">
                  Type "DELETE MY ACCOUNT" to confirm:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-3 py-2 border border-red-300 rounded-md"
                  placeholder="DELETE MY ACCOUNT"
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={handleDeleteAccount}
                  disabled={isDeletingAccount || deleteConfirmText !== 'DELETE MY ACCOUNT'}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      Delete My Account
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="px-4 py-2 border border-tertiary rounded-md hover:bg-accent transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Floating Save Changes Bar */}
      <FloatingSaveBar
        isVisible={hasUnsavedChanges}
        onSave={saveSettings}
        onDiscard={discardChanges}
        isSaving={isSaving}
      />
    </div>
  );
}