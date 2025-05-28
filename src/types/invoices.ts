import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];
export type InvoiceUpdate = Database["public"]["Tables"]["invoices"]["Update"];

export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "cancelled";
export type PaymentMethod = "credit_card" | "bank_transfer" | "cash" | "check";

export const invoiceStatusOptions = createOptions<InvoiceStatus>({
    draft: { label: "Draft", badge: "badge-warning" },
    sent: { label: "Sent", badge: "badge-info" },
    paid: { label: "Paid", badge: "badge-success" },
    overdue: { label: "Overdue", badge: "badge-error" },
    cancelled: { label: "Cancelled", badge: "badge-secondary" }
});

export const paymentMethodOptions = createOptions<PaymentMethod>({
    credit_card: { label: "Credit Card", badge: "badge-primary" },
    bank_transfer: { label: "Bank Transfer", badge: "badge-secondary" },
    cash: { label: "Cash", badge: "badge-success" },
    check: { label: "Check", badge: "badge-info" }
});