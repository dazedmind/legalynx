// src/lib/prisma-invoice-service.ts
import { SubscriptionStatus, InvoiceStatus } from "@prisma/client";
import type { BillingCycle } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import sgMail from "@sendgrid/mail";
import { v4 as uuidv4 } from "uuid";

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.error("SendGrid API key not found in environment variables");
}

export interface InvoiceItemData {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface InvoiceCreateData {
  userId: string;
  userEmail: string;
  userName: string;
  planType: "STANDARD" | "PREMIUM";
  billingCycle: "monthly" | "yearly";
  subscriptionId?: string;
  paypalTransactionId?: string;
}

class PrismaInvoiceService {
  private readonly fromEmail: string;
  private readonly companyDetails: {
    name: string;
    address: string;
    email: string;
    phone?: string;
    website?: string;
  };

  constructor() {
    this.fromEmail = process.env.SENDGRID_FROM_EMAIL || "noreply@legalynx.com";
    this.companyDetails = {
      name: process.env.COMPANY_NAME || "LegalynX",
      address:
        process.env.COMPANY_ADDRESS || "123 Legal Street, Law City, LC 12345",
      email: process.env.COMPANY_EMAIL || "billing@legalynx.com",
      phone: process.env.COMPANY_PHONE || "+1 (555) 123-4567",
      website: process.env.COMPANY_WEBSITE || "https://legalynx.com",
    };
  }

  /**
   * Generate unique invoice number
   */
  generateInvoiceNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const randomSuffix = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `INV-${year}-${month}-${randomSuffix}`;
  }

  /**
   * Get plan pricing based on plan type and billing cycle
   */
  private getPlanPricing(
    planType: "STANDARD" | "PREMIUM",
    billingCycle: "monthly" | "yearly"
  ): number {
    const prices = {
      STANDARD: { monthly: 129, yearly: 1290 },
      PREMIUM: { monthly: 249, yearly: 2490 },
    };
    return prices[planType][billingCycle];
  }

  /**
   * Create invoice items for the subscription
   */
  private createInvoiceItems(
    planType: "STANDARD" | "PREMIUM",
    billingCycle: "monthly" | "yearly"
  ): InvoiceItemData[] {
    const unitPrice = this.getPlanPricing(planType, billingCycle);
    const billingPeriod = billingCycle === "monthly" ? "Monthly" : "Annual";

    return [
      {
        description: `LegalynX ${planType} Plan - ${billingPeriod} Subscription`,
        quantity: 1,
        unitPrice,
        total: unitPrice,
      },
    ];
  }

