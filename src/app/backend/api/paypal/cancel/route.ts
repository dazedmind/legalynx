import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import jwt from 'jsonwebtoken';
import { getPayPalAccessToken, getPayPalBaseUrl } from '../_utils';

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
    const user = await getUserFromToken(request);
    const { reason } = await request.json().catch(() => ({ reason: 'User requested cancellation' }));

    const subscription = await prisma.subscription.findUnique({
      where: { user_id: user.id },
      select: { external_subscription_id: true }
    });
    if (!subscription?.external_subscription_id) {
      return NextResponse.json({ error: 'No active subscription' }, { status: 400 });
    }

    const accessToken = await getPayPalAccessToken();
    const baseUrl = getPayPalBaseUrl();

    const res = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscription.external_subscription_id}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ reason: reason || 'User requested cancellation' })
    });

    if (!res.ok) {
      const details = await res.text();
      return NextResponse.json({ error: 'Failed to cancel PayPal subscription', details }, { status: 500 });
    }

    await prisma.subscription.update({
      where: { user_id: user.id },
      data: { is_active: false, cancelled_at: new Date() }
    });

    return NextResponse.json({ status: 'cancelled' });
  } catch (error) {
    console.error('PayPal cancel error:', error);
    return NextResponse.json({ error: 'Failed to cancel subscription' }, { status: 500 });
  }
}


