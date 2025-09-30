import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { getPayPalAccessToken, getPayPalBaseUrl, getPlanId, PlanCode, BillingCycle, ensureSandboxPlan } from '../_utils';

async function getUserFromToken(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    return user;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 PayPal create-subscription request started');
    const user = await getUserFromToken(request);
    if (!user) {
      console.log('❌ No user found in token');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`👤 User found: ${user.id}`);
    
    const { plan, billing } = await request.json() as { plan: PlanCode; billing: BillingCycle };
    console.log(`📋 Plan requested: ${plan}, Billing: ${billing}`);

    if (!plan || !billing) {
      return NextResponse.json({ error: 'plan and billing are required' }, { status: 400 });
    }

    let planId = getPlanId(plan, billing);

    // Basic env validation to avoid opaque 500s
    if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.log('❌ PayPal credentials missing from environment');
      return NextResponse.json({ error: 'PayPal credentials not configured' }, { status: 500 });
    }

    console.log('🔑 Getting PayPal access token...');
    const accessToken = await getPayPalAccessToken();
    const baseUrl = getPayPalBaseUrl();
    console.log(`🌐 PayPal base URL: ${baseUrl}`);

    // If no plan configured and we are in sandbox, auto-create a plan for testing
    if (!planId && baseUrl.includes('sandbox')) {
      console.log(`📝 No plan ID found for ${plan}/${billing}, creating sandbox plan...`);
      try {
        planId = await ensureSandboxPlan(accessToken, plan, billing);
        console.log(`✅ Sandbox plan created/found: ${planId}`);
      } catch (e: any) {
        console.error('❌ Failed to create sandbox plan:', e);
        return NextResponse.json({ error: e?.message || 'Failed to create sandbox plan' }, { status: 500 });
      }
    }
    if (!planId) {
      console.log(`❌ No PayPal plan configured for ${plan}/${billing}`);
      return NextResponse.json({ error: `No PayPal plan configured for ${plan}/${billing}` }, { status: 400 });
    }
    
    console.log(`💳 Using plan ID: ${planId}`);

    // Create subscription in PayPal
    const appUrl = (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000').replace(/\/$/, ''); // Remove trailing slash
    console.log(`🌍 App URL: ${appUrl}`);
    
    const subscriptionPayload = {
      plan_id: planId,
      application_context: {
        brand_name: 'LegalynX Subscription',
        user_action: 'SUBSCRIBE_NOW',
        return_url: `${appUrl}/frontend/settings?tab=subscription&paypal=success&plan=${plan}&billing=${billing}`,
        cancel_url: `${appUrl}/frontend/settings?tab=subscription&paypal=cancel`,
      },
      custom_id: user.id,
    };
    
    console.log('📤 PayPal subscription payload:', JSON.stringify(subscriptionPayload, null, 2));
    
    const res = await fetch(`${baseUrl}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(subscriptionPayload),
    });

    const data = await res.json();
    console.log(`📥 PayPal response status: ${res.status}`);
    console.log('📥 PayPal response data:', JSON.stringify(data, null, 2));
    
    if (!res.ok) {
      const message = data?.message || data?.name || 'Failed to create PayPal subscription';
      console.error('❌ PayPal subscription creation failed:', { status: res.status, message, data });
      return NextResponse.json({ error: message, details: data }, { status: 500 });
    }

    // Return approval link and subscription id to the client
    const approvalUrl = (data.links || []).find((l: any) => l.rel === 'approve')?.href;
    console.log(`✅ PayPal subscription created successfully: ${data.id}`);
    console.log(`🔗 Approval URL: ${approvalUrl}`);
    
    return NextResponse.json({ subscriptionId: data.id, approvalUrl });
  } catch (error: any) {
    console.error('❌ PayPal create-subscription error:', error);
    console.error('❌ Error stack:', error?.stack);
    const msg = error?.message || 'Failed to create subscription';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
