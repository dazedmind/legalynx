// src/app/backend/api/profile/upload-picture/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { S3Service } from '@/lib/s3';
import path from 'path';

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

// Helper function to validate image file
function validateImageFile(file: File): { valid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'Only JPEG, PNG, GIF, and WebP images are allowed' };
  }

  // Check file size (5MB limit)
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return { valid: false, error: 'Image must be less than 5MB' };
  }

  return { valid: true };
}

// Helper function to extract S3 key from URL
function extractS3KeyFromUrl(url: string): string | null {
  if (!url) return null;
  
  try {
    // If it starts with profile-pictures/, it's already a key
    if (url.startsWith('profile-pictures/')) {
      return url;
    }
    
    // Handle different S3 URL formats
    const patterns = [
      // Pattern 1: https://bucket.s3.region.amazonaws.com/key
      /https:\/\/([^.]+)\.s3\.([^.]+)\.amazonaws\.com\/(.+)/,
      // Pattern 2: https://s3.region.amazonaws.com/bucket/key  
      /https:\/\/s3\.([^.]+)\.amazonaws\.com\/([^/]+)\/(.+)/,
      // Pattern 3: https://bucket.s3.amazonaws.com/key (no region)
      /https:\/\/([^.]+)\.s3\.amazonaws\.com\/(.+)/,
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        // For pattern 1 and 3: match[3] or match[2] is the key
        // For pattern 2: match[3] is the key  
        const key = match[3] || match[2];
        if (key) {
          return key;
        }
      }
    }
    
    // If URL contains profile-pictures path, try to extract it
    const profilePicturesIndex = url.indexOf('profile-pictures/');
    if (profilePicturesIndex !== -1) {
      return url.substring(profilePicturesIndex);
    }
    
    console.warn('⚠️ Could not extract S3 key from URL:', url);
    return null;
  } catch (error) {
    console.error('❌ Error extracting S3 key from URL:', error);
    return null;
  }
}

// Helper function to delete old profile picture from S3
async function deleteOldProfilePictureFromS3(profilePictureUrl: string) {
  if (!profilePictureUrl) {
    console.log('⏭️ No profile picture URL to delete');
    return;
  }
  
  if (profilePictureUrl.startsWith('http://') && !profilePictureUrl.includes('s3')) {
    console.log('⏭️ Skipping S3 deletion for external URL:', profilePictureUrl);
    return; // Don't delete external URLs that aren't S3
  }

  try {
    const s3Key = extractS3KeyFromUrl(profilePictureUrl);
    if (s3Key) {
      console.log('🗑️ Deleting old profile picture from S3:', s3Key);
      await S3Service.deleteFile(s3Key);
      console.log('✅ Old profile picture deleted from S3 successfully');
    } else {
      console.warn('⚠️ Could not extract S3 key from URL:', profilePictureUrl);
    }
  } catch (error) {
    console.error('❌ Failed to delete old profile picture from S3:', error);
    // Don't throw error - we want to continue with upload even if deletion fails
  }
}

// POST /backend/api/profile/upload-picture - Upload profile picture to S3
export async function POST(request: NextRequest) {
  console.log('🚀 Profile picture upload started');
  
  try {
    console.log('🔐 Getting user from token...');
    const user = await getUserFromToken(request);
    console.log('✅ User authenticated:', user.id);
    
    // Parse form data
    console.log('📋 Parsing form data...');
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      console.log('❌ No file provided');
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    console.log('📤 Uploading profile picture for user:', user.id);
    console.log('📄 File details:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024 / 1024).toFixed(2)}MB`
    });

    // Validate file
    console.log('✅ Validating file...');
    const validation = validateImageFile(file);
    if (!validation.valid) {
      console.log('❌ File validation failed:', validation.error);
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Delete old profile picture from S3 if exists
    if (user.profile_picture) {
      console.log('🗑️ Deleting old profile picture...');
      await deleteOldProfilePictureFromS3(user.profile_picture);
    }

    // Convert file to buffer
    console.log('🔄 Converting file to buffer...');
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    console.log('📦 Buffer created, size:', fileBuffer.length, 'bytes');

    // Upload to S3 using the updated S3Service
    console.log('☁️ Starting S3 upload...');
    const s3Result = await S3Service.uploadFile(
      fileBuffer, 
      file.name, 
      file.type, 
      user.id, 
      'profile-pictures'
    );
    console.log('✅ Uploaded to S3:', s3Result);

    // Update user in database with S3 URL
    console.log('💾 Updating database...');
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        profile_picture: s3Result.url, // S3UploadResult has url property
        updated_at: new Date()
      }
    });
    console.log('✅ Database updated successfully');

    // Log the update for security tracking
    await prisma.securityLog.create({
      data: {
        user_id: user.id,
        action: 'PROFILE_UPDATE',
        details: `Profile picture updated and stored in S3: ${s3Result.key}`,
        ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    console.log('✅ Profile picture upload completed successfully');

    return NextResponse.json({
      message: 'Profile picture updated successfully',
      profile_picture_url: s3Result.url, // Return the direct S3 URL
      s3_key: s3Result.key,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        profile_picture: updatedUser.profile_picture
      }
    });

  } catch (error) {
    console.error('💥 Profile picture upload error:', error);
    console.error('❌ Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    if (error instanceof Error) {
      if (error.message.includes('No token provided') || error.message.includes('User not found')) {
        console.log('🔐 Authentication error');
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      if (error.message.includes('Failed to upload file to S3')) {
        console.log('☁️ S3 upload error');
        return NextResponse.json({ error: 'Failed to upload to cloud storage' }, { status: 500 });
      }
      if (error.message.includes('AccessControlListNotSupported')) {
        console.log('⚠️ S3 ACL error - this should be fixed with bucket policy');
        return NextResponse.json({ error: 'S3 configuration error. Please check bucket policy.' }, { status: 500 });
      }
      
      // Return the actual error message for debugging
      return NextResponse.json(
        { error: `Upload failed: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to upload profile picture' },
      { status: 500 }
    );
  }
}