import { prisma } from './prisma';
import { SubscriptionStatus } from '@prisma/client';

export interface DocumentLimits {
  maxDocuments: number;
  currentCount: number;
  canUpload: boolean;
  planType: SubscriptionStatus;
}

export class DocumentLimitChecker {
  
  // Get document limits based on subscription tier
  static getDocumentLimitByPlan(planType: SubscriptionStatus): number {
    switch (planType) {
      case 'BASIC':
        return 5;
      case 'STANDARD':
        return 20;
      case 'PREMIUM':
        return -1; // -1 means unlimited
      default:
        return 5; // Default to BASIC limits
    }
  }

  // Check current document count for user
  static async getCurrentDocumentCount(userId: string): Promise<number> {
    try {
      const count = await prisma.document.count({
        where: {
          owner_id: userId,
          status: { in: ['INDEXED', 'PROCESSED', 'UPLOADED', 'PROCESSING'] }
        }
      });
      return count;
    } catch (error) {
      console.error('Failed to get document count:', error);
      return 0;
    }
  }

  // Get user's subscription plan
  static async getUserSubscriptionPlan(userId: string): Promise<SubscriptionStatus> {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
        select: { plan_type: true }
      });
      return subscription?.plan_type || 'BASIC';
    } catch (error) {
      console.error('Failed to get subscription plan:', error);
      return 'BASIC';
    }
  }

  // Main function to check if user can upload more documents
  static async canUserUploadDocument(userId: string): Promise<DocumentLimits> {
    try {
      const [currentCount, planType] = await Promise.all([
        this.getCurrentDocumentCount(userId),
        this.getUserSubscriptionPlan(userId)
      ]);

      const maxDocuments = this.getDocumentLimitByPlan(planType);
      const canUpload = maxDocuments === -1 || currentCount < maxDocuments;

      return {
        maxDocuments,
        currentCount,
        canUpload,
        planType
      };
    } catch (error) {
      console.error('Failed to check document limits:', error);
      return {
        maxDocuments: 5,
        currentCount: 0,
        canUpload: false,
        planType: 'BASIC'
      };
    }
  }

  // Get detailed limits info for display
  static async getDocumentLimitsInfo(userId: string): Promise<{
    limits: DocumentLimits;
    message: string;
    upgradeRequired: boolean;
  }> {
    const limits = await this.canUserUploadDocument(userId);
    
    let message = '';
    let upgradeRequired = false;

    if (limits.maxDocuments === -1) {
      message = `Unlimited documents (${limits.currentCount} uploaded)`;
    } else {
      message = `${limits.currentCount}/${limits.maxDocuments} documents used`;
      if (!limits.canUpload) {
        message += ' - Limit reached';
        upgradeRequired = true;
      }
    }

    return {
      limits,
      message,
      upgradeRequired
    };
  }
}
