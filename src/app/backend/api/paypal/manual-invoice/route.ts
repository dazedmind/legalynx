// Manual invoice trigger API endpoint
// src/app/backend/api/paypal/manual-invoice/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { triggerManualInvoice } from '@/lib/manual-invoice-trigger';

export async function POST(request: NextRequest) {
  try {
    const { legalynxUserId, subscriptionId, planType, billingCycle } = await request.json();

    // Validate required fields
    if (!legalynxUserId || !subscriptionId || !planType || !billingCycle) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: legalynxUserId, subscriptionId, planType, billingCycle'
      }, { status: 400 });
    }

    // Validate plan type
    if (!['STANDARD', 'PREMIUM'].includes(planType)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid plan type. Must be STANDARD or PREMIUM'
      }, { status: 400 });
    }

    // Validate billing cycle
    if (!['monthly', 'yearly'].includes(billingCycle)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid billing cycle. Must be monthly or yearly'
      }, { status: 400 });
    }

    // Trigger manual invoice
    const result = await triggerManualInvoice({
      legalynxUserId,
      subscriptionId,
      planType,
      billingCycle
    });

    return NextResponse.json(result, {
      status: result.success ? 200 : 400
    });

  } catch (error) {
    console.error('❌ Manual invoice API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}