// src/app/backend/api/profile/picture-url/route.ts
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

// GET /backend/api/profile/picture-url - Get presigned URL for profile picture
export async function GET(request: NextRequest) {
  try {
    console.log('🔗 Getting presigned URL for profile picture...');
    
    const user = await getUserFromToken(request);
    console.log('✅ User authenticated:', user.id);
    
    if (!user.profile_picture) {
      console.log('❌ No profile picture found for user');
      return NextResponse.json(
        { error: 'No profile picture found' },
        { status: 404 }
      );
    }

    console.log('📄 Current profile picture URL:', user.profile_picture);

    // Extract S3 key from the stored URL
    const s3Key = extractS3KeyFromUrl(user.profile_picture);
    console.log('🔑 Extracted S3 key:', s3Key);
    
    if (!s3Key) {
      console.log('❌ Could not extract S3 key from URL');
      return NextResponse.json(
        { error: 'Invalid profile picture URL' },
        { status: 400 }
      );
    }

    // Check if file exists in S3
    const fileExists = await S3Service.fileExists(s3Key);
    if (!fileExists) {
      console.log('❌ File does not exist in S3:', s3Key);
      return NextResponse.json(
        { error: 'Profile picture file not found in storage' },
        { status: 404 }
      );
    }

    // Generate presigned URL valid for 1 hour
    console.log('🔗 Generating presigned URL...');
    const presignedUrl = await S3Service.getPresignedDownloadUrl(s3Key, undefined, 3600);
    console.log('✅ Presigned URL generated successfully');
    
    return NextResponse.json({
      presignedUrl,
      expiresIn: 3600,
      s3Key
    });

  } catch (error) {
    console.error('💥 Failed to generate presigned URL:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('No token provided') || error.message.includes('User not found')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      
      // Return specific error for debugging
      return NextResponse.json(
        { error: `Failed to generate image URL: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to generate image URL' },
      { status: 500 }
    );
  }
}