// Create this file: src/lib/storage-tracker.ts
import { prisma } from './prisma';

export class StorageTracker {
  
  // Track when files are added/removed - updates are automatic via existing Document records
  static async updateStorageUsage(userId: string): Promise<number> {
    try {
      // This recalculates from existing documents - no new tables needed
      const totalBytes = await prisma.document.aggregate({
        where: {
          owner_id: userId,
          status: { in: ['INDEXED', 'PROCESSED'] }
        },
        _sum: { file_size: true }
      });
      
      const storageUsed = totalBytes._sum.file_size || 0;
      console.log(`📊 User ${userId} storage usage: ${(storageUsed / (1024 * 1024)).toFixed(2)} MB`);
      
      return storageUsed;
    } catch (error) {
      console.error('Failed to update storage usage:', error);
      return 0;
    }
  }
  
  // Check if user has enough storage space
  static async canUploadFile(userId: string, fileSizeBytes: number): Promise<boolean> {
    try {
      const currentUsage = await this.updateStorageUsage(userId);
      
      // Get user's storage limit based on subscription
      const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
        select: { plan_type: true }
      });
      
      let storageLimit = 10 * 1024 * 1024 * 1024; // Default 10GB
      switch (subscription?.plan_type) {
        case 'BASIC':
          storageLimit = 500 * 1024 * 1024 * 1024; // 500GB
          break;
        case 'STANDARD':
          storageLimit = 1024 * 1024 * 1024 * 1024; // 1TB
          break;
        case 'PREMIUM':
          storageLimit = 10 * 1024 * 1024 * 1024 * 1024; // 10TB
          break;
      }
      
      return (currentUsage + fileSizeBytes) <= storageLimit;
    } catch (error) {
      console.error('Failed to check storage limit:', error);
      return false;
    }
  }
}