// src/app/backend/api/paypal/capture-subscription/route.ts
// Simplified using unified subscription service

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { getPayPalAccessToken, getPayPalBaseUrl, PlanCode, BillingCycle } from '../_utils';
import { subscriptionService } from '@/lib/subscription-service';

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

    console.log(`🔄 [CAPTURE-SUBSCRIPTION] Processing for user ${user.id} (${user.email}):`, {
      subscriptionId,
      plan,
      billing,
      timestamp: new Date().toISOString()
    });

    if (!subscriptionId || !plan || !billing) {
      return NextResponse.json({ error: 'subscriptionId, plan and billing are required' }, { status: 400 });
    }

    // Verify with PayPal that the subscription is valid and active
    const accessToken = await getPayPalAccessToken();
    const baseUrl = getPayPalBaseUrl();

    const res = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!res.ok) {
      const data = await res.json();
      return NextResponse.json({ error: 'Failed to verify PayPal subscription', details: data }, { status: 500 });
    }

    const paypalData = await res.json();
    const status = paypalData.status as string;

    if (status !== 'ACTIVE' && status !== 'APPROVAL_PENDING' && status !== 'APPROVED') {
      return NextResponse.json({ error: `Subscription not active. Status: ${status}` }, { status: 400 });
    }

    // Use unified subscription service to activate (handles both subscription and invoice)
    const result = await subscriptionService.activateSubscription({
      userId: user.id,
      userEmail: user.email,
      userName: user.name || user.email.split('@')[0],
      planType: plan as 'STANDARD' | 'PREMIUM',
      billingCycle: billing,
      subscriptionId,
      paypalTransactionId: paypalData.id
    });

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Failed to activate subscription' }, { status: 500 });
    }

    // Calculate next billing date from PayPal data
    let nextBilling: Date;
    try {
      const next = paypalData?.billing_info?.next_billing_time;
      nextBilling = next ? new Date(next) : new Date(result.subscription.billing_date);
    } catch {
      nextBilling = new Date(result.subscription.billing_date);
    }

    console.log('✅ [CAPTURE-SUBSCRIPTION] Activation complete:', {
      userId: user.id,
      plan,
      billing,
      invoiceSent: result.invoice?.sent,
      invoiceNumber: result.invoice?.invoiceNumber
    });

    return NextResponse.json({
      status: 'ok',
      nextBillingDate: nextBilling.toISOString(),
      invoice: result.invoice
    });

  } catch (error: any) {
    console.error('❌ [CAPTURE-SUBSCRIPTION] Error:', error);
    return NextResponse.json({
      error: error.message || 'Failed to activate subscription'
    }, { status: 500 });
  }
}
