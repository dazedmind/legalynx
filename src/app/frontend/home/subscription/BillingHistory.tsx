"use client";
import React, { useEffect, useState } from "react";
import { ArrowLeft, Download, ExternalLink, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { authUtils } from "@/lib/auth";

interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  plan_type: string;
  billing_cycle: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  sent_at: string | null;
  viewed_at: string | null;
  invoice_items: InvoiceItem[];
}

interface BillingHistoryProps {
  onBack: () => void;
}

function BillingHistory({ onBack }: BillingHistoryProps) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

  useEffect(() => {
    fetchBillingHistory();
  }, []);

  const fetchBillingHistory = async () => {
    try {
      const token = authUtils.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch("/backend/api/billing-history", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch billing history");
      }

      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error("Error fetching billing history:", error);
      toast.error("Failed to load billing history");
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewInvoice = async (invoiceId: string) => {
    setDownloadingInvoiceId(invoiceId);
    try {
      const token = authUtils.getToken();
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`/backend/api/generate-invoice/${invoiceId}`, {
        method: "GET",
        headers: {
          "Authorization": `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to generate invoice");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");

      // Clean up the URL after opening
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error("Error generating invoice:", error);
      toast.error("Failed to generate invoice PDF");
    } finally {
      setDownloadingInvoiceId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SENT":
        return "bg-blue/20 text-blue-700 border-blue-300";
      case "DELIVERED":
        return "bg-green/20 text-green-700 border-green-300";
      case "VIEWED":
        return "bg-purple/20 text-purple-700 border-purple-300";
      case "FAILED":
        return "bg-red/20 text-red-700 border-red-300";
      default:
        return "bg-gray/20 text-gray-700 border-gray-300";
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-3 p-4 border-b border-tertiary">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Subscription
        </button>
      </div>

      <div className="p-4">
        <span className="flex flex-col gap-1 mb-6">
          <h1 className="text-3xl font-bold font-serif">Billing History</h1>
          <p className="text-sm text-muted-foreground">
            View and download your past invoices
          </p>
        </span>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="w-12 h-12 text-muted-foreground mb-3" />
            <h3 className="text-lg font-medium mb-2">No billing history</h3>
            <p className="text-sm text-muted-foreground">
              You don't have any invoices yet
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="p-4 border border-tertiary rounded-lg transition-colors"
              >
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium text-lg">
                        {invoice.invoice_number}
                      </h3>
                      <span
                        className={`text-xs px-2 py-1 rounded border ${getStatusColor(
                          invoice.status
                        )}`}
                      >
                        {invoice.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-muted-foreground">
                      <div>
                        <span className="font-medium">Plan:</span>{" "}
                        {invoice.plan_type}
                      </div>
                      <div>
                        <span className="font-medium">Billing:</span>{" "}
                        {invoice.billing_cycle}
                      </div>
                      <div>
                        <span className="font-medium">Date:</span>{" "}
                        {formatDate(invoice.created_at)}
                      </div>
                    </div>
                    <div className="mt-2 text-lg font-semibold">
                      {invoice.currency} {invoice.amount.toFixed(2)}
                    </div>
                  </div>

                  <button
                    onClick={() => handleViewInvoice(invoice.id)}
                    disabled={downloadingInvoiceId === invoice.id}
                    className="flex items-center justify-center gap-2 md:mr-8 px-4 py-2 bg-foreground text-primary text-sm rounded-md hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {downloadingInvoiceId === invoice.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <ExternalLink className="w-4 h-4" />
                        View Invoice
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BillingHistory;
