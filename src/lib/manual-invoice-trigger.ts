// Manual invoice trigger utility for testing
// src/lib/manual-invoice-trigger.ts

import { prismaInvoiceService } from '@/lib/invoice-service';

export async function triggerManualInvoice(params: {
  legalynxUserId: string;  // LegalynX user ID
  subscriptionId: string;
  planType: 'STANDARD' | 'PREMIUM';
  billingCycle: 'monthly' | 'yearly';
}) {
  console.log('🧪 Manually triggering invoice for LegalynX user:', params);

  try {
    // Get LegalynX user from database
    const user = await prismaInvoiceService.getUserByEmail(params.legalynxUserId);

    if (!user) {
      console.error('❌ LegalynX user not found:', params.legalynxUserId, user);
      return { success: false, error: 'User not found' };
    }

    console.log('✅ Found LegalynX user for manual invoice:', {
      userId: user?.id,
      userEmail: user?.email,
      userName: user?.name
    });

    const result = await prismaInvoiceService.createAndSendInvoice({
      userId: user?.id,
      userEmail: user?.email,  // 🎯 LegalynX email
      userName: user?.name || user?.email.split('@')[0],
      planType: params.planType,
      billingCycle: params.billingCycle,
      subscriptionId: params.subscriptionId
    });
    
    if (result.success) {
      console.log('✅ Manual invoice sent successfully to LegalynX user:', {
        invoiceNumber: result.invoiceNumber,
        sentToEmail: user?.email
      });
    } else {
      console.error('❌ Manual invoice failed:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('❌ Manual invoice trigger error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}