  /**
   * Generate HTML invoice template
   */
  private generateInvoiceHTML(invoiceData: {
    invoiceNumber: string;
    userName: string;
    userEmail: string;
    planType: string;
    billingCycle: string;
    amount: number;
    currency: string;
    billingDate: Date;
    dueDate: Date;
    items: InvoiceItemData[];
  }): string {
    const {
      invoiceNumber,
      userName,
      userEmail,
      planType,
      billingCycle,
      amount,
      currency,
      billingDate,
      dueDate,
      items,
    } = invoiceData;

    const formattedBillingDate = billingDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const formattedDueDate = dueDate.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `
    <!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Invoice ${invoiceNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
            line-height: 1.6; 
            color: #1f2937; 
            background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
            margin: 0; 
            padding: 20px; 
            min-height: 100vh;
        }
        
        .invoice-wrapper {
            max-width: 800px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
            overflow: hidden;
            position: relative;
        }
        
        .invoice-wrapper::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6, #06b6d4);
        }
        
        .invoice-header { 
            background: linear-gradient(135deg, #1e40af 0%, #3730a3 100%);
            color: white; 
            padding: 20px;
            position: relative;
            overflow: hidden;
        }
        
        .invoice-header::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -10%;
            width: 200px;
            height: 200px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 50%;
        }
        
        .invoice-header-content {
            position: relative;
            z-index: 1;
        }
        
        .invoice-title { 
            font-size: 32px; 
            font-weight: 800; 
            margin: 0; 
            letter-spacing: -0.025em;
        }
        
        .invoice-number { 
            font-size: 18px; 
            opacity: 0.9; 
            font-weight: 500;
        }
        
        .invoice-body { 
            padding: 40px; 
        }
        
        .company-section {
            margin-bottom: 40px;
            padding: 24px;
            border-radius: 12px;
            border-left: 4px solid #3b82f6;
        }
        
        .company-name { 
            font-size: 24px; 
            font-weight: 700; 
            color: #1e40af; 
            margin-bottom: 8px; 
        }
        
        .company-details {
            color: #64748b;
            line-height: 1.8;
        }
        
        .billing-section { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 40px; 
            margin-bottom: 40px; 
        }
        
        .info-card {
            padding: 24px;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            background: #ffffff;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            margin-bottom: 20px;
        }
        
        .info-card h3 { 
            margin: 0 0 16px 0; 
            color: #374151; 
            font-size: 16px; 
            text-transform: uppercase; 
            letter-spacing: 0.5px; 
            font-weight: 600;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .info-card h3::before {
            content: '';
            width: 4px;
            height: 16px;
            background: #3b82f6;
            border-radius: 2px;
        }
        
        .info-card p { 
            margin: 8px 0; 
            color: #64748b;
        }
        
        .info-card strong {
            color: #1f2937;
        }
        
        .items-table { 
            width: 100%; 
            border-collapse: collapse; 
            margin: 40px 0; 
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        
        .items-table th { 
            padding: 20px; 
            text-align: left; 
            border-bottom: 1px solid #e2e8f0; 
            font-weight: 600; 
            color: #374151;
            font-size: 14px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .items-table td { 
            padding: 20px; 
            border-bottom: 1px solid #f1f5f9; 
            transition: background-color 0.2s;
        }
        
        .items-table tr:hover td {
            background: #f8fafc;
        }
        
        .items-table tr:last-child td {
            border-bottom: none;
        }
        
        .total-section { 
            padding: 32px; 
            border-radius: 16px; 
            margin-top: 32px; 
            border: 1px solid #e2e8f0;
            position: relative;
        }
        
        .total-section::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6);
            border-radius: 16px 16px 0 0;
        }
        
        .total-row { 
            display: flex; 
            justify-content: space-between; 
            margin: 8px 0; 
            font-weight: 600;
            color: #374151;
        }
        
        .total-amount { 
            font-size: 28px; 
            font-weight: bold; 
            color: #1e40af; 
            margin-top: 16px;
            padding-top: 16px;
            border-top: 2px solid #e2e8f0;
        }
        
        .plan-badge { 
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 4px 12px; 
            background: linear-gradient(135deg, #3b82f6, #1e40af); 
            color: white; 
            border-radius: 24px; 
            font-size: 14px; 
            font-weight: 600; 
            text-transform: uppercase; 
            letter-spacing: 0.5px;
            box-shadow: 0 4px 6px rgba(59, 130, 246, 0.3);
        }
      
        
        .footer { 
            padding: 32px; 
            text-align: center; 
            color: #64748b; 
            font-size: 14px; 
            border-top: 1px solid #e2e8f0;
        }
        
        .footer p {
            margin: 8px 0;
        }
        
        .footer strong {
            color: #1e40af;
        }
        
        /* Responsive Design */
        @media (max-width: 768px) {
            body {
                padding: 12px;
            }
            
            .invoice-body {
                padding: 24px;
            }
            
            .billing-section {
                grid-template-columns: 1fr;
                gap: 24px;
            }
            
            .invoice-header {
                padding: 24px;
            }
            
            .invoice-title {
                font-size: 24px;
            }
            
            .items-table th,
            .items-table td {
                padding: 12px;
                font-size: 14px;
            }
        }
        
        @media (max-width: 480px) {
            .items-table {
                font-size: 12px;
            }
            
            .items-table th:nth-child(2),
            .items-table td:nth-child(2) {
                display: none;
            }
        }
        
        /* Print Styles */
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .invoice-wrapper {
                box-shadow: none;
                border-radius: 0;
            }
            
            .invoice-wrapper::before {
                display: none;
            }
        }
    </style>
</head>
<body>
    <div class="invoice-wrapper">
        <div class="invoice-header">
            <div class="invoice-header-content">
                <div class="invoice-title">Invoice ${invoiceNumber}</div>
            </div>
        </div>
        
        <div class="invoice-body">
            <div class="company-section">
                <div class="company-name">${this.companyDetails.name}</div>
                <div class="company-details">
                    <p>${this.companyDetails.address}</p>
                    <p>Email: ${this.companyDetails.email}</p>
                    ${
                      this.companyDetails.phone
                        ? `<p>Phone: ${this.companyDetails.phone}</p>`
                        : ""
                    }
                    ${
                      this.companyDetails.website
                        ? `<p>Website: ${this.companyDetails.website}</p>`
                        : ""
                    }
                </div>
            </div>
            
            <div class="billing-section">
                <div class="info-card">
                    <h3>Bill To</h3>
                    <p><strong>${userName}</strong></p>
                    <p>${userEmail}</p>
                </div>
                
                <div class="info-card">
                    <h3>Invoice Details</h3>
                    <p><strong>Invoice Number:</strong> ${invoiceNumber}</p>
                    <p><strong>Invoice Date:</strong> ${formattedBillingDate}</p>
                    <p><strong>Due Date:</strong> ${formattedDueDate}</p>
                    <p><strong>Payment Method:</strong> PayPal</p>
                    <p><strong>Plan:</strong> <span class="plan-badge">${planType} ${billingCycle}</span></p>
                </div>
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Description</th>
                        <th style="text-align: center;">Quantity</th>
                        <th style="text-align: right;">Unit Price</th>
                        <th style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${items
                      .map(
                        (item) => `
                    <tr>
                        <td><strong>${item.description}</strong></td>
                        <td style="text-align: center;">${item.quantity}</td>
                        <td style="text-align: right;">₱${item.unitPrice.toFixed(
                          2
                        )} ${currency}</td>
                        <td style="text-align: right;"><strong>₱${item.total.toFixed(
                          2
                        )} ${currency}</strong></td>
                    </tr>
                    `
                      )
                      .join("")}
                </tbody>
            </table>
            
            <div class="total-section">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span>₱${amount.toFixed(2)}</span>
                </div>
                <div class="total-row">
                    <span>Tax:</span>
                    <span>₱0.00</span>
                </div>
                <div class="total-row total-amount">
                    <span>Paid:</span>                
                    <span>₱${amount.toFixed(2)}</span>
                </div>
            </div>
        </div>
        
        <div class="footer">
            <p><strong>Thank you for choosing ${
              this.companyDetails.name
            }!</strong></p>
            <p>This invoice was generated automatically upon your subscription activation.</p>
            <p>If you have any questions about this invoice, please contact us at <strong>${
              this.companyDetails.email
            }</strong></p>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Send invoice email using SendGrid
   */
  async sendInvoiceEmail(invoiceData: {
    invoiceNumber: string;
    userName: string;
    userEmail: string;
    planType: string;
    billingCycle: string;
    amount: number;
    currency: string;
    billingDate: Date;
    dueDate: Date;
    items: InvoiceItemData[];
  }): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        throw new Error("[Unverified] SendGrid API key not configured");
      }

      const htmlContent = this.generateInvoiceHTML(invoiceData);

      const msg = {
        to: invoiceData.userEmail,
        from: {
          email: this.fromEmail,
          name: this.companyDetails.name,
        },
        subject: `Invoice ${invoiceData.invoiceNumber} - ${invoiceData.planType} Plan Subscription`,
        html: htmlContent,
        text: `
Invoice: ${invoiceData.invoiceNumber}
Plan: ${invoiceData.planType} (${invoiceData.billingCycle})
Amount: ₱${invoiceData.amount.toFixed(2)} ${invoiceData.currency}
Date: ${invoiceData.billingDate.toLocaleDateString()}

Thank you for subscribing to ${this.companyDetails.name}!
        `.trim(),
        categories: ["invoice", "subscription"],
        customArgs: {
          invoice_number: invoiceData.invoiceNumber,
          plan_type: invoiceData.planType,
          user_id: "user_id_placeholder",
        },
      };

      const response = await sgMail.send(msg);

      return {
        success: true,
        messageId: response[0]?.headers?.["x-message-id"] || undefined,
      };
    } catch (error: any) {
      console.error("❌ Failed to send invoice email:", error);
      return {
        success: false,
        error: error.message || "Failed to send invoice email",
      };
    }
  }

  /**
   * Create invoice in database using Prisma
   */
  async createInvoiceInDatabase(data: InvoiceCreateData): Promise<{
    success: boolean;
    invoiceId?: string;
    invoiceNumber?: string;
    error?: string;
  }> {
    try {
      const invoiceNumber = this.generateInvoiceNumber();
      const billingDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30); // 30 days to pay

      const amount = this.getPlanPricing(data.planType, data.billingCycle);
      const items = this.createInvoiceItems(data.planType, data.billingCycle);

      // Map string values to enum values
      const planTypeEnum = data.planType as SubscriptionStatus;
      const billingCycleEnum =
        data.billingCycle === "monthly"
          ? ("MONTHLY" as BillingCycle)
          : ("YEARLY" as BillingCycle);

      // Create invoice with items in a transaction
      const result = await prisma.$transaction(async (tx) => {
        // Create the invoice
        const invoice = await tx.invoice.create({
          data: {
            invoice_number: invoiceNumber,
            user_id: data.userId,
            plan_type: planTypeEnum,
            billing_cycle: billingCycleEnum,
            amount,
            currency: "PHP",
            subscription_id: data.subscriptionId,
            paypal_transaction_id: data.paypalTransactionId,
            status: InvoiceStatus.SENT,
            email_sent_to: data.userEmail,
            sent_at: new Date(),
          },
        });

        // Create invoice items
        await tx.invoiceItem.createMany({
          data: items.map((item) => ({
            invoice_id: invoice.id,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unitPrice,
            total: item.total,
          })),
        });

        // Update subscription with last invoice info if subscription_id exists
        if (data.subscriptionId) {
          await tx.subscription.updateMany({
            where: {
              external_subscription_id: data.subscriptionId,
            },
            data: {
              // Note: You'll need to add these fields to your Subscription model
              // last_invoice_id: invoice.id,
              // last_invoice_sent_at: new Date()
            },
          });
        }

        return invoice;
      });

      console.log("✅ Invoice created in database:", {
        invoiceId: result.id,
        invoiceNumber: result.invoice_number,
        userEmail: data.userEmail,
        amount,
      });

      return {
        success: true,
        invoiceId: result.id,
        invoiceNumber: result.invoice_number,
      };
    } catch (error: any) {
      console.error("❌ Failed to create invoice in database:", error);
      return {
        success: false,
        error: error.message || "Failed to create invoice",
      };
    }
  }

  /**
   * Create, send, and save invoice - complete workflow
   */
  async createAndSendInvoice(data: InvoiceCreateData): Promise<{
    success: boolean;
    invoiceNumber?: string;
    invoiceId?: string;
    error?: string;
  }> {
    try {
      // First create invoice in database
      const dbResult = await this.createInvoiceInDatabase(data);

      if (!dbResult.success || !dbResult.invoiceNumber) {
        return {
          success: false,
          error: dbResult.error || "Failed to create invoice in database",
        };
      }

      // Prepare email data
      const billingDate = new Date();
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 30);

      const amount = this.getPlanPricing(data.planType, data.billingCycle);
      const items = this.createInvoiceItems(data.planType, data.billingCycle);

      const emailData = {
        invoiceNumber: dbResult.invoiceNumber,
        userName: data.userName,
        userEmail: data.userEmail,
        planType: data.planType,
        billingCycle: data.billingCycle,
        amount,
        currency: "PHP",
        billingDate,
        dueDate,
        items,
      };

      // Send the email
      const emailResult = await this.sendInvoiceEmail(emailData);

      if (emailResult.success) {
        // Update invoice with SendGrid message ID if available
        if (emailResult.messageId && dbResult.invoiceId) {
          await prisma.invoice.update({
            where: { id: dbResult.invoiceId },
            data: { sendgrid_message_id: emailResult.messageId },
          });
        }

        console.log("✅ Invoice created, sent, and saved successfully:", {
          invoiceNumber: dbResult.invoiceNumber,
          invoiceId: dbResult.invoiceId,
          userEmail: data.userEmail,
          messageId: emailResult.messageId,
        });

        return {
          success: true,
          invoiceNumber: dbResult.invoiceNumber,
          invoiceId: dbResult.invoiceId,
        };
      } else {
        // Email failed, update invoice status
        if (dbResult.invoiceId) {
          await prisma.invoice.update({
            where: { id: dbResult.invoiceId },
            data: { status: InvoiceStatus.FAILED },
          });
        }

        return {
          success: false,
          error: `Invoice created but email failed: ${emailResult.error}`,
        };
      }
    } catch (error: any) {
      console.error("❌ Complete invoice workflow failed:", error);
      return {
        success: false,
        error: error.message || "Invoice workflow failed",
      };
    }
  }

  /**
   * Get user invoices from database
   */
  async getUserInvoices(userId: string, limit: number = 10) {
    try {
      const invoices = await prisma.invoice.findMany({
        where: { user_id: userId },
        include: {
          invoice_items: true,
          user: {
            select: {
              name: true,
              email: true,
            },
          },
        },
        orderBy: { created_at: "desc" },
        take: limit,
      });

      return invoices;
    } catch (error) {
      console.error("❌ Failed to get user invoices:", error);
      return [];
    }
  }

  /**
   * Update invoice status (for webhooks)
   */
  async updateInvoiceStatus(
    invoiceNumber: string,
    status: InvoiceStatus,
    messageId?: string
  ) {
    try {
      const updateData: any = {
        status,
        updated_at: new Date(),
      };

      if (status === InvoiceStatus.VIEWED) {
        updateData.viewed_at = new Date();
      }

      if (messageId) {
        updateData.sendgrid_message_id = messageId;
      }

      await prisma.invoice.update({
        where: { invoice_number: invoiceNumber },
        data: updateData,
      });

      console.log("✅ Invoice status updated:", { invoiceNumber, status });
    } catch (error) {
      console.error("❌ Failed to update invoice status:", error);
    }
  }

  /**
   * Get user by email using Prisma
   */
  async getUserByEmail(email: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      return user;
    } catch (error) {
      console.error("❌ Failed to get user by email:", error);
      return null;
    }
  }
}

export const prismaInvoiceService = new PrismaInvoiceService();
