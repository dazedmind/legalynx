
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

    console.log('🔍 Getting storage for user:', user.id);

    // Calculate total storage used by user's documents
    const storageStats = await prisma.document.aggregate({
      where: {
        owner_id: user.id,
        status: {
          in: ['INDEXED', 'PROCESSED', 'TEMPORARY'] // ✅ Include TEMPORARY for testing
        },
      },
      _sum: {
        file_size: true
      },
      _count: {
        id: true
      }
    });

    // Get all documents for debugging
    const allDocuments = await prisma.document.findMany({
      where: { owner_id: user.id },
      select: {
        id: true,
        original_file_name: true,
        file_size: true,
        status: true,
        uploaded_at: true
      }
    });

    console.log('📊 Found documents:', allDocuments.length);
    console.log('📄 Documents:', allDocuments.map(d => ({
      name: d.original_file_name,
      size_mb: (d.file_size / (1024 * 1024)).toFixed(2),
      status: d.status
    })));

    const userSubscription = await prisma.subscription.findUnique({
      where: {
        user_id: user.id
      }
    });

    console.log('📋 User subscription:', userSubscription?.plan_type);

    // Calculate used storage
    const usedBytes = storageStats._sum.file_size || 0;
    console.log('💾 Total used bytes:', usedBytes, 'MB:', (usedBytes / (1024 * 1024)).toFixed(2));

    // ✅ FIXED: Correct storage limits based on plan
    let totalBytes = 50 * 1024 * 1024; // Default 50MB for BASIC
    let totalGB = 0.05; // 50MB as GB
    let unit = 'MB';

    switch (userSubscription?.plan_type) {
      case 'BASIC':
        totalBytes = 50 * 1024 * 1024; // 50MB
        totalGB = 0.05;
        unit = 'MB';
        break;
      case 'STANDARD':
        totalBytes = 1024 * 1024 * 1024; // 1GB  
        totalGB = 1;
        unit = 'GB';
        break;
      case 'PREMIUM':
        totalBytes = 10 * 1024 * 1024 * 1024; // 10GB
        totalGB = 10;
        unit = 'GB';
        break;
      default:
        totalBytes = 50 * 1024 * 1024; // 50MB
        totalGB = 0.05;
        unit = 'MB';
    }

    // Calculate in appropriate units
    let usedInUnit, totalInUnit;
    if (unit === 'MB') {
      usedInUnit = usedBytes / (1024 * 1024); // Convert to MB
      totalInUnit = totalBytes / (1024 * 1024); // Convert to MB
    } else {
      usedInUnit = usedBytes / (1024 * 1024 * 1024); // Convert to GB
      totalInUnit = totalGB; // Already in GB
    }

    const availableInUnit = Math.max(0, totalInUnit - usedInUnit);
    const usagePercentage = totalInUnit > 0 ? (usedInUnit / totalInUnit) * 100 : 0;

    console.log('📈 Storage calculation:', {
      usedBytes,
      totalBytes,
      usedInUnit: usedInUnit.toFixed(3),
      totalInUnit,
      unit,
      percentage: usagePercentage.toFixed(1)
    });

    // Get document breakdown
    const documentStats = await prisma.document.groupBy({
      by: ['mime_type'],
      where: {
        owner_id: user.id,
        status: {
          in: ['INDEXED', 'PROCESSED', 'TEMPORARY']
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
      size_mb: (stat._sum.file_size || 0) / (1024 * 1024),
      size_bytes: stat._sum.file_size || 0
    }));

    // Get recent large files (top 10 by size)
    const largeFiles = await prisma.document.findMany({
      where: {
        owner_id: user.id,
        status: {
          in: ['INDEXED', 'PROCESSED', 'TEMPORARY']
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

    const response = {
      // ✅ Return values in the unit appropriate for the plan
      used_gb: unit === 'MB' ? usedInUnit / 1024 : usedInUnit, // Always GB for compatibility
      used_mb: usedInUnit, // In plan's unit
      total_gb: totalGB,
      total_mb: totalInUnit, // In plan's unit
      available_gb: unit === 'MB' ? availableInUnit / 1024 : availableInUnit,
      available_mb: availableInUnit, // In plan's unit
      usage_percentage: parseFloat(usagePercentage.toFixed(1)),
      total_documents: storageStats._count.id,
      document_breakdown: documentBreakdown,
      largest_files: formattedLargeFiles,
      plan_type: userSubscription?.plan_type || 'BASIC',
      storage_unit: unit,
      last_calculated: new Date().toISOString(),
      
      // Debug info
      debug: {
        total_docs_found: allDocuments.length,
        used_bytes: usedBytes,
        total_bytes: totalBytes
      }
    };

    console.log('📤 Sending response:', response);

    return NextResponse.json(response);

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