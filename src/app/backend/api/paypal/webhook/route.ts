// PayPal Webhook Handler
// src/app/backend/api/paypal/webhooks/route.ts
//
// IMPORTANT: This webhook does NOT send invoices to prevent duplicates.
// Invoices are sent via the capture-subscription endpoint when users activate.
// This webhook is used for:
// - Logging subscription events
// - Verifying subscription status
// - Future recurring billing notifications

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource: {
    id: string;
    subscriber?: {
      email_address: string;
      name?: {
        given_name?: string;
        surname?: string;
      };
    };
    plan_id: string;
    status?: string;
  };
  create_time: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: PayPalWebhookEvent = await request.json();
    
    console.log('🔔 PayPal Webhook received:', {
      eventType: body.event_type,
      subscriptionId: body.resource.id,
      planId: body.resource.plan_id
    });

    // Handle subscription events for logging and verification
    // NOTE: We do NOT send invoices from webhooks to prevent duplicates
    // Invoices are sent from the capture-subscription endpoint when user activates
    if (body.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED' ||
        body.event_type === 'BILLING.SUBSCRIPTION.PAYMENT.COMPLETED') {

      const subscriptionId = body.resource.id;
      const planId = body.resource.plan_id;

      // Get plan details from environment variables
      const planDetails = getPlanDetailsFromPayPalPlanId(planId);

      if (!planDetails.planType || !planDetails.billingCycle) {
        console.log('⚠️ Unknown plan ID, skipping webhook processing:', planId);
        return NextResponse.json({ received: true, action: 'ignored' });
      }

      // Skip BASIC plan (free)
      if (planDetails.planType === 'BASIC') {
        console.log('ℹ️ BASIC plan subscription webhook received, no action needed');
        return NextResponse.json({ received: true, action: 'no_invoice_needed' });
      }

      try {
        // 🎯 FIND LEGALYNX USER BY SUBSCRIPTION ID for logging purposes
        const subscription = await prisma.subscription.findFirst({
          where: { external_subscription_id: subscriptionId },
          include: { user: true }
        });

        if (!subscription || !subscription.user) {
          console.error('❌ [WEBHOOK] No LegalynX user found for subscription ID:', subscriptionId);
          return NextResponse.json({
            received: true,
            action: 'user_not_found',
            error: 'No LegalynX user found for this subscription'
          });
        }

        const legalynxUser = subscription.user;
        console.log('✅ [WEBHOOK] Subscription event received for user:', {
          eventType: body.event_type,
          userId: legalynxUser.id,
          userEmail: legalynxUser.email,
          subscriptionId,
          planType: planDetails.planType,
          timestamp: new Date().toISOString(),
          note: 'Invoice already sent via capture-subscription endpoint'
        });

        // Webhook acknowledged, but no invoice sent (to prevent duplicates)
        return NextResponse.json({
          received: true,
          action: 'acknowledged',
          note: 'Invoice handled by capture-subscription endpoint'
        });

      } catch (error) {
        console.error('❌ Error processing webhook:', error);
        return NextResponse.json({
          received: true,
          action: 'processing_error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    // For other webhook types, just acknowledge receipt
    return NextResponse.json({ received: true, action: 'acknowledged' });

  } catch (error) {
    console.error('❌ PayPal webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

/**
 * Map PayPal plan IDs to your plan types
 */
function getPlanDetailsFromPayPalPlanId(planId: string): { 
  planType: 'BASIC' | 'STANDARD' | 'PREMIUM' | null; 
  billingCycle: 'monthly' | 'yearly' | null 
} {
  const planMappings = {
    [process.env.PAYPAL_STANDARD_MONTHLY_PLAN_ID || '']: { 
      planType: 'STANDARD' as const, 
      billingCycle: 'monthly' as const 
    },
    [process.env.PAYPAL_STANDARD_YEARLY_PLAN_ID || '']: { 
      planType: 'STANDARD' as const, 
      billingCycle: 'yearly' as const 
    },
    [process.env.PAYPAL_PREMIUM_MONTHLY_PLAN_ID || '']: { 
      planType: 'PREMIUM' as const, 
      billingCycle: 'monthly' as const 
    },
    [process.env.PAYPAL_PREMIUM_YEARLY_PLAN_ID || '']: { 
      planType: 'PREMIUM' as const, 
      billingCycle: 'yearly' as const 
    },
  };

  return planMappings[planId] || { planType: null, billingCycle: null };
}