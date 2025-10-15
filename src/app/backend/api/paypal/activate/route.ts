// src/app/backend/api/paypal/activate/route.ts
// DEPRECATED: This endpoint is no longer used. Use capture-subscription instead.
// Kept for backward compatibility but redirects to unified service.

import { NextRequest, NextResponse } from 'next/server';
import { getPayPalAccessToken } from '../_utils';
import { subscriptionService } from '@/lib/subscription-service';
import { PrismaClient } from '@prisma/client';
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
      // Use unified subscription service (handles both subscription and invoice)
      console.log('⚠️ [ACTIVATE] DEPRECATED endpoint called, using unified service...');

      const result = await subscriptionService.activateSubscription({
        userId,
        userEmail,
        userName,
        planType: plan,
        billingCycle: billing,
        subscriptionId: paypalSubId,
        paypalTransactionId: subscriptionData.id
      });

      if (!result.success) {
        return NextResponse.json({
          success: false,
          error: result.error || 'Failed to activate subscription'
        }, { status: 500 });
      }

      const { tokenLimit, storageLimit } = subscriptionService.getPlanConfig(plan, billing);

      return NextResponse.json({
        success: true,
        message: 'Subscription activated successfully',
        plan,
        billing,
        tokenLimit,
        storageLimit,
        invoice: result.invoice
      });

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
