// COMPLETE FILE: src/app/backend/api/user-settings/storage/route.ts

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
    where: { id: decoded.userId },
    include: {
      subscription: true
    }
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

// GET /backend/api/user-settings/storage - Get storage information
export async function GET(request: NextRequest) {
  try {
    console.log('📊 Getting storage info...');
    
    const user = await getUserFromToken(request);
    console.log('👤 User found:', user.id);

    // Get user's subscription for plan limits
    const userSubscription = await prisma.subscription.findUnique({
      where: { user_id: user.id }
    });

    const planType = userSubscription?.plan_type || 'BASIC';
    console.log('📋 Plan type:', planType);

    // Calculate storage limits based on plan
    const getStorageLimits = (plan: string) => {
      switch (plan.toUpperCase()) {
        case 'PREMIUM':
          return {
            totalBytes: 10 * 1024 * 1024 * 1024, // 10GB
            totalGB: 10,
            totalMB: 10 * 1024,
            unit: 'GB'
          };
        case 'STANDARD':
          return {
            totalBytes: 1 * 1024 * 1024 * 1024, // 1GB
            totalGB: 1,
            totalMB: 1024,
            unit: 'GB'
          };
        case 'BASIC':
        default:
          return {
            totalBytes: 100 * 1024 * 1024, // 100MB
            totalGB: 0.1,
            totalMB: 100,
            unit: 'MB'
          };
      }
    };

    const limits = getStorageLimits(planType);
    console.log('📏 Storage limits:', limits);

    // Get all user's documents with file sizes
    const allDocuments = await prisma.document.findMany({
      where: { 
        owner_id: user.id,
        status: { in: ['INDEXED', 'PROCESSED', 'TEMPORARY'] }
      },
      select: {
        id: true,
        file_name: true,
        original_file_name: true,
        file_size: true,
        status: true,
        uploaded_at: true,
        mime_type: true
      },
      orderBy: { file_size: 'desc' }
    });

    console.log(`📁 Found ${allDocuments.length} documents`);

    // Calculate total storage used
    const usedBytes = allDocuments.reduce((total, doc) => {
      const size = doc.file_size || 0;
      return total + size;
    }, 0);

    console.log('💾 Used bytes:', usedBytes);

    // Calculate usage metrics
    const usedGB = usedBytes / (1024 * 1024 * 1024);
    const usedMB = usedBytes / (1024 * 1024);
    const availableBytes = Math.max(0, limits.totalBytes - usedBytes);
    const availableGB = availableBytes / (1024 * 1024 * 1024);
    const availableMB = availableBytes / (1024 * 1024);
    const usagePercentage = limits.totalBytes > 0 ? (usedBytes / limits.totalBytes) * 100 : 0;

    // Get storage stats
    const storageStats = await prisma.document.aggregate({
      where: { 
        owner_id: user.id,
        status: { in: ['INDEXED', 'PROCESSED', 'TEMPORARY'] }
      },
      _count: { id: true },
      _avg: { file_size: true },
      _max: { file_size: true },
      _sum: { file_size: true }
    });

    // Get document breakdown by type
    const documentBreakdown = await prisma.document.groupBy({
      by: ['mime_type'],
      where: { 
        owner_id: user.id,
        status: { in: ['INDEXED', 'PROCESSED', 'TEMPORARY'] }
      },
      _count: { id: true },
      _sum: { file_size: true }
    });

    // Format document breakdown
    const formattedBreakdown = documentBreakdown.map(item => ({
      type: item.mime_type || 'unknown',
      count: item._count.id,
      total_size: item._sum.file_size || 0,
      size_mb: ((item._sum.file_size || 0) / (1024 * 1024)).toFixed(2)
    }));

    // Get largest files (top 5)
    const largestFiles = allDocuments.slice(0, 5);
    const formattedLargeFiles = largestFiles.map(doc => ({
      id: doc.id,
      name: doc.original_file_name || doc.file_name,
      size_bytes: doc.file_size || 0,
      size_mb: ((doc.file_size || 0) / (1024 * 1024)).toFixed(2),
      uploaded_at: doc.uploaded_at.toISOString(),
      type: doc.mime_type
    }));

    // Determine best unit for display
    const unit = limits.unit;
    const usedInUnit = unit === 'MB' ? usedMB : usedGB;
    const totalInUnit = unit === 'MB' ? limits.totalMB : limits.totalGB;
    const availableInUnit = unit === 'MB' ? availableMB : availableGB;

    const response = {
      // Current usage in bytes
      used: usedBytes,
      total: limits.totalBytes,
      available: availableBytes,
      
      // Usage in GB (for compatibility)
      used_gb: parseFloat(usedGB.toFixed(3)),
      available_gb: parseFloat(availableGB.toFixed(3)),
      
      // Usage in plan's preferred unit
      used_unit: parseFloat(usedInUnit.toFixed(unit === 'MB' ? 1 : 3)),
      total_unit: totalInUnit,
      available_unit: parseFloat(availableInUnit.toFixed(unit === 'MB' ? 1 : 3)),
      
      // Legacy field names for backward compatibility (avoid duplicate keys)
      used_mb: usedInUnit, // In plan's unit
      total_gb: limits.totalGB,
      total_mb: totalInUnit, // In plan's unit
      available_mb: availableInUnit, // In plan's unit
      usage_percentage: parseFloat(usagePercentage.toFixed(1)),
      total_documents: storageStats._count.id,
      document_breakdown: formattedBreakdown,
      largest_files: formattedLargeFiles,
      plan_type: userSubscription?.plan_type || 'BASIC',
      storage_unit: unit,
      last_calculated: new Date().toISOString(),
      
      // Debug info
      debug: {
        total_docs_found: allDocuments.length,
        used_bytes: usedBytes,
        total_bytes: limits.totalBytes
      }
    };

    console.log('📤 Sending response:', response);

    return NextResponse.json(response);

  } catch (error) {
    console.error('❌ Get storage info error:', error);
    
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