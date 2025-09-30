import { NextRequest } from 'next/server';

export function getPayPalBaseUrl(): string {
  const env = (process.env.PAYPAL_ENV || process.env.NODE_ENV || 'sandbox').toLowerCase();
  return env === 'live' || env === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

export async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const secret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !secret) {
    throw new Error('PayPal credentials not configured');
  }

  const baseUrl = getPayPalBaseUrl();
  const auth = Buffer.from(`${clientId}:${secret}`).toString('base64');

  const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Failed to get PayPal access token: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.access_token as string;
}

export type PlanCode = 'BASIC' | 'STANDARD' | 'PREMIUM';
export type BillingCycle = 'monthly' | 'yearly';

export function getPlanId(plan: PlanCode, billing: BillingCycle): string | null {
  const key = `PAYPAL_${plan}_${billing}`.toUpperCase() + '_PLAN_ID';
  return process.env[key] || null;
}

// Storage limits in MB (not bytes) to fit in 32-bit integer database field
const premiumStorageMB = 10 * 1024; // 10 GB = 10,240 MB
const standardStorageMB = 1 * 1024; // 1 GB = 1,024 MB  
const basicStorageMB = 100; // 100 MB

export function getPlanLimits(plan: PlanCode): { tokenLimit: number; storageLimit: number } {
  switch (plan) {
    case 'PREMIUM':
      return { tokenLimit: 100000, storageLimit: premiumStorageMB }; // 10 GB in MB
    case 'STANDARD':
      return { tokenLimit: 10000, storageLimit: standardStorageMB }; // 1 GB in MB
    case 'BASIC':
    default:
      return { tokenLimit: 1000, storageLimit: basicStorageMB }; // 100 MB in MB
  }
}

export async function getPayPalPaymentDetails(accessToken: string, subscriptionId: string) {
  const baseUrl = getPayPalBaseUrl();
  
  // Get subscription details from PayPal
  const res = await fetch(`${baseUrl}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });
  
  if (!res.ok) {
    throw new Error(`Failed to get PayPal subscription details: ${res.status}`);
  }
  
  const data = await res.json();
  
  // For PayPal subscriptions, we'll use generic PayPal info since we don't have card details
  return {
    payment_method: 'paypal',
    payment_provider: 'paypal',
    last_four_digits: null, // PayPal doesn't expose card details for subscriptions
    subscriber_email: data.subscriber?.email_address || null,
    subscriber_name: data.subscriber?.name ? 
      `${data.subscriber.name.given_name || ''} ${data.subscriber.name.surname || ''}`.trim() : null
  };
}

export function computeNextBillingDate(billing: BillingCycle): Date {
  const now = new Date();
  const next = new Date(now);
  if (billing === 'yearly') {
    next.setFullYear(next.getFullYear() + 1);
  } else {
    next.setMonth(next.getMonth() + 1);
  }
  return next;
}

export function daysUntil(date: Date): number {
  const now = new Date();
  return Math.max(0, Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
}

export function getPlanPrice(plan: PlanCode, billing: BillingCycle): { value: string; currency_code: string; interval_unit: 'MONTH' | 'YEAR'; interval_count: number } {
  const currency_code = 'PHP';
  const interval_unit = billing === 'yearly' ? 'YEAR' : 'MONTH';
  const interval_count = 1;
  // Defaults matching the UI
  const prices: Record<PlanCode, Record<BillingCycle, number>> = {
    BASIC: { monthly: 0, yearly: 0 },
    STANDARD: { monthly: 129, yearly: 1290 },
    PREMIUM: { monthly: 249, yearly: 2490 },
  };
  const amount = prices[plan][billing];
  return { value: amount.toString(), currency_code, interval_unit, interval_count };
}

export async function ensureSandboxPlan(accessToken: string, plan: PlanCode, billing: BillingCycle): Promise<string> {
  // Only allowed for sandbox
  const baseUrl = getPayPalBaseUrl();

  // 1) Create a product (simple)
  const productRes = await fetch(`${baseUrl}/v1/catalogs/products`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      name: `LegalynX ${plan} ${billing}`,
      type: 'SERVICE',
      category: 'SOFTWARE',
      description: 'LegalynX AI subscription',
    })
  });
  if (!productRes.ok) {
    const txt = await productRes.text().catch(() => '');
    throw new Error(`Failed to create sandbox product: ${productRes.status} ${txt}`);
  }
  const product = await productRes.json();
  const productId = product.id as string;

  // 2) Create a plan using the product
  const price = getPlanPrice(plan, billing);
  const planRes = await fetch(`${baseUrl}/v1/billing/plans`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      product_id: productId,
      name: `LegalynX ${plan} ${billing} Plan`,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: {
            interval_unit: price.interval_unit,
            interval_count: price.interval_count
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: 0,
          pricing_scheme: {
            fixed_price: {
              value: price.value,
              currency_code: price.currency_code
            }
          }
        }
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 2
      }
    })
  });
  if (!planRes.ok) {
    const txt = await planRes.text().catch(() => '');
    throw new Error(`Failed to create sandbox plan: ${planRes.status} ${txt}`);
  }
  const planData = await planRes.json();
  return planData.id as string;
}


