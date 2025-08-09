// Appearance.tsx - Theme and appearance customization component
'use client';
import React, { useState, useEffect } from 'react';
import { 
  Palette, 
  Sun, 
  Moon, 
  Sunset, 
  Check,
  RefreshCw
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAuth } from '@/lib/context/AuthContext';
import { toast } from 'sonner';

interface ThemeOption {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  preview: {
    background: string;
    foreground: string;
    accent: string;
    border: string;
  };
}

interface AppearanceSettings {
  theme: string;
  fontSize: 'small' | 'medium' | 'large';
  eyeStrainReduction: boolean;
  compactMode: boolean;
}

export default function Appearance() {
  const { theme, setTheme, themes } = useTheme();
  const { user } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [settings, setSettings] = useState<AppearanceSettings>({
    theme: 'system',
    fontSize: 'medium',
    eyeStrainReduction: false,
    compactMode: false
  });

  // Theme options with previews
  const themeOptions: ThemeOption[] = [
    {
      id: 'light',
      name: 'Light',
      description: 'Clean and bright interface',
      icon: <Sun className="w-5 h-5" />,
      preview: {
        background: '#ffffff',
        foreground: '#0f172a',
        accent: '#3b82f6',
        border: '#e2e8f0'
      }
    },
    {
      id: 'dark',
      name: 'Dark',
      description: 'Easy on the eyes in low light',
      icon: <Moon className="w-5 h-5" />,
      preview: {
        background: '#0f172a',
        foreground: '#f8fafc',
        accent: '#3b82f6',
        border: '#334155'
      }
    },
    {
        id: 'sunset',
        name: 'Sunset',
        description: 'Reduced blue light for comfort',
        icon: <Sunset className="w-5 h-5" />,
        preview: {
          background: '#fefce8',
          foreground: '#365314',
          accent: '#eab308',
          border: '#d4d4aa'
        }
      },
  ];

  // Load settings on mount
  useEffect(() => {
    setMounted(true);
    loadAppearanceSettings();
  }, []);

  // ✅ FIXED: Custom theme application effect
  useEffect(() => {
    if (mounted && settings.theme) {
      // Apply the theme using next-themes
      setTheme(settings.theme);
      
      // ✅ FIXED: Manually apply custom theme data attributes
      applyCustomTheme(settings.theme);
      
      // Apply additional appearance modifications
      applyAppearanceModifications();
    }
  }, [settings, mounted, setTheme]);

  // ✅ FIXED: Function to apply custom themes manually
  const applyCustomTheme = (themeName: string) => {
    const html = document.documentElement;
    
    // Remove any existing custom theme attributes
    html.removeAttribute('data-theme');
    
    // Apply custom theme if it's one of our special themes
    if (themeName === 'sunset') {
      html.setAttribute('data-theme', 'sunset');
    }
    // Note: light and dark themes are handled by next-themes automatically
  };

  const loadAppearanceSettings = () => {
    try {
      const savedSettings = localStorage.getItem('appearance-settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({
          ...settings,
          ...parsed,
          theme: theme || 'system'
        });
      } else {
        setSettings(prev => ({ ...prev, theme: theme || 'system' }));
      }
    } catch (error) {
      console.error('Failed to load appearance settings:', error);
      toast.error('Failed to load appearance settings');
    }
  };

  const saveAppearanceSettings = async (newSettings: Partial<AppearanceSettings>) => {
    setIsLoading(true);
    try {
      const updatedSettings = { ...settings, ...newSettings };
      setSettings(updatedSettings);
      
      localStorage.setItem('appearance-settings', JSON.stringify(updatedSettings));
      
      // If user is authenticated, also save to server
      if (user) {
        try {
          const response = await fetch('/backend/api/user/appearance', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify(updatedSettings)
          });

          if (!response.ok) {
            console.warn('Failed to sync appearance settings to server');
          }
        } catch (error) {
          console.warn('Failed to sync appearance settings:', error);
        }
      }
      
      toast.success('Appearance settings saved');
    } catch (error) {
      console.error('Failed to save appearance settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };

  const applyAppearanceModifications = () => {
    const root = document.documentElement;
    
    // Apply font size
    root.classList.remove('text-sm', 'text-base', 'text-lg');
    switch (settings.fontSize) {
      case 'small':
        root.classList.add('text-sm');
        break;
      case 'large':
        root.classList.add('text-lg');
        break;
      default:
        root.classList.add('text-base');
    }
    

    // Apply eye strain reduction (yellow tint filter)
    if (settings.eyeStrainReduction) {
      root.style.setProperty('--eye-strain-filter', 'sepia(10%) saturate(90%) hue-rotate(15deg)');
      document.body.style.filter = 'var(--eye-strain-filter)';
    } else {
      root.style.removeProperty('--eye-strain-filter');
      document.body.style.filter = 'none';
    }
    
    // Apply compact mode
    if (settings.compactMode) {
      root.classList.add('compact-mode');
    } else {
      root.classList.remove('compact-mode');
    }
  };

  const handleThemeChange = (themeId: string) => {
    saveAppearanceSettings({ theme: themeId });
  };

  const handleToggleSetting = (setting: keyof AppearanceSettings) => {
    const newValue = !settings[setting];
    saveAppearanceSettings({ [setting]: newValue });
  };

  const handleFontSizeChange = (size: 'small' | 'medium' | 'large') => {
    saveAppearanceSettings({ fontSize: size });
  };

  const resetToDefaults = () => {
    const defaultSettings: AppearanceSettings = {
      theme: 'light',
      fontSize: 'medium',
      eyeStrainReduction: false,
      compactMode: false
    };
    
    saveAppearanceSettings(defaultSettings);
    toast.success('Settings reset to defaults');
  };

  if (!mounted) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-full bg-primary overflow-y-auto">
      <div className="p-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold font-serif text-foreground">Appearance</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Customize the look and feel of your interface to match your preferences and needs.
          </p>
        </div>

        <div className="space-y-6 mt-6">
          {/* Theme Selection */}
          <section className="bg-primary border border-tertiary rounded-lg p-6">
            <h2 className="text-xl font-semibold font-serif text-foreground mb-4 flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Theme
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              Choose a color scheme that works best for you.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {themeOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleThemeChange(option.id)}
                  className={`relative p-4 rounded-lg border-2 transition-all duration-200 text-left cursor-pointer hover:shadow-md ${
                    settings.theme === option.id
                      ? 'border-blue-500 bg-blue/10'
                      : 'border-tertiary hover:border-blue-300'
                  }`}
                  disabled={isLoading}
                >
                  {/* Theme Preview */}
                  <div className="mb-3 h-16 rounded overflow-hidden border border-tertiary">
                    <div 
                      className="h-full w-full flex"
                      style={{ background: option.preview.background }}
                    >
                      <div className="flex-1 p-2">
                        <div 
                          className="w-full h-2 rounded mb-1"
                          style={{ backgroundColor: option.preview.accent }}
                        />
                        <div 
                          className="w-3/4 h-1 rounded"
                          style={{ backgroundColor: option.preview.foreground, opacity: 0.6 }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {option.icon}
                      <span className="font-medium text-foreground">{option.name}</span>
                    </div>
                    {settings.theme === option.id && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{option.description}</p>
                </button>
              ))}
            </div>
          </section>

          {/* Font Size */}
          <section className="bg-primary border border-tertiary rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Font Size</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Adjust the text size for better readability.
            </p>
            
            <div className="flex gap-3">
              {[
                { id: 'small', label: 'Small', sample: 'The quick brown fox' },
                { id: 'medium', label: 'Medium', sample: 'The quick brown fox' },
                { id: 'large', label: 'Large', sample: 'The quick brown fox' }
              ].map((size) => (
                <button
                  key={size.id}
                  onClick={() => handleFontSizeChange(size.id as any)}
                  className={`flex-1 p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                    settings.fontSize === size.id
                      ? 'border-blue-500 bg-blue/10'
                      : 'border-tertiary hover:border-blue-300'
                  }`}
                  disabled={isLoading}
                >
                  <div className="text-center">
                    <p className="font-medium text-foreground mb-2">{size.label}</p>
                    <p 
                      className={`text-muted-foreground ${
                        size.id === 'small' ? 'text-sm' :
                        size.id === 'large' ? 'text-lg' : 'text-base'
                      }`}
                    >
                      {size.sample}
                    </p>
                    {settings.fontSize === size.id && (
                      <Check className="w-5 h-5 text-blue-600 mx-auto mt-2" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Reset Section */}
          <section className="bg-primary border border-tertiary rounded-lg p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4">Reset Settings</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Restore all appearance settings to their default values.
            </p>
            <button
              onClick={resetToDefaults}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-foreground rounded-lg hover:bg-yellow-500/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Reset to Defaults
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}