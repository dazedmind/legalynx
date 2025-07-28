// src/app/backend/api/profile/remove-picture/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { S3Service } from '@/lib/s3';

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

// Helper function to extract S3 key from URL - IMPROVED VERSION
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
        if (key && key.startsWith('profile-pictures/')) {
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

// Helper function to delete profile picture from S3
async function deleteProfilePictureFromS3(profilePictureUrl: string) {
  // Skip deletion for external URLs or empty values
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
      console.log('🗑️ Deleting profile picture from S3:', s3Key);
      await S3Service.deleteFile(s3Key);
      console.log('✅ Profile picture deleted from S3 successfully');
    } else {
      console.warn('⚠️ Could not extract S3 key from URL:', profilePictureUrl);
      // Don't throw error - still update database
    }
  } catch (error) {
    console.error('❌ Failed to delete profile picture from S3:', error);
    // Don't throw error - we want to update the database even if S3 deletion fails
    // This prevents the "Failed to remove profile" error in the frontend
  }
}

// DELETE /backend/api/profile/remove-picture - Remove profile picture from S3 and database
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);
    
    console.log('🗑️ Removing profile picture for user:', user.id);
    console.log('📄 Current profile picture:', user.profile_picture);
    
    // Check if user has a profile picture
    if (!user.profile_picture) {
      return NextResponse.json(
        { error: 'No profile picture to remove' },
        { status: 400 }
      );
    }

    // Delete the profile picture from S3 (but don't fail if S3 deletion fails)
    await deleteProfilePictureFromS3(user.profile_picture);

    // Update user in database to remove profile picture
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        profile_picture: null,
        updated_at: new Date()
      }
    });

    // Log the removal
    await prisma.securityLog.create({
      data: {
        user_id: user.id,
        action: 'PROFILE_UPDATE',
        details: `Profile picture removed from S3 and database. Previous URL: ${user.profile_picture}`,
        ip_address: request.headers.get('x-forwarded-for') || 
                  request.headers.get('x-real-ip') || 
                  'unknown',
        user_agent: request.headers.get('user-agent') || 'unknown'
      }
    });

    console.log('✅ Profile picture removed successfully');

    return NextResponse.json({
      message: 'Profile picture removed successfully',
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        profile_picture: updatedUser.profile_picture
      }
    });

  } catch (error) {
    console.error('💥 Profile picture removal error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('No token provided') || error.message.includes('User not found')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to remove profile picture' },
      { status: 500 }
    );
  }
}