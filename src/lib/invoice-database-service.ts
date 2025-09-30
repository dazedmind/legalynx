// src/lib/invoice-database-service.ts
// Database service for invoice management

import { v4 as uuidv4 } from 'uuid';

export interface InvoiceRecord {
  id: string;
  invoice_number: string;
  user_id: string;
  plan_type: string;
  billing_cycle: string;
  amount: number;
  currency: string;
  subscription_id?: string;
  paypal_transaction_id?: string;
  status: 'sent' | 'failed' | 'delivered' | 'viewed';
  email_sent_to: string;
  sendgrid_message_id?: string;
  created_at: Date;
  sent_at?: Date;
  viewed_at?: Date;
}

export interface InvoiceItem {
  id: string;
  invoice_id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

class InvoiceDatabaseService {
  
  /**
   * [Unverified] Save invoice to database
   * Implement this based on your database setup (PostgreSQL, MySQL, etc.)
   */
  async saveInvoice(invoice: Omit<InvoiceRecord, 'id' | 'created_at'>): Promise<string> {
    const invoiceId = uuidv4();
    const now = new Date();

    /*
    // Example PostgreSQL implementation:
    try {
      const result = await db.query(`
        INSERT INTO invoices (
          id, invoice_number, user_id, plan_type, billing_cycle,
          amount, currency, subscription_id, paypal_transaction_id,
          status, email_sent_to, sendgrid_message_id, created_at, sent_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING id
      `, [
        invoiceId,
        invoice.invoice_number,
        invoice.user_id,
        invoice.plan_type,
        invoice.billing_cycle,
        invoice.amount,
        invoice.currency,
        invoice.subscription_id,
        invoice.paypal_transaction_id,
        invoice.status,
        invoice.email_sent_to,
        invoice.sendgrid_message_id,
        now,
        invoice.status === 'sent' ? now : null
      ]);

      return result.rows[0].id;
    } catch (error) {
      console.error('❌ Failed to save invoice to database:', error);
      throw new Error('Failed to save invoice');
    }
    */

    console.log('⚠️ Invoice database save not implemented - please add your database logic');
    console.log('📄 Invoice data to save:', { invoiceId, ...invoice, created_at: now });
    
    return invoiceId;
  }

  /**
   * [Unverified] Save invoice items to database
   */
  async saveInvoiceItems(invoiceId: string, items: Omit<InvoiceItem, 'id' | 'invoice_id'>[]): Promise<void> {
    /*
    try {
      const values = items.map(item => [
        uuidv4(),
        invoiceId,
        item.description,
        item.quantity,
        item.unit_price,
        item.total
      ]);

      await db.query(`
        INSERT INTO invoice_items (id, invoice_id, description, quantity, unit_price, total)
        VALUES ${values.map((_, i) => `($${i * 6 + 1}, $${i * 6 + 2}, $${i * 6 + 3}, $${i * 6 + 4}, $${i * 6 + 5}, $${i * 6 + 6})`).join(', ')}
      `, values.flat());

    } catch (error) {
      console.error('❌ Failed to save invoice items:', error);
      throw new Error('Failed to save invoice items');
    }
    */

    console.log('⚠️ Invoice items save not implemented - please add your database logic');
    console.log('📦 Invoice items to save:', { invoiceId, items });
  }

  /**
   * [Unverified] Update invoice status
   */
  async updateInvoiceStatus(invoiceNumber: string, status: InvoiceRecord['status'], messageId?: string): Promise<void> {
    /*
    try {
      const updateFields = ['status = $2'];
      const values = [invoiceNumber, status];
      
      if (status === 'delivered' || status === 'viewed') {
        updateFields.push(`${status}_at = CURRENT_TIMESTAMP`);
      }
      
      if (messageId) {
        updateFields.push('sendgrid_message_id = $' + (values.length + 1));
        values.push(messageId);
      }

      await db.query(`
        UPDATE invoices 
        SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE invoice_number = $1
      `, values);

    } catch (error) {
      console.error('❌ Failed to update invoice status:', error);
      throw new Error('Failed to update invoice status');
    }
    */

    console.log('⚠️ Invoice status update not implemented - please add your database logic');
    console.log('📊 Status update:', { invoiceNumber, status, messageId });
  }

  /**
   * [Unverified] Get user by email
   */
  async getUserByEmail(email: string): Promise<{ id: string; name: string; email: string } | null> {
    /*
    try {
      const result = await db.query(`
        SELECT id, name, email 
        FROM users 
        WHERE email = $1
      `, [email]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Failed to get user by email:', error);
      return null;
    }
    */

    console.log('⚠️ getUserByEmail not implemented - please add your database logic');
    return null;
  }

  /**
   * [Unverified] Get invoices for user
   */
  async getUserInvoices(userId: string, limit: number = 10): Promise<InvoiceRecord[]> {
    /*
    try {
      const result = await db.query(`
        SELECT * FROM invoices 
        WHERE user_id = $1 
        ORDER BY created_at DESC 
        LIMIT $2
      `, [userId, limit]);

      return result.rows;
    } catch (error) {
      console.error('❌ Failed to get user invoices:', error);
      return [];
    }
    */

    console.log('⚠️ getUserInvoices not implemented - please add your database logic');
    return [];
  }

