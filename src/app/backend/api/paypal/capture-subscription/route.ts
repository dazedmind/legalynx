// src/app/backend/api/paypal/capture-subscription/route.ts
// Updated to send invoices using LegalynX user email

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { getPayPalAccessToken, getPayPalBaseUrl, computeNextBillingDate, PlanCode, BillingCycle, getPlanLimits, getPayPalPaymentDetails } from '../_utils';
import { prismaInvoiceService } from '@/lib/invoice-service';

async function getUserFromToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) throw new Error('No token provided');
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
  const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
  if (!user) throw new Error('User not found');
  return user;
}

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated LegalynX user
    const user = await getUserFromToken(request);
    const { subscriptionId, plan, billing }: { subscriptionId: string; plan: PlanCode; billing: BillingCycle } = await request.json();
    
    console.log(`🔄 Capturing subscription for LegalynX user ${user.id} (${user.email}): ${subscriptionId}, plan: ${plan}, billing: ${billing}`);
    
    if (!subscriptionId || !plan || !billing) {
      return NextResponse.json({ error: 'subscriptionId, plan and billing are required' }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();
    const baseUrl = getPayPalBaseUrl();

    // Get subscription details to ensure it is active/approved
    const res = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data = await res.json();
    if (!res.ok) {
      return NextResponse.json({ error: 'Failed to verify PayPal subscription', details: data }, { status: 500 });
    }

    const status = data.status as string;
    if (status !== 'ACTIVE' && status !== 'APPROVAL_PENDING' && status !== 'APPROVED') {
      return NextResponse.json({ error: `Subscription not active. Status: ${status}` }, { status: 400 });
    }

    // Calculate next billing date
    let nextBilling: Date | null = null;
    try {
      const next = data?.billing_info?.next_billing_time;
      if (next) nextBilling = new Date(next);
    } catch { /* ignore */ }
    if (!nextBilling || isNaN(nextBilling.getTime())) {
      nextBilling = computeNextBillingDate(billing);
    }
    
    const { tokenLimit, storageLimit } = getPlanLimits(plan);
    console.log(`📊 Plan limits for ${plan}: tokens=${tokenLimit}, storage=${storageLimit}MB`);
    
    // Get PayPal payment details
    const paymentDetails = await getPayPalPaymentDetails(accessToken, subscriptionId);
    console.log('💳 PayPal payment details:', paymentDetails);

    // Update subscription in database
    const updatedSubscription = await prisma.subscription.upsert({
      where: { user_id: user.id },
      update: {
        plan_type: plan,
        token_limit: tokenLimit,
        storage: storageLimit,
        is_active: true,
        billing_date: nextBilling,
        external_subscription_id: subscriptionId,
        payment_method: paymentDetails.payment_method,
        payment_provider: paymentDetails.payment_provider,
        last_four_digits: paymentDetails.last_four_digits,
        days_remaining: Math.max(0, Math.ceil(((nextBilling as Date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
      },
      create: {
        user_id: user.id,
        plan_type: plan,
        token_limit: tokenLimit,
        storage: storageLimit,
        tokens_used: 0,
        storage_used: 0,
        is_active: true,
        billing_date: nextBilling,
        external_subscription_id: subscriptionId,
        payment_method: paymentDetails.payment_method,
        payment_provider: paymentDetails.payment_provider,
        last_four_digits: paymentDetails.last_four_digits,
        days_remaining: Math.max(0, Math.ceil(((nextBilling as Date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))),
      }
    });

    console.log(`✅ Subscription updated for user ${user.id}:`, {
      plan_type: updatedSubscription.plan_type,
      external_subscription_id: updatedSubscription.external_subscription_id,
      is_active: updatedSubscription.is_active
    });

    // Invoice will be sent via PayPal webhook (BILLING.SUBSCRIPTION.ACTIVATED)
    // This prevents duplicate invoices
    console.log('ℹ️ Subscription activated, invoice will be sent via webhook');

    return NextResponse.json({
      status: 'ok',
      nextBillingDate: nextBilling.toISOString(),
      invoice: {
        sent: false,
        note: 'Invoice will be sent via PayPal webhook to avoid duplicates'
      }
    });

  } catch (error) {
    console.error('❌ PayPal capture-subscription error:', error);
    return NextResponse.json({ error: 'Failed to activate subscription' }, { status: 500 });
  }
}
