// Fixed webhook handler that maps PayPal subscription to LegalynX user
// src/app/backend/api/paypal/webhooks/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { prismaInvoiceService } from '@/lib/invoice-service';

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

    // Handle subscription events that should trigger invoices
    if (body.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED' || 
        body.event_type === 'BILLING.SUBSCRIPTION.PAYMENT.COMPLETED') {
      
      const subscriptionId = body.resource.id;
      const planId = body.resource.plan_id;
      
      // Get plan details from environment variables
      const planDetails = getPlanDetailsFromPayPalPlanId(planId);
      
      if (!planDetails.planType || !planDetails.billingCycle) {
        console.log('⚠️ Unknown plan ID, skipping invoice generation:', planId);
        return NextResponse.json({ received: true, action: 'ignored' });
      }

      // Skip BASIC plan (free)
      if (planDetails.planType === 'BASIC') {
        console.log('ℹ️ BASIC plan subscription, no invoice needed');
        return NextResponse.json({ received: true, action: 'no_invoice_needed' });
      }

      try {
        // 🎯 FIND LEGALYNX USER BY SUBSCRIPTION ID (NOT PAYPAL EMAIL)
        const subscription = await prisma.subscription.findFirst({
          where: { external_subscription_id: subscriptionId },
          include: { user: true }
        });

        if (!subscription || !subscription.user) {
          console.error('❌ No LegalynX user found for subscription ID:', subscriptionId);
          return NextResponse.json({ 
            received: true, 
            action: 'user_not_found',
            error: 'No LegalynX user found for this subscription' 
          });
        }

        const legalynxUser = subscription.user;
        console.log('✅ Found LegalynX user for subscription:', {
          userId: legalynxUser.id,
          userEmail: legalynxUser.email,  // This is the LegalynX email
          subscriptionId,
          planType: planDetails.planType
        });

        // Create and send invoice to LegalynX user email
        const invoiceResult = await prismaInvoiceService.createAndSendInvoice({
          userId: legalynxUser.id,
          userEmail: legalynxUser.email,  // 🎯 LegalynX registered email
          userName: legalynxUser.name || legalynxUser.email.split('@')[0],
          planType: planDetails.planType as 'STANDARD' | 'PREMIUM',
          billingCycle: planDetails.billingCycle as 'monthly' | 'yearly',
          subscriptionId,
          paypalTransactionId: body.id
        });

        if (invoiceResult.success) {
          console.log('✅ Webhook invoice sent successfully to LegalynX user:', {
            invoiceNumber: invoiceResult.invoiceNumber,
            invoiceId: invoiceResult.invoiceId,
            sentToEmail: legalynxUser.email,  // Confirming LegalynX email used
            planType: planDetails.planType,
            billingCycle: planDetails.billingCycle
          });

          return NextResponse.json({
            received: true,
            action: 'invoice_sent',
            invoiceNumber: invoiceResult.invoiceNumber,
            invoiceId: invoiceResult.invoiceId,
            sentTo: legalynxUser.email
          });
        } else {
          console.error('❌ Failed to send webhook invoice:', invoiceResult.error);
          return NextResponse.json({
            received: true,
            action: 'invoice_failed',
            error: invoiceResult.error
          });
        }

      } catch (error) {
        console.error('❌ Error processing webhook for invoice:', error);
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