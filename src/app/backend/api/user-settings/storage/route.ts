// src/app/backend/api/user-settings/storage/route.ts
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

// GET /backend/api/user-settings/storage - Get user storage information
export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromToken(request);

    // Calculate total storage used by user's documents
    const storageStats = await prisma.document.aggregate({
      where: {
        owner_id: user.id,
        status: {
          in: ['INDEXED', 'PROCESSED'] // Only count saved documents
        },
      },
      _sum: {
        file_size: true
      },
      _count: {
        id: true
      }
    });

    const userSubsciprtion = await prisma.subscription.findUnique({
      where: {
        user_id: user.id
      }
    });

    // Calculate used storage in GB
    const usedBytes = storageStats._sum.file_size || 0;
    const usedGB = usedBytes / (1024 * 1024 * 1024); // Convert bytes to GB

    // Get user's storage limit based on subscription
    let totalGB = 10; // Default for BASIC
    switch (userSubsciprtion?.plan_type) {
      case 'BASIC':
        totalGB = 500;
        break;
      case 'STANDARD':
        totalGB = 1;
        break;
      case 'PREMIUM':
        totalGB = 10;
        break;
      default:
        totalGB = 10;
    }

    const availableGB = Math.max(0, totalGB - usedGB);

    // Get document breakdown
    const documentStats = await prisma.document.groupBy({
      by: ['mime_type'],
      where: {
        owner_id: user.id,
        status: {
          in: ['INDEXED', 'PROCESSED']
        }
      },
      _sum: {
        file_size: true
      },
      _count: {
        id: true
      }
    });

    // Format document breakdown
    const documentBreakdown = documentStats.map(stat => ({
      file_type: stat.mime_type,
      count: stat._count.id,
      size_gb: (stat._sum.file_size || 0) / (1024 * 1024 * 1024),
      size_bytes: stat._sum.file_size || 0
    }));

    // Get recent large files (top 10 by size)
    const largeFiles = await prisma.document.findMany({
      where: {
        owner_id: user.id,
        status: {
          in: ['INDEXED', 'PROCESSED']
        }
      },
      select: {
        id: true,
        original_file_name: true,
        file_size: true,
        uploaded_at: true,
        mime_type: true
      },
      orderBy: {
        file_size: 'desc'
      },
      take: 10
    });

    const formattedLargeFiles = largeFiles.map(file => ({
      id: file.id,
      name: file.original_file_name,
      size_mb: (file.file_size / (1024 * 1024)).toFixed(2),
      size_bytes: file.file_size,
      uploaded_at: file.uploaded_at,
      file_type: file.mime_type
    }));

    return NextResponse.json({
      used_gb: parseFloat(usedGB.toFixed(3)),
      total_gb: totalGB,
      available_gb: parseFloat(availableGB.toFixed(3)),
      usage_percentage: parseFloat(((usedGB / totalGB) * 100).toFixed(1)),
      total_documents: storageStats._count.id,
      document_breakdown: documentBreakdown,
      largest_files: formattedLargeFiles,
      last_calculated: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get storage info error:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('No token provided') || error.message.includes('User not found')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
    }
    
    return NextResponse.json(
      { error: 'Failed to get storage information' }, 
      { status: 500 }
    );
  }
}