  /**
   * [Unverified] Update subscription with last invoice info
   */
  async updateSubscriptionInvoice(subscriptionId: string, invoiceId: string): Promise<void> {
    /*
    try {
      await db.query(`
        UPDATE subscriptions 
        SET 
          last_invoice_id = $1,
          last_invoice_sent_at = CURRENT_TIMESTAMP
        WHERE subscription_id = $2
      `, [invoiceId, subscriptionId]);

    } catch (error) {
      console.error('❌ Failed to update subscription invoice info:', error);
    }
    */

    console.log('⚠️ Subscription invoice update not implemented');
    console.log('🔗 Update data:', { subscriptionId, invoiceId });
  }
}

// Export the service instance
export const invoiceDatabaseService = new InvoiceDatabaseService();

// Enhanced invoice service that includes database operations
import { prismaInvoiceService as baseInvoiceService } from './invoice-service';

class EnhancedInvoiceService {
  
  /**
   * Create and send invoice with database storage
   * [Unverified] Database operations depend on implementation
   */
  async createSendAndSaveInvoice(params: {
    userId: string;
    userEmail: string;
    userName: string;
    planType: 'STANDARD' | 'PREMIUM';
    billingCycle: 'monthly' | 'yearly';
    subscriptionId?: string;
    paypalTransactionId?: string;
  }): Promise<{ success: boolean; invoiceNumber?: string; invoiceId?: string; error?: string }> {
    
    try {
      // Create and send invoice using base service
      const result = await baseInvoiceService.createAndSendInvoice(params);
      
      if (!result.success || !result.invoiceNumber) {
        return result;
      }

      // Save to database
      const invoiceRecord = {
        invoice_number: result.invoiceNumber,
        user_id: params.userId,
        plan_type: params.planType,
        billing_cycle: params.billingCycle,
        amount: this.getPlanPricing(params.planType, params.billingCycle),
        currency: 'PHP',
        subscription_id: params.subscriptionId,
        paypal_transaction_id: params.paypalTransactionId,
        status: 'sent' as const,
        email_sent_to: params.userEmail,
        sendgrid_message_id: undefined // Would be set from SendGrid response
      };

      const invoiceId = await invoiceDatabaseService.saveInvoice(invoiceRecord);

      // Save invoice items
      const items = this.createInvoiceItems(params.planType, params.billingCycle);
      await invoiceDatabaseService.saveInvoiceItems(invoiceId, items);

      // Update subscription record
      if (params.subscriptionId) {
        await invoiceDatabaseService.updateSubscriptionInvoice(params.subscriptionId, invoiceId);
      }

      console.log('✅ Invoice created, sent, and saved:', {
        invoiceNumber: result.invoiceNumber,
        invoiceId,
        userEmail: params.userEmail
      });

      return {
        success: true,
        invoiceNumber: result.invoiceNumber,
        invoiceId
      };

    } catch (error) {
      console.error('❌ Enhanced invoice service error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to process invoice'
      };
    }
  }

  private getPlanPricing(planType: 'STANDARD' | 'PREMIUM', billingCycle: 'monthly' | 'yearly') {
    const prices = {
      STANDARD: { monthly: 129, yearly: 1290 },
      PREMIUM: { monthly: 249, yearly: 2490 }
    };
    return prices[planType][billingCycle];
  }

  private createInvoiceItems(planType: 'STANDARD' | 'PREMIUM', billingCycle: 'monthly' | 'yearly') {
    const unitPrice = this.getPlanPricing(planType, billingCycle);
    const billingPeriod = billingCycle === 'monthly' ? 'Monthly' : 'Annual';
    
    return [{
      description: `LegalynX ${planType} Plan - ${billingPeriod} Subscription`,
      quantity: 1,
      unit_price: unitPrice,
      total: unitPrice
    }];
  }
}

export const enhancedInvoiceService = new EnhancedInvoiceService();

// Test utility for invoice system
export class InvoiceTestUtility {
  
  /**
   * Test invoice sending without database operations
   */
  static async testInvoiceEmail(testData: {
    userEmail: string;
    userName: string;
    planType: 'STANDARD' | 'PREMIUM';
    billingCycle: 'monthly' | 'yearly';
  }) {
    console.log('🧪 Testing invoice email sending...');
    
    const result = await baseInvoiceService.createAndSendInvoice({
      userId: 'test-user-id',
      userEmail: testData.userEmail,
      userName: testData.userName,
      planType: testData.planType,
      billingCycle: testData.billingCycle,
      subscriptionId: 'test-subscription-id'
    });

    if (result.success) {
      console.log('✅ Test invoice sent successfully!');
      console.log('📧 Invoice Number:', result.invoiceNumber);
      console.log('📨 Sent to:', testData.userEmail);
    } else {
      console.log('❌ Test invoice failed:', result.error);
    }

    return result;
  }

  /**
   * Validate SendGrid configuration
   */
  static validateConfiguration(): { valid: boolean; missing: string[] } {
    const requiredEnvVars = [
      'SENDGRID_API_KEY',
      'SENDGRID_FROM_EMAIL'
    ];

    const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

    return {
      valid: missing.length === 0,
      missing
    };
  }
}
