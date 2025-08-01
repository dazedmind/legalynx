// src/app/frontend/components/ConfirmationModal.tsx - Simple Smooth Animations
import { Save, Loader2, DownloadCloud, Lock, Crown, Zap, Gift, X, Check } from 'lucide-react'
import React, { useState, useEffect } from 'react'
import { GoQuestion, GoAlert, GoCheck, GoInfo} from 'react-icons/go';

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (shouldSave: boolean) => void;
  isSaving?: boolean;
  documentName?: string;
  modal: {
    header: string;
    message: string;
    trueButton: string;
    falseButton: string;
    type: string;
  }
  // New paywall props
  paywall?: {
    isPaywallFeature: boolean;
    userProfile?: any;
    featureType?: 'saveSessions' | 'cloudStorage' | 'voiceMode' | 'fileHistory' | 'pdfDownload';
    onUpgrade?: () => void;
    allowTemporary?: boolean; // For features that can fallback to temporary
  }
}

const getColor = (type: string) => {
  switch (type) {
    case ModalType.DANGER:
      return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
    case ModalType.WARNING:
      return 'bg-yellow/20 text-yellow-600 hover:bg-yellow/30';
    case ModalType.INFO:
      return 'bg-blue/20 text-blue-600 hover:bg-blue/30';
    case ModalType.SUCCESS:
      return 'bg-green/20 text-green-600 hover:bg-green/30';
    case ModalType.ERROR:
      return 'bg-destructive/10 text-destructive hover:bg-destructive/20';
    case ModalType.SAVE:
      return 'bg-blue/20 text-blue-600 hover:bg-blue/30';
    case ModalType.PAYWALL:
      return 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700';
    default:
      return 'bg-blue/20 text-blue-600 hover:bg-blue/30';
  }
}

const getIcon = (type: string) => { 
  switch (type) {
    case ModalType.DANGER:
      return <GoAlert className="w-8 h-8" />;
    case ModalType.WARNING:
      return <GoAlert className="w-8 h-8" />;
    case ModalType.INFO:
      return <GoInfo className="w-8 h-8" />;
    case ModalType.SUCCESS:
      return <GoCheck className="w-8 h-8" />;
    case ModalType.ERROR:
      return <GoAlert className="w-8 h-8" />;
    case ModalType.SAVE:
      return <DownloadCloud className="w-8 h-8" />;
    case ModalType.PAYWALL:
      return <Lock className="w-8 h-8" />;
    default:
      return <GoInfo className="w-8 h-8" />;
  }
}

export const ModalType = {
  DELETE: 'delete',
  DANGER: 'danger',
  WARNING: 'warning',
  INFO: 'info',
  SUCCESS: 'success',
  ERROR: 'error',
  SAVE: 'save',
  PAYWALL: 'paywall', // New paywall type
}

// Subscription Plans Configuration
const SUBSCRIPTION_PLANS = {
  BASIC: {
    name: 'Basic',
    price: 'Free',
    icon: Gift,
    features: {
      tokens: 1000,
      saveSessions: false,
      cloudStorage: false,
      fileHistory: false,
      voiceMode: false,
      pdfDownload: false
    }
  },
  STANDARD: {
    name: 'Standard',
    price: '₱149/month',
    icon: Zap,
    features: {
      tokens: 5000,
      saveSessions: true,
      cloudStorage: true,
      fileHistory: true,
      voiceMode: false,
      pdfDownload: true
    }
  },
  PREMIUM: {
    name: 'Premium',
    price: '₱249/month',
    icon: Crown,
    features: {
      tokens: -1, // Unlimited
      saveSessions: true,
      cloudStorage: true,
      fileHistory: true,
      voiceMode: true,
      pdfDownload: true
    }
  }
};

// Feature descriptions
const getFeatureDescription = (featureType: string) => {
  const descriptions = {
    saveSessions: 'Save your chat sessions and access them anytime across all your devices',
    cloudStorage: 'Store your files securely in the cloud with persistent access',
    fileHistory: 'Access your uploaded files and chat history whenever you need them',
    voiceMode: 'Interact with Legalynx AI using voice commands for hands-free experience',
    pdfDownload: 'Download your chat sessions as professional PDF reports'
  };
  return descriptions[featureType as keyof typeof descriptions] || 'Access this premium feature';
};

// Check if user has access to feature
const checkFeatureAccess = (userProfile: any, featureType: string) => {
  if (!userProfile?.subscription) return { hasAccess: false, plan: 'BASIC' };
  
  const plan = userProfile.subscription.plan_type || 'BASIC';
  const planFeatures = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]?.features;
  
  if (!planFeatures) return { hasAccess: false, plan };
  
  const hasAccess = planFeatures[featureType as keyof typeof planFeatures] || false;
  return { hasAccess, plan };
};

