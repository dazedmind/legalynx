// /backend/api/user/settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Helper function to get user from token (consistent with your other routes)
async function getUserFromToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) {
    throw new Error('No token provided');
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    
    console.log('🔍 Fetching user settings for user:', user.id);
    
    const userSettings = await prisma.userSettings.findUnique({
      where: { user_id: user.id }, // Now user.id is guaranteed to exist
      select: {
        id: true,
        auto_rename_files: true,
        file_naming_format: true,
        file_naming_title: true,
        file_client_name: true,
        ai_personality: true,
        voice_enabled: true,
        file_retention_days: true,
        auto_delete_files: true,
        max_file_size_mb: true,
        two_factor_enabled: true,
        two_factor_secret: true,
        login_notifications: true,
        security_alerts: true,
        data_sharing_consent: true,
        analytics_consent: true,
        marketing_emails: true,
        theme: true,
        language: true,
        timezone: true,
        date_format: true,
        email_notifications: true,
        push_notifications: true,
        last_settings_update: true,
        created_at: true,
        updated_at: true
        // Removed 'user: true' - not needed since we already have the user
      }
    });

    // If no user settings exist, return default values
    if (!userSettings) {
      console.log('📝 No user settings found, returning defaults for user:', user.id);
      
      return NextResponse.json({
        // File Management Settings
        autoRenameFiles: false,
        fileNamingFormat: 'ORIGINAL',
        fileNamingTitle: null,
        fileClientName: null,
        fileRetentionDays: null,
        autoDeleteFiles: false,
        maxFileSizeMb: 50,
        
        // AI & Chat Settings
        aiPersonality: null,
        voiceEnabled: true,
        
        // Security Settings
        twoFactorEnabled: false,
        twoFactorSecret: null,
        loginNotifications: true,
        securityAlerts: true,
        
        // Privacy Settings
        dataSharingConsent: false,
        analyticsConsent: true,
        marketingEmails: false,
        
        // UI/UX Preferences
        theme: 'light',
        language: 'en',
        timeZone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        
        // Notification Settings
        emailNotifications: true,
        pushNotifications: false,
        
        // Metadata
        lastSettingsUpdate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    console.log('✅ User settings found for user:', user.id);

    // Convert snake_case to camelCase for frontend
    return NextResponse.json({
      // File Management Settings
      autoRenameFiles: userSettings.auto_rename_files,
      fileNamingFormat: userSettings.file_naming_format,
      fileNamingTitle: userSettings.file_naming_title,
      fileClientName: userSettings.file_client_name,
      fileRetentionDays: userSettings.file_retention_days,
      autoDeleteFiles: userSettings.auto_delete_files,
      maxFileSizeMb: userSettings.max_file_size_mb,
      
      // AI & Chat Settings
      aiPersonality: userSettings.ai_personality,
      voiceEnabled: userSettings.voice_enabled,
      
      // Security Settings
      twoFactorEnabled: userSettings.two_factor_enabled,
      twoFactorSecret: userSettings.two_factor_secret,
      loginNotifications: userSettings.login_notifications,
      securityAlerts: userSettings.security_alerts,
      
      // Privacy Settings
      dataSharingConsent: userSettings.data_sharing_consent,
      analyticsConsent: userSettings.analytics_consent,
      marketingEmails: userSettings.marketing_emails,
      
      // UI/UX Preferences
      theme: userSettings.theme,
      language: userSettings.language,
      timeZone: userSettings.timezone, // Note: DB field is 'timezone', not 'time_zone'
      dateFormat: userSettings.date_format,
      
      // Notification Settings
      emailNotifications: userSettings.email_notifications,
      pushNotifications: userSettings.push_notifications,
      
      // Metadata
      lastSettingsUpdate: userSettings.last_settings_update.toISOString(),
      createdAt: userSettings.created_at.toISOString(),
      updatedAt: userSettings.updated_at.toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error fetching user settings:', error);
    
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    if (error instanceof Error && error.message === 'User not found') {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch user settings' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const body = await request.json();
    
    console.log('🔄 Updating user settings for user:', user.id);
    
    // Convert camelCase from frontend to snake_case for database
    const updateData: any = {};
    
    // File Management Settings
    if (body.autoRenameFiles !== undefined) updateData.auto_rename_files = body.autoRenameFiles;
    if (body.fileNamingFormat !== undefined) updateData.file_naming_format = body.fileNamingFormat;
    if (body.fileNamingTitle !== undefined) updateData.file_naming_title = body.fileNamingTitle;
    if (body.fileClientName !== undefined) updateData.file_client_name = body.fileClientName;
    if (body.fileRetentionDays !== undefined) updateData.file_retention_days = body.fileRetentionDays;
    if (body.autoDeleteFiles !== undefined) updateData.auto_delete_files = body.autoDeleteFiles;
    if (body.maxFileSizeMb !== undefined) updateData.max_file_size_mb = body.maxFileSizeMb;
    
    // AI & Chat Settings
    if (body.aiPersonality !== undefined) updateData.ai_personality = body.aiPersonality;
    if (body.voiceEnabled !== undefined) updateData.voice_enabled = body.voiceEnabled;
    
    // Security Settings
    if (body.twoFactorEnabled !== undefined) updateData.two_factor_enabled = body.twoFactorEnabled;
    if (body.twoFactorSecret !== undefined) updateData.two_factor_secret = body.twoFactorSecret;
    if (body.loginNotifications !== undefined) updateData.login_notifications = body.loginNotifications;
    if (body.securityAlerts !== undefined) updateData.security_alerts = body.securityAlerts;
    
    // Privacy Settings
    if (body.dataSharingConsent !== undefined) updateData.data_sharing_consent = body.dataSharingConsent;
    if (body.analyticsConsent !== undefined) updateData.analytics_consent = body.analyticsConsent;
    if (body.marketingEmails !== undefined) updateData.marketing_emails = body.marketingEmails;
    
    // UI/UX Preferences
    if (body.theme !== undefined) updateData.theme = body.theme;
    if (body.language !== undefined) updateData.language = body.language;
    if (body.timeZone !== undefined) updateData.timezone = body.timeZone; // Note: DB field is 'timezone'
    if (body.dateFormat !== undefined) updateData.date_format = body.dateFormat;
    
    // Notification Settings
    if (body.emailNotifications !== undefined) updateData.email_notifications = body.emailNotifications;
    if (body.pushNotifications !== undefined) updateData.push_notifications = body.pushNotifications;
    
    // Always update the last_settings_update timestamp
    updateData.last_settings_update = new Date();

    // Use upsert to create or update user settings
    const userSettings = await prisma.userSettings.upsert({
      where: { user_id: user.id },
      create: {
        user_id: user.id,
        ...updateData
      },
      update: updateData,
      select: {
        id: true,
        auto_rename_files: true,
        file_naming_format: true,
        file_naming_title: true,
        file_client_name: true,
        ai_personality: true,
        voice_enabled: true,
        file_retention_days: true,
        auto_delete_files: true,
        max_file_size_mb: true,
        two_factor_enabled: true,
        login_notifications: true,
        security_alerts: true,
        data_sharing_consent: true,
        analytics_consent: true,
        marketing_emails: true,
        theme: true,
        language: true,
        timezone: true,
        date_format: true,
        email_notifications: true,
        push_notifications: true,
        last_settings_update: true,
        updated_at: true
      }
    });

    console.log('✅ User settings updated for user:', user.id);

    // Convert back to camelCase for response
    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: {
        autoRenameFiles: userSettings.auto_rename_files,
        fileNamingFormat: userSettings.file_naming_format,
        fileNamingTitle: userSettings.file_naming_title,
        fileClientName: userSettings.file_client_name,
        fileRetentionDays: userSettings.file_retention_days,
        autoDeleteFiles: userSettings.auto_delete_files,
        maxFileSizeMb: userSettings.max_file_size_mb,
        aiPersonality: userSettings.ai_personality,
        voiceEnabled: userSettings.voice_enabled,
        twoFactorEnabled: userSettings.two_factor_enabled,
        loginNotifications: userSettings.login_notifications,
        securityAlerts: userSettings.security_alerts,
        dataSharingConsent: userSettings.data_sharing_consent,
        analyticsConsent: userSettings.analytics_consent,
        marketingEmails: userSettings.marketing_emails,
        theme: userSettings.theme,
        language: userSettings.language,
        timeZone: userSettings.timezone,
        dateFormat: userSettings.date_format,
        emailNotifications: userSettings.email_notifications,
        pushNotifications: userSettings.push_notifications,
        lastSettingsUpdate: userSettings.last_settings_update.toISOString(),
        updatedAt: userSettings.updated_at.toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error updating user settings:', error);
    
    if (error instanceof Error && error.message === 'No token provided') {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }
    
    return NextResponse.json(
      { error: 'Failed to update user settings' },
      { status: 500 }
    );
  }
}