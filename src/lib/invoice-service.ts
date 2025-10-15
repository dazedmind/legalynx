// src/lib/prisma-invoice-service.ts
import { SubscriptionStatus, InvoiceStatus } from "@prisma/client";
import type { BillingCycle } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import sgMail from "@sendgrid/mail";
import { v4 as uuidv4 } from "uuid";
import PDFDocument from "pdfkit";

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

    const formattedBillingDate = billingDate.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
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
    <title>Invoice ${invoiceNumber} - LegalynX</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; line-height: 1.6; color: #1a1a1a; background-color: #f5f5f5; margin: 0; padding: 40px 20px; }
        @media (prefers-color-scheme: dark) { body { background-color: #1a1a1a; } }
        .email-wrapper { max-width: 680px; margin: 0 auto; background-color: #ffffff; border-radius: 4px; overflow: hidden; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1); }
        @media (prefers-color-scheme: dark) { .email-wrapper { background-color: #2d2d2d; box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4); } }
        .invoice-header { background: linear-gradient(135deg, #0047AB 0%, #003380 100%); color: #ffffff !important; padding: 40px 40px 32px; position: relative; width: 100%; }
        .header-top { width: 100%; margin-bottom: 24px; }
        .header-top table { width: 100%; border-collapse: collapse; }
        .brand-cell { text-align: left; vertical-align: middle; }
        .status-cell { text-align: right; vertical-align: middle; }
        .brand-section { display: inline-block; }
        .brand-logo { padding: 3px; width: 48px; height: 48px; background-color: #FFFFFF !important; border: 2px solid #FFFFFF; display: inline-block; vertical-align: middle; text-align: center; line-height: 48px; font-size: 24px; font-weight: bold; color: #FFFFFF; border-radius: 100%; margin-right: 12px; }
        .brand-name { font-size: 28px; font-weight: bold; color: #ffffff !important; letter-spacing: -0.5px; display: inline-block; vertical-align: middle; }
        .status-badge { background-color: #10b981; color: #ffffff !important; padding: 6px 14px; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; border-radius: 7px; display: inline-block; }
        .invoice-meta { color: #ffffff !important; border-top: 1px solid rgba(255, 255, 255, 0.2); padding-top: 20px; }
        .invoice-label { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; opacity: 0.8; margin-bottom: 4px; color: #ffffff !important; }
        .invoice-number { font-size: 24px; font-weight: bold; color: #FFFFFF !important; }
        .invoice-body { padding: 40px; background-color: #ffffff; }
        @media (prefers-color-scheme: dark) { .invoice-body { background-color: #2d2d2d; color: #e5e5e5; } }
        .info-grid { display: table; width: 100%; margin-bottom: 32px; border-collapse: separate; border-spacing: 16px 0; }
        .info-column { display: table-cell; width: 50%; vertical-align: top; padding: 24px; background-color: #f9f9f9; border: 1px solid #e5e5e5; border-radius: 7px; }
        @media (prefers-color-scheme: dark) { .info-column { background-color: #1f1f1f; border-color: #404040; } }
        .info-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #666666; margin-bottom: 12px; font-weight: bold; }
        @media (prefers-color-scheme: dark) { .info-label { color: #999999; } }
        .info-value { font-size: 15px; color: #1a1a1a; margin-bottom: 8px; line-height: 1.6; }
        @media (prefers-color-scheme: dark) { .info-value { color: #e5e5e5; } }
        .info-value strong { font-weight: bold; display: block; margin-bottom: 4px; }
        .plan-badge { display: inline-block; padding: 6px 12px; background-color: #0047AB; color: #FFFFFF !important; font-size: 12px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 8px; border-radius: 7px; }
        .items-section { margin: 32px 0; }
        .section-title { font-size: 12px; text-transform: uppercase; letter-spacing: 1px; color: #666666; margin-bottom: 16px; font-weight: bold; padding-bottom: 8px; }
        @media (prefers-color-scheme: dark) { .section-title { color: #999999; border-bottom-color: #FFD600; } }
        .items-table { width: 100%; border-collapse: collapse; border: 1px solid #e5e5e5; border-radius: 7px; }
        @media (prefers-color-scheme: dark) { .items-table { border-color: #404040; } }
        .items-table th { padding: 14px 16px; text-align: left; font-weight: bold; color: #1a1a1a; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; background-color: #f9f9f9; border-bottom: 2px solid #e5e5e5; }
        @media (prefers-color-scheme: dark) { .items-table th { background-color: #1f1f1f; color: #e5e5e5; border-bottom-color: #404040; } }
        .items-table td { padding: 16px; border-bottom: 1px solid #f0f0f0; background-color: #ffffff; color: #1a1a1a; }
        @media (prefers-color-scheme: dark) { .items-table td { background-color: #2d2d2d; color: #e5e5e5; border-bottom-color: #404040; } }
        .items-table tbody tr:last-child td { border-bottom: none; }
        .item-description { font-weight: bold; }
        .total-section { background: linear-gradient(135deg, #0047AB 0%, #003380 100%); padding: 28px 32px; margin-top: 32px; color: #ffffff !important; border-radius: 7px; }
        .total-row { display: flex; justify-content: space-between; margin: 10px 0; font-size: 15px; color: rgba(255, 255, 255, 0.9) !important; }
        .total-divider { border-top: 1px solid rgba(255, 255, 255, 0.2); margin: 16px 0; }
        .total-amount { display: flex; justify-content: space-between; align-items: center; font-size: 36px; font-weight: bold; color: #FFFFFF !important; margin-top: 16px; }
        .amount-label { font-size: 14px; text-transform: uppercase; letter-spacing: 1px; color: #FFFFFF !important; }
        .invoice-footer { background-color: #f9f9f9; padding: 32px 40px; text-align: center; border-top: 1px solid #e5e5e5; color: #666666; }
        @media (prefers-color-scheme: dark) { .invoice-footer { background-color: #1f1f1f; border-top-color: #404040; color: #999999; } }
        .footer-message { font-size: 15px; line-height: 1.8; margin-bottom: 8px; color: #333333; }
        @media (prefers-color-scheme: dark) { .footer-message { color: #cccccc; } }
        .footer-message strong { color: #333333; font-weight: bold; }
        @media (prefers-color-scheme: dark) { .footer-message strong { color: #FFFFFF; } }
        .footer-contact { font-size: 14px; margin-top: 16px; color: #666666; }
        @media (prefers-color-scheme: dark) { .footer-contact { color: #999999; } }
        .footer-contact strong { color: #0047AB; font-weight: bold; }
        @media (prefers-color-scheme: dark) { .footer-contact strong { color: #FFD600; } }
        .copyright { font-size: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e5e5; color: #999999; }
        @media (prefers-color-scheme: dark) { .copyright { border-top-color: #404040; color: #666666; } }
        @media (max-width: 600px) {
            body { padding: 20px 12px; }
            .invoice-header { padding: 24px 20px; }
            .invoice-body { padding: 24px 20px; }
            .info-grid { display: block; }
            .info-column { display: block; width: 100%; margin-bottom: 16px; }
            .brand-name { font-size: 22px; }
            .invoice-number { font-size: 20px; }
            .items-table th, .items-table td { padding: 10px; font-size: 13px; }
            .items-table th:nth-child(2), .items-table td:nth-child(2) { display: none; }
            .total-amount { font-size: 32px; }
            .invoice-footer { padding: 24px 20px; }
            .total-section { padding: 20px; }
        }
        @media print { body { background-color: white; padding: 0; } .email-wrapper { box-shadow: none; } }
    </style>
</head>
<body>
    <div class="email-wrapper">
        <div class="invoice-header">
            <div class="header-top">
                <table role="presentation">
                    <tr>
                        <td class="brand-cell">
                            <div class="brand-section">
                                <div class="brand-logo"><img src="https://i.imgur.com/vrDo3wE.png" width="40" alt="L" style="display:block;"></div>
                                <span class="brand-name">LegalynX</span>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
            <div class="invoice-meta">
                <div class="invoice-label">Invoice Number</div>
                <div class="invoice-number">${invoiceNumber}</div>
            </div>
        </div>
        
        <div class="invoice-body">
            <div class="info-grid">
                <div class="info-column">
                    <div class="info-label">Bill To</div>
                    <div class="info-value"><strong>${userName}</strong>${userEmail}</div>
                </div>
                <div class="info-column">
                    <div class="info-label">Invoice Details</div>
                    <div class="info-value"><strong>Date:</strong> ${formattedBillingDate}</div>
                    <div class="info-value"><strong>Due Date:</strong> ${formattedDueDate}</div>
                    <div class="info-value"><strong>Payment Method:</strong> PayPal</div>
                    <div class="plan-badge">${planType}</div>
                </div>
            </div>
            
            <div class="items-section">
                <div class="section-title">Invoice Items</div>
                <table class="items-table" role="presentation">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th style="text-align: center; width: 80px;">Qty</th>
                            <th style="text-align: right; width: 120px;">Unit Price</th>
                            <th style="text-align: right; width: 120px;">Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(item => `
                        <tr>
                            <td class="item-description">${item.description}</td>
                            <td style="text-align: center;">${item.quantity}</td>
                            <td style="text-align: right;">₱${item.unitPrice.toFixed(2)}</td>
                            <td style="text-align: right;"><strong>₱${item.total.toFixed(2)}</strong></td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="total-section">
                <div class="total-row"><span>Subtotal: </span><span>₱${amount.toFixed(2)}</span></div>
                <div class="total-divider"></div>
                <div class="total-amount">
                    <div>
                        <div class="amount-label">Total Paid</div>
                        <div>₱${amount.toFixed(2)}</div>
                    </div>
                </div>
            </div>
        </div>
        
        <div class="invoice-footer">
            <p class="footer-message"><strong>Thank you for choosing LegalynX!</strong><br>Your subscription is now active. This invoice was generated automatically upon payment confirmation.</p>
            <p class="footer-contact">Questions about this invoice? Contact us at <strong>${this.companyDetails.email}</strong></p>
            <p class="copyright">&copy; 2025 LegalynX. All rights reserved.<br>Empowering legal professionals with AI-driven document analysis.</p>
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * Generate PDF invoice buffer
   */
  async generateInvoicePDF(invoiceData: {
    invoiceNumber: string;
    userName: string;
    userEmail: string;
    planType: string;
    billingCycle: string;
    amount: number;
    currency: string;
    billingDate: Date;
    items: InvoiceItemData[];
  }): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const chunks: Buffer[] = [];

        doc.on("data", (chunk) => chunks.push(chunk));
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);

        // Header
        doc
          .fontSize(20)
          .font("Helvetica-Bold")
          .text("LEGALYNX", 50, 50)
          .fontSize(10)
          .font("Helvetica")
          .text("Linking you to legal clarity", 50, 75);

        // Invoice title
        doc
          .fontSize(24)
          .font("Helvetica-Bold")
          .text("INVOICE", 400, 50, { align: "right" });

        // Invoice details
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(`Invoice #: ${invoiceData.invoiceNumber}`, 400, 80, { align: "right" })
          .text(
            `Date: ${invoiceData.billingDate.toLocaleString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
            })}`,
            400,
            95,
            { align: "right" }
          );

        // Bill to section
        doc.fontSize(12).font("Helvetica-Bold").text("BILL TO:", 50, 150);
        doc
          .fontSize(10)
          .font("Helvetica")
          .text(invoiceData.userName || "N/A", 50, 170)
          .text(invoiceData.userEmail, 50, 185);

        // Line separator
        doc.moveTo(50, 220).lineTo(550, 220).stroke();

        // Table header
        let yPosition = 240;
        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("Description", 50, yPosition)
          .text("Quantity", 300, yPosition)
          .text("Unit Price", 380, yPosition)
          .text("Total", 480, yPosition, { align: "right" });

        yPosition += 20;

        // Table rows
        doc.font("Helvetica");
        invoiceData.items.forEach((item) => {
          doc
            .text(item.description, 50, yPosition, { width: 240 })
            .text(item.quantity.toString(), 300, yPosition)
            .text(`${invoiceData.currency} ${item.unitPrice.toFixed(2)}`, 380, yPosition)
            .text(`${invoiceData.currency} ${item.total.toFixed(2)}`, 480, yPosition, {
              align: "right",
            });
          yPosition += 25;
        });

        // Line before total
        yPosition += 10;
        doc.moveTo(50, yPosition).lineTo(550, yPosition).stroke();

        // Subtotal and total
        yPosition += 20;
        const subtotal = invoiceData.items.reduce((sum, item) => sum + item.total, 0);

        doc
          .fontSize(10)
          .font("Helvetica-Bold")
          .text("Subtotal:", 380, yPosition)
          .text(`${invoiceData.currency} ${subtotal.toFixed(2)}`, 480, yPosition, {
            align: "right",
          });

        yPosition += 20;
        doc
          .fontSize(12)
          .text("TOTAL:", 380, yPosition)
          .text(`${invoiceData.currency} ${invoiceData.amount.toFixed(2)}`, 480, yPosition, {
            align: "right",
          });

        // Payment information
        yPosition += 40;
        doc.fontSize(10).font("Helvetica-Bold").text("Payment Information:", 50, yPosition);

        yPosition += 20;
        doc
          .font("Helvetica")
          .text(`Plan: ${invoiceData.planType}`, 50, yPosition)
          .text(`Billing Cycle: ${invoiceData.billingCycle}`, 50, yPosition + 15)
          .text(`Status: PAID`, 50, yPosition + 30);

        // Footer
        doc
          .fontSize(8)
          .font("Helvetica")
          .text("Thank you for your business!", 50, doc.page.height - 100, {
            align: "center",
          })
          .text(
            "For questions about this invoice, contact support@legalynx.com",
            50,
            doc.page.height - 85,
            { align: "center" }
          );

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
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

      // Generate PDF attachment
      const pdfBuffer = await this.generateInvoicePDF(invoiceData);
      const pdfBase64 = pdfBuffer.toString("base64");

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

Please find your invoice attached as a PDF.
        `.trim(),
        categories: ["invoice", "subscription"],
        customArgs: {
          invoice_number: invoiceData.invoiceNumber,
          plan_type: invoiceData.planType,
          user_id: "user_id_placeholder",
        },
        attachments: [
          {
            content: pdfBase64,
            filename: `invoice-${invoiceData.invoiceNumber}.pdf`,
            type: "application/pdf",
            disposition: "attachment",
          },
        ],
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
    isDuplicate?: boolean; // Flag to indicate if this was a duplicate
  }> {
    try {
      console.log('🔍 Checking for duplicate invoice with data:', {
        userId: data.userId,
        subscriptionId: data.subscriptionId,
        planType: data.planType,
        billingCycle: data.billingCycle
      });

      // Check if invoice already exists for this subscription activation
      // Prevent duplicate invoices by checking for ANY existing invoice with this subscription_id
      // This is more robust than time-based checks and prevents duplicates completely
      if (data.subscriptionId) {
        const existingInvoice = await prisma.invoice.findFirst({
          where: {
            user_id: data.userId,
            subscription_id: data.subscriptionId,
            // Only check for invoices with the same plan and billing cycle
            plan_type: data.planType as any,
            billing_cycle: data.billingCycle === 'monthly' ? 'MONTHLY' : 'YEARLY'
          },
          orderBy: {
            created_at: 'desc'
          }
        });

        if (existingInvoice) {
          console.log('⚠️ Invoice already exists for this subscription, skipping duplicate:', {
            existingInvoiceId: existingInvoice.id,
            existingInvoiceNumber: existingInvoice.invoice_number,
            subscriptionId: data.subscriptionId,
            alreadySentTo: existingInvoice.email_sent_to,
            createdAt: existingInvoice.created_at,
            planType: existingInvoice.plan_type,
            billingCycle: existingInvoice.billing_cycle
          });

          return {
            success: true,
            invoiceId: existingInvoice.id,
            invoiceNumber: existingInvoice.invoice_number,
            isDuplicate: true, // Mark as duplicate
          };
        }
      }

      console.log('✅ No duplicate found, creating new invoice...');

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
      // Use transaction to prevent race conditions
      const result = await prisma.$transaction(async (tx) => {
        // Double-check for existing invoice within the transaction to prevent race conditions
        if (data.subscriptionId) {
          const existingInvoice = await tx.invoice.findFirst({
            where: {
              user_id: data.userId,
              subscription_id: data.subscriptionId,
              plan_type: data.planType as any,
              billing_cycle: data.billingCycle === 'monthly' ? 'MONTHLY' : 'YEARLY'
            }
          });

          if (existingInvoice) {
            console.log('⚠️ Race condition detected: Invoice created by concurrent request:', {
              existingInvoiceId: existingInvoice.id,
              existingInvoiceNumber: existingInvoice.invoice_number,
              subscriptionId: data.subscriptionId,
              planType: existingInvoice.plan_type,
              billingCycle: existingInvoice.billing_cycle
            });
            // Return the existing invoice instead of creating a duplicate
            return existingInvoice;
          }
        }

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

      // Check if we got back an existing invoice (from race condition check)
      const isRaceDuplicate = result.invoice_number !== invoiceNumber;

      if (isRaceDuplicate) {
        console.log("⚠️ Returning existing invoice due to race condition:", {
          existingInvoiceId: result.id,
          existingInvoiceNumber: result.invoice_number,
          attemptedInvoiceNumber: invoiceNumber,
        });

        return {
          success: true,
          invoiceId: result.id,
          invoiceNumber: result.invoice_number,
          isDuplicate: true,
        };
      }

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
        isDuplicate: false,
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

      // If this is a duplicate invoice, skip email sending
      if (dbResult.isDuplicate) {
        console.log('✅ Duplicate invoice detected, skipping email send:', {
          invoiceNumber: dbResult.invoiceNumber,
          invoiceId: dbResult.invoiceId,
          userEmail: data.userEmail,
        });

        return {
          success: true,
          invoiceNumber: dbResult.invoiceNumber,
          invoiceId: dbResult.invoiceId,
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