// Get required plan for feature
const getRequiredPlan = (featureType: string, currentPlan: string) => {
  if (featureType === 'voiceMode') return 'PREMIUM';
  if (currentPlan === 'BASIC') return 'STANDARD';
  return 'PREMIUM';
};

function ConfirmationModal({ 
  isOpen, 
  onClose, 
  onSave, 
  isSaving, 
  documentName, 
  modal,
  paywall 
}: ConfirmationModalProps) {
  // Simple animation state
  const [isVisible, setIsVisible] = useState(false);

  // Handle modal visibility
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  // Don't render if not open
  if (!isOpen) return null;

  // Check if this should show paywall
  const shouldShowPaywall = paywall?.isPaywallFeature && paywall?.userProfile && paywall?.featureType;
  
  if (shouldShowPaywall) {
    const { hasAccess, plan } = checkFeatureAccess(paywall.userProfile, paywall.featureType || '');
    
    if (!hasAccess) {
      const requiredPlan = getRequiredPlan(paywall.featureType || '', plan);
      const CurrentPlanIcon = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]?.icon || Gift;
      const RequiredPlanIcon = SUBSCRIPTION_PLANS[requiredPlan as keyof typeof SUBSCRIPTION_PLANS]?.icon || Zap;
      
      return (
        <div 
          className={`fixed inset-0 z-50 p-4 transition-all duration-200 ease-out ${
            isVisible ? 'bg-black/60' : 'bg-black/0'
          }`}
          onClick={onClose}
        >
          <div className="flex items-center justify-center min-h-full">
            <div 
              className={`bg-primary rounded-2xl max-w-lg w-full p-6 relative border border-tertiary shadow-xl transition-all duration-200 ease-out transform ${
                isVisible 
                  ? 'scale-100 opacity-100' 
                  : 'scale-95 opacity-0'
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground mb-2">💎 Premium Feature Discovered!</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {getFeatureDescription(paywall.featureType || '')}
                </p>
              </div>

              {/* Current Plan vs Required Plan */}
              <div className="bg-accent rounded-lg p-4 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="text-center flex-1">
                    <span className="text-xs text-muted-foreground block mb-1">Your Current Plan</span>
                    <span className="px-3 py-1 bg-primary border border-tertiary text-foreground rounded-full text-sm font-medium flex items-center justify-center gap-1">
                      <CurrentPlanIcon className="w-3 h-3" />
                      {SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]?.name}
                    </span>
                    <div className="text-xs text-muted-foreground mt-1">{SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]?.price}</div>
                  </div>
                  
                  <div className="mx-4">
                    <div className="w-8 h-px bg-border relative">
                      <div className="absolute -right-1 -top-1 w-2 h-2 bg-border rotate-45"></div>
                    </div>
                  </div>
                  
                  <div className="text-center flex-1">
                    <span className="text-xs text-blue-600 block mb-1">Upgrade to</span>
                    <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full text-sm font-medium flex items-center justify-center gap-1">
                      <RequiredPlanIcon className="w-3 h-3" />
                      {SUBSCRIPTION_PLANS[requiredPlan as keyof typeof SUBSCRIPTION_PLANS]?.name}
                    </span>
                    <div className="text-xs text-blue-600 font-medium mt-1">{SUBSCRIPTION_PLANS[requiredPlan as keyof typeof SUBSCRIPTION_PLANS]?.price}</div>
                  </div>
                </div>
              </div>

              {/* Benefits */}
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-3 text-center">
                  🚀 What you'll unlock with {SUBSCRIPTION_PLANS[requiredPlan as keyof typeof SUBSCRIPTION_PLANS]?.name}:
                </h3>
                <div className="space-y-3">
                  {requiredPlan === 'STANDARD' && (
                    <>
                      <div className="flex items-center gap-3 p-2 bg-green-600/10 rounded-lg transition-colors duration-200 hover:bg-green-600/20">
                        <div className="w-6 h-6 bg-green-600/20 rounded-full flex items-center justify-center">
                          <DownloadCloud className="w-3 h-3 text-green-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground">1GB Secure Cloud Storage</span>
                          <p className="text-xs text-muted-foreground">Save and access your documents from anywhere</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-2 bg-blue-600/10 rounded-lg transition-colors duration-200 hover:bg-blue-600/20">
                        <div className="w-6 h-6 bg-blue-600/20 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-blue-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground">5,000 Tokens per Session</span>
                          <p className="text-xs text-muted-foreground">5x more AI conversations than Basic plan</p>
                        </div>
                      </div>
                    </>
                  )}
                  
                  {requiredPlan === 'PREMIUM' && (
                    <>
                      <div className="flex items-center gap-3 p-2 bg-purple-600/10 rounded-lg transition-colors duration-200 hover:bg-purple-600/20">
                        <div className="w-6 h-6 bg-purple-600/20 rounded-full flex items-center justify-center">
                          <Crown className="w-3 h-3 text-purple-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground">Unlimited AI Conversations</span>
                          <p className="text-xs text-muted-foreground">No token limits, chat as much as you want</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-2 bg-yellow-600/10 rounded-lg transition-colors duration-200 hover:bg-yellow-600/20">
                        <div className="w-6 h-6 bg-yellow-600/20 rounded-full flex items-center justify-center">
                          <Check className="w-3 h-3 text-yellow-600" />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-foreground">Voice Mode & All Features</span>
                          <p className="text-xs text-muted-foreground">Complete access to all Legalynx features</p>
                        </div>
                      </div>
                    </>
                  )}
                  
                  <div className="flex items-center gap-3 p-2 bg-green-600/10 rounded-lg transition-colors duration-200 hover:bg-green-600/20">
                    <div className="w-6 h-6 bg-green-600/20 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-green-600" />
                    </div>
                    <div>
                      <span className="text-sm font-medium text-foreground">Persistent Chat History</span>
                      <p className="text-xs text-muted-foreground">Never lose your important conversations</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Special Offer */}
              {requiredPlan === 'STANDARD' && (
                <div className="bg-gradient-to-r from-yellow-100 to-orange-100 border border-yellow-300 rounded-lg p-3 mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">🎉</span>
                    <span className="text-sm font-medium text-yellow-900">Limited Time Offer</span>
                  </div>
                  <p className="text-xs text-yellow-800">
                    Get your first month of Standard plan for 50% off! Only ₱75 for new subscribers.
                  </p>
                </div>
              )}

              {/* Action buttons */}
              <div className="space-y-3">
                <button 
                  onClick={() => paywall.onUpgrade?.()}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg cursor-pointer"
                >
                  🚀 Upgrade to {SUBSCRIPTION_PLANS[requiredPlan as keyof typeof SUBSCRIPTION_PLANS]?.name} - {SUBSCRIPTION_PLANS[requiredPlan as keyof typeof SUBSCRIPTION_PLANS]?.price}
                </button>
                
                {paywall.allowTemporary && (
                  <button 
                    onClick={() => onSave(true)}
                    className="w-full border border-border text-muted-foreground py-2 px-4 rounded-lg text-sm hover:bg-accent transition-colors duration-200 cursor-pointer"
                  >
                    Continue with temporary session
                  </button>
                )}
                
                <button 
                  onClick={onClose}
                  className="w-full text-muted-foreground py-2 px-4 rounded-lg text-sm hover:text-foreground transition-colors duration-200 cursor-pointer"
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
  }

  // Regular confirmation modal with simple animations
  return (
    <div 
      className={`fixed inset-0 z-50 transition-all duration-200 ease-out ${
        isVisible ? 'bg-black/40' : 'bg-black/0'
      }`}
      onClick={onClose}
    >
      <div className="flex items-center justify-center min-h-full p-4">
        <div 
          className={`bg-primary rounded-lg p-6 w-md mx-4 border border-tertiary max-w-md shadow-xl transition-all duration-200 ease-out transform ${
            isVisible 
              ? 'scale-100 opacity-100' 
              : 'scale-95 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-center mb-2">
            <div className={`p-3 rounded-full transition-colors duration-200 ${getColor(modal.type)}`}>
              {getIcon(modal.type)}
            </div>
          </div>
          
          <div className="text-center mb-6">
            <h3 className="text-2xl font-semibold text-foreground mb-2">{modal.header}</h3>
            {documentName && (
              <p className="text-sm text-muted-foreground mb-3 font-medium">"{documentName}"</p>
            )}
            <p className="text-muted-foreground text-sm">
              {modal.message}
            </p>
          </div>

          <div className="flex flex-row-reverse gap-2">
            <button
              onClick={() => onSave(true)}
              disabled={isSaving}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${getColor(modal.type)}`}
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {modal.trueButton}
                </>
              ) : (
                <>
                  {modal.trueButton}
                </>
              )}
            </button>
            
            <button
              onClick={onClose}
              disabled={isSaving}
              className="w-full px-4 py-3 text-foreground bg-tertiary hover:bg-accent rounded-md transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              {isSaving ? 'Please wait...' : modal.falseButton}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfirmationModal