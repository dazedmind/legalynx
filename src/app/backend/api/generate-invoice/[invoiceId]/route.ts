import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import jwt from "jsonwebtoken";
import PDFDocument from "pdfkit";
export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const token = authHeader.split(" ")[1];

    // Verify JWT token
    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not defined");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET) as {
      userId: string;
      email: string;
    };

    const { invoiceId } = await params;

    // Fetch invoice with user and items
    const invoice = await prisma.invoice.findUnique({
      where: {
        id: invoiceId,
      },
      include: {
        user: true,
        invoice_items: true,
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    // Verify the invoice belongs to the user
    if (invoice.user_id !== decoded.userId) {
      return NextResponse.json(
        { error: "Unauthorized - Invoice does not belong to user" },
        { status: 403 }
      );
    }

    // Update viewed_at timestamp if not already viewed
    if (!invoice.viewed_at) {
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          viewed_at: new Date(),
          status: "VIEWED"
        },
      });
    }

    // Create PDF
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk) => chunks.push(chunk));

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
      .text(`Invoice #: ${invoice.invoice_number}`, 400, 80, { align: "right" })
      .text(
        `Date: ${new Date(invoice.created_at).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
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
      .text(invoice.user.name || "N/A", 50, 170)
      .text(invoice.user.email, 50, 185);

    // Line separator
    doc
      .moveTo(50, 220)
      .lineTo(550, 220)
      .stroke();

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
    invoice.invoice_items.forEach((item) => {
      doc
        .text(item.description, 50, yPosition, { width: 240 })
        .text(item.quantity.toString(), 300, yPosition)
        .text(`${invoice.currency} ${item.unit_price.toFixed(2)}`, 380, yPosition)
        .text(`${invoice.currency} ${item.total.toFixed(2)}`, 480, yPosition, {
          align: "right",
        });
      yPosition += 25;
    });

    // Line before total
    yPosition += 10;
    doc
      .moveTo(50, yPosition)
      .lineTo(550, yPosition)
      .stroke();

    // Subtotal and total
    yPosition += 20;
    const subtotal = invoice.invoice_items.reduce(
      (sum, item) => sum + item.total,
      0
    );

    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Subtotal:", 380, yPosition)
      .text(`${invoice.currency} ${subtotal.toFixed(2)}`, 480, yPosition, {
        align: "right",
      });

    yPosition += 20;
    doc
      .fontSize(12)
      .text("TOTAL:", 380, yPosition)
      .text(`${invoice.currency} ${invoice.amount.toFixed(2)}`, 480, yPosition, {
        align: "right",
      });

    // Payment information
    yPosition += 40;
    doc
      .fontSize(10)
      .font("Helvetica-Bold")
      .text("Payment Information:", 50, yPosition);

    yPosition += 20;
    doc
      .font("Helvetica")
      .text(`Plan: ${invoice.plan_type}`, 50, yPosition)
      .text(`Billing Cycle: ${invoice.billing_cycle}`, 50, yPosition + 15)
      .text(`Status: ${invoice.status}`, 50, yPosition + 30);

    // Footer
    doc
      .fontSize(8)
      .font("Helvetica")
      .text(
        "Thank you for your business!",
        50,
        doc.page.height - 100,
        { align: "center" }
      )
      .text(
        "For questions about this invoice, contact support@legalynx.com",
        50,
        doc.page.height - 85,
        { align: "center" }
      );

    doc.end();

    // Wait for PDF to be generated
    const pdfBuffer = await new Promise<Buffer>((resolve) => {
      doc.on("end", () => {
        resolve(Buffer.concat(chunks));
      });
    });

    // Return PDF as response (convert Buffer to Uint8Array)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${invoice.invoice_number}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Generate invoice error:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
