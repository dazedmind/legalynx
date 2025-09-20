// src/app/backend/api/paypal/activate/route.ts
// Enhanced activation route with Prisma invoice integration

import { NextRequest, NextResponse } from 'next/server';
import { getPayPalAccessToken, getPlanLimits } from '../_utils';
import { prismaInvoiceService } from '@/lib/invoice-service';
import { PrismaClient, SubscriptionStatus } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

interface ActivationRequest {
  paypalSubId: string;
  plan: 'STANDARD' | 'PREMIUM';
  billing: 'monthly' | 'yearly';
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    // Verify JWT token
    let userId: string;
    let userEmail: string;
    let userName: string;
    
    try {
      const decoded = jwt.verify(token, jwtSecret) as any;
      userId = decoded.userId || decoded.id;
      userEmail = decoded.email;
      userName = decoded.name || userEmail.split('@')[0];
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { paypalSubId, plan, billing }: ActivationRequest = await request.json();

    // Validate input
    if (!paypalSubId || !plan || !billing) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (!['STANDARD', 'PREMIUM'].includes(plan)) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    if (!['monthly', 'yearly'].includes(billing)) {
      return NextResponse.json({ error: 'Invalid billing cycle' }, { status: 400 });
    }

    // Verify PayPal subscription
    const accessToken = await getPayPalAccessToken();
    const baseUrl = process.env.PAYPAL_ENV === 'production' 
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com';

    const paypalResponse = await fetch(`${baseUrl}/v1/billing/subscriptions/${paypalSubId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!paypalResponse.ok) {
      return NextResponse.json({ error: 'Invalid PayPal subscription' }, { status: 400 });
    }

    const subscriptionData = await paypalResponse.json();
    
    if (subscriptionData.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Subscription is not active' }, { status: 400 });
    }

    // Get plan limits
    const { tokenLimit, storageLimit } = getPlanLimits(plan as any);

    try {
      // Update user subscription in database using Prisma
      await updateUserSubscriptionPrisma({
        userId,
        planType: plan,
        billingCycle: billing,
        subscriptionId: paypalSubId,
        tokenLimit,
        storageLimit,
        paypalData: subscriptionData
      });

      // Send invoice automatically for paid plans
      if (plan === 'STANDARD' || plan === 'PREMIUM') {
        console.log('📧 Sending invoice for activated subscription:', {
          userEmail,
          plan,
          billing,
          subscriptionId: paypalSubId
        });

        const invoiceResult = await prismaInvoiceService.createAndSendInvoice({
          userId,
          userEmail,
          userName,
          planType: plan,
          billingCycle: billing,
          subscriptionId: paypalSubId,
          paypalTransactionId: subscriptionData.id
        });

        if (invoiceResult.success) {
          console.log('✅ Invoice sent successfully with subscription activation:', {
            invoiceNumber: invoiceResult.invoiceNumber,
            invoiceId: invoiceResult.invoiceId,
            userEmail,
            plan,
            billing
          });

          return NextResponse.json({
            success: true,
            message: 'Subscription activated successfully',
            plan,
            billing,
            tokenLimit,
            storageLimit,
            invoice: {
              sent: true,
              invoiceNumber: invoiceResult.invoiceNumber,
              invoiceId: invoiceResult.invoiceId
            }
          });
        } else {
          console.error('⚠️ Subscription activated but invoice sending failed:', {
            userEmail,
            error: invoiceResult.error
          });

          // Subscription is still activated even if invoice fails
          return NextResponse.json({
            success: true,
            message: 'Subscription activated successfully',
            plan,
            billing,
            tokenLimit,
            storageLimit,
            invoice: {
              sent: false,
              error: invoiceResult.error,
              note: 'Invoice will be retried automatically'
            }
          });
        }
      } else {
        // BASIC plan - no invoice needed
        return NextResponse.json({
          success: true,
          message: 'Subscription activated successfully',
          plan,
          billing,
          tokenLimit,
          storageLimit,
          invoice: {
            sent: false,
            note: 'No invoice required for BASIC plan'
          }
        });
      }

    } catch (dbError) {
      console.error('❌ Database error during subscription activation:', dbError);
      return NextResponse.json({ 
        error: 'Failed to activate subscription in database' 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ Subscription activation error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

/**
 * Update user subscription using Prisma
 */
async function updateUserSubscriptionPrisma(params: {
  userId: string;
  planType: 'STANDARD' | 'PREMIUM';
  billingCycle: 'monthly' | 'yearly';
  subscriptionId: string;
  tokenLimit: number;
  storageLimit: number;
  paypalData: any;
}) {
  try {
    const { userId, planType, billingCycle, subscriptionId, tokenLimit, storageLimit, paypalData } = params;
    
    const billingDate = new Date();
    const nextBillingDate = new Date(billingDate);
    if (billingCycle === 'monthly') {
      nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
    } else {
      nextBillingDate.setFullYear(nextBillingDate.getFullYear() + 1);
    }

    // Calculate days remaining until next billing
    const daysRemaining = Math.ceil((nextBillingDate.getTime() - billingDate.getTime()) / (1000 * 60 * 60 * 24));

    // Get pricing for the plan
    const prices = {
      STANDARD: { monthly: 129, yearly: 1290 },
      PREMIUM: { monthly: 249, yearly: 2490 }
    };
    const price = prices[planType][billingCycle];

    // Extract payment details from PayPal data
    const paymentMethod = 'paypal';
    const paymentProvider = 'paypal';
    const subscriberEmail = paypalData.subscriber?.email_address || null;

    // Update or create subscription using Prisma upsert
    await prisma.subscription.upsert({
      where: { user_id: userId },
      update: {
        plan_type: planType as SubscriptionStatus,
        token_limit: tokenLimit,
        storage: storageLimit,
        billing_date: billingDate,
        days_remaining: daysRemaining,
        price: price,
        currency: 'PHP',
        is_active: true,
        auto_renew: true,
        payment_method: paymentMethod,
        payment_provider: paymentProvider,
        external_subscription_id: subscriptionId,
        updated_at: new Date(),
        tokens_reset_date: billingDate // Reset token usage cycle
      },
      create: {
        user_id: userId,
        plan_type: planType as SubscriptionStatus,
        token_limit: tokenLimit,
        storage: storageLimit,
        billing_date: billingDate,
        days_remaining: daysRemaining,
        price: price,
        currency: 'PHP',
        is_active: true,
        auto_renew: true,
        payment_method: paymentMethod,
        payment_provider: paymentProvider,
        external_subscription_id: subscriptionId,
        tokens_reset_date: billingDate
      }
    });

    console.log('✅ Subscription updated in database:', {
      userId,
      planType,
      billingCycle,
      subscriptionId,
      tokenLimit,
      storageLimit,
      price
    });

  } catch (error) {
    console.error('❌ Failed to update subscription in database:', error);
    throw new Error('Database update failed');
  }
}
