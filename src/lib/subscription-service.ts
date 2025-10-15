// Unified Subscription Service
// Single source of truth for all subscription operations and invoice handling

import { prisma } from '@/lib/prisma';
import { SubscriptionStatus } from '@prisma/client';
import { prismaInvoiceService } from './invoice-service';

interface SubscriptionActivationParams {
  userId: string;
  userEmail: string;
  userName: string;
  planType: 'STANDARD' | 'PREMIUM';
  billingCycle: 'monthly' | 'yearly';
  subscriptionId: string;
  paypalTransactionId?: string;
}

interface SubscriptionActivationResult {
  success: boolean;
  error?: string;
  subscription?: any;
  invoice?: {
    sent: boolean;
    invoiceNumber?: string;
    invoiceId?: string;
    error?: string;
  };
}

/**
 * Plan pricing configuration
 */
const PLAN_CONFIG = {
  STANDARD: {
    monthly: { price: 129, tokens: 10000, storage: 1024 },
    yearly: { price: 1290, tokens: 120000, storage: 12288 },
  },
  PREMIUM: {
    monthly: { price: 249, tokens: -1, storage: 10240 }, // -1 means unlimited
    yearly: { price: 2490, tokens: -1, storage: 122880 },
  },
} as const;

class SubscriptionService {
  /**
   * Main method to activate a subscription
   * This is the ONLY place where subscriptions should be activated
   */
  async activateSubscription(
    params: SubscriptionActivationParams
  ): Promise<SubscriptionActivationResult> {
    const { userId, userEmail, userName, planType, billingCycle, subscriptionId, paypalTransactionId } = params;

    console.log('🚀 [SUBSCRIPTION-SERVICE] Starting subscription activation:', {
      userId,
      userEmail,
      planType,
      billingCycle,
      subscriptionId,
      timestamp: new Date().toISOString(),
    });

    try {
      // Step 1: Check if subscription already exists (prevent duplicate activations)
      const existingSubscription = await prisma.subscription.findFirst({
        where: {
          user_id: userId,
          external_subscription_id: subscriptionId,
        },
      });

      if (existingSubscription) {
        console.log('⚠️ [SUBSCRIPTION-SERVICE] Subscription already activated:', {
          subscriptionId,
          userId,
          planType: existingSubscription.plan_type,
          activatedAt: existingSubscription.created_at,
        });

        // Return existing subscription without re-sending invoice
        return {
          success: true,
          subscription: existingSubscription,
          invoice: {
            sent: false,
            error: 'Subscription already activated, invoice already sent',
          },
        };
      }

      // Step 2: Get plan configuration
      const config = PLAN_CONFIG[planType][billingCycle];
      const billingDate = new Date();
      const nextBillingDate = new Date(billingDate);

      if (billingCycle === 'monthly') {
        nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
      } else {
        nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
      }

      const daysRemaining = Math.ceil(
        (nextBillingDate.getTime() - billingDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      // Step 3: Create/Update subscription in database
      const subscription = await prisma.subscription.upsert({
        where: { user_id: userId },
        update: {
          plan_type: planType as SubscriptionStatus,
          token_limit: config.tokens,
          storage: config.storage,
          billing_date: nextBillingDate,
          days_remaining: daysRemaining,
          price: config.price,
          currency: 'PHP',
          is_active: true,
          auto_renew: true,
          payment_method: 'paypal',
          payment_provider: 'paypal',
          external_subscription_id: subscriptionId,
          updated_at: new Date(),
          tokens_reset_date: billingDate,
        },
        create: {
          user_id: userId,
          plan_type: planType as SubscriptionStatus,
          token_limit: config.tokens,
          storage: config.storage,
          tokens_used: 0,
          storage_used: 0,
          billing_date: nextBillingDate,
          days_remaining: daysRemaining,
          price: config.price,
          currency: 'PHP',
          is_active: true,
          auto_renew: true,
          payment_method: 'paypal',
          payment_provider: 'paypal',
          external_subscription_id: subscriptionId,
          tokens_reset_date: billingDate,
        },
      });

      console.log('✅ [SUBSCRIPTION-SERVICE] Subscription created/updated:', {
        userId,
        planType,
        billingCycle,
        subscriptionId: subscription.id,
        externalSubscriptionId: subscriptionId,
      });

      // Step 4: Send invoice (with built-in duplicate prevention)
      console.log('📧 [SUBSCRIPTION-SERVICE] Sending invoice...');

      const invoiceResult = await prismaInvoiceService.createAndSendInvoice({
        userId,
        userEmail,
        userName,
        planType,
        billingCycle,
        subscriptionId,
        paypalTransactionId,
      });

      if (invoiceResult.success) {
        console.log('✅ [SUBSCRIPTION-SERVICE] Invoice sent successfully:', {
          invoiceNumber: invoiceResult.invoiceNumber,
          invoiceId: invoiceResult.invoiceId,
          userEmail,
        });
      } else {
        console.error('❌ [SUBSCRIPTION-SERVICE] Invoice sending failed:', invoiceResult.error);
      }

      return {
        success: true,
        subscription,
        invoice: {
          sent: invoiceResult.success,
          invoiceNumber: invoiceResult.invoiceNumber,
          invoiceId: invoiceResult.invoiceId,
          error: invoiceResult.error,
        },
      };
    } catch (error: any) {
      console.error('❌ [SUBSCRIPTION-SERVICE] Activation failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to activate subscription',
      };
    }
  }

  /**
   * Check if a subscription is already activated
   */
  async isSubscriptionActivated(subscriptionId: string): Promise<boolean> {
    const subscription = await prisma.subscription.findFirst({
      where: { external_subscription_id: subscriptionId },
    });
    return !!subscription;
  }

  /**
   * Get plan configuration
   */
  getPlanConfig(planType: 'STANDARD' | 'PREMIUM', billingCycle: 'monthly' | 'yearly') {
    return PLAN_CONFIG[planType][billingCycle];
  }
}

export const subscriptionService = new SubscriptionService();
