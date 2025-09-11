import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Basic webhook handler. For production, verify the transmission using PayPal headers.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const eventType = body.event_type as string;
    const resource = body.resource || {};

    // Handle a few important events
    if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      const userId = resource.custom_id as string | undefined;
      const subscriptionId = resource.id as string | undefined;
      if (userId && subscriptionId) {
        await prisma.subscription.updateMany({
          where: { user_id: userId },
          data: { is_active: true, external_subscription_id: subscriptionId }
        });
      }
    }

    if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED') {
      const userId = resource.custom_id as string | undefined;
      if (userId) {
        await prisma.subscription.updateMany({
          where: { user_id: userId },
          data: { is_active: false, cancelled_at: new Date() }
        });
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}


