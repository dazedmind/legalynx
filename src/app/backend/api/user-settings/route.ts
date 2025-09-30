// src/app/backend/api/user-settings/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';

// Helper function to get user from token
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

// GET /backend/api/user-settings - Get user settings
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);

    // Get user settings
    const settings = await prisma.userSettings.findUnique({
      where: { user_id: user.id },
      select: {
        
        // File Management Settings
        auto_rename_files: true,
        file_naming_format: true,
        file_retention_days: true,
        auto_delete_files: true,
        
        // Security Settings
        two_factor_enabled: true,
        
        // UI/UX Preferences
        theme: true,
        date_format: true,
        
        // Timestamps
        last_settings_update: true,
        created_at: true,
        updated_at: true,
      }
    });

    // If no settings exist, return default values
    if (!settings) {
      return NextResponse.json({
        // File Management Settings defaults
        auto_rename_files: false,
        file_naming_format: 'ORIGINAL',
        file_retention_days: null,
        auto_delete_files: false,
        
        // AI & Chat Settings defaults
        
        
        // Security Settings defaults
        two_factor_enabled: false,
        
        // Privacy Settings defaults
        
        
        // UI/UX Preferences defaults
        theme: 'light',
        date_format: 'MM/DD/YYYY',
        
        // Notification Settings defaults
      }, { status: 200 });
    }

    return NextResponse.json(settings);

  } catch (error) {
    console.error('Get user settings error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('No token provided') || error.message.includes('User not found')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to get user settings' }, 
      { status: 500 }
    );
  }
}

// POST /backend/api/user-settings - Create or update user settings
export async function POST(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    const body = await request.json();

    // Validate input data
    const allowedFields = [
      'auto_rename_files', 'file_naming_format', 'file_retention_days', 'auto_delete_files', 
      'theme', 'date_format',
    ];

    // Filter out any fields that aren't allowed
    const updateData: any = {};
    for (const [key, value] of Object.entries(body)) {
      if (allowedFields.includes(key)) {
        updateData[key] = value;
      }
    }

    // Add timestamp
    updateData.last_settings_update = new Date();

    // Upsert user settings (create or update)
    const settings = await prisma.userSettings.upsert({
      where: { user_id: user.id },
      update: updateData,
      create: {
        user_id: user.id,
        ...updateData,
      },
    });

    // Log settings update
    await prisma.securityLog.create({
      data: {
        user_id: user.id,
        action: 'PROFILE_UPDATE',
        details: `Updated user settings: ${Object.keys(updateData).join(', ')}`,
        ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      message: 'Settings updated successfully',
      settings: settings
    });

  } catch (error) {
    console.error('Update user settings error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('No token provided') || error.message.includes('User not found')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to update user settings' }, 
      { status: 500 }
    );
  }
}

// DELETE /backend/api/user-settings - Reset user settings to defaults
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);

    // Delete user settings (will reset to defaults)
    await prisma.userSettings.delete({
      where: { user_id: user.id }
    });

    // Log settings reset
    await prisma.securityLog.create({
      data: {
        user_id: user.id,
        action: 'PROFILE_UPDATE',
        details: 'Reset user settings to defaults',
        ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    return NextResponse.json({
      message: 'Settings reset to defaults successfully'
    });

  } catch (error) {
    console.error('Reset user settings error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('No token provided') || error.message.includes('User not found')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      if (error.message.includes('Record to delete does not exist')) {
        return NextResponse.json({ error: 'No settings found to reset' }, { status: 404 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to reset user settings' }, 
      { status: 500 }
    );
  }
}