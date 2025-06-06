import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";
import { InvoiceItem } from "./invoice-items";
import { Client } from "./clients";
import { Project } from "./projects";

export type Invoice = Database["public"]["Tables"]["invoices"]["Row"];
export type InvoiceInsert = Database["public"]["Tables"]["invoices"]["Insert"];
export type InvoiceUpdate = Database["public"]["Tables"]["invoices"]["Update"];

export type InvoiceStatus = "all" | "draft" | "sent" | "paid" | "pending" | "overdue" | "cancelled";
export type PaymentMethod = "all" | "credit_card" | "bank_transfer" | "cash" | "check";

export const invoiceStatusOptions = createOptions<InvoiceStatus>({
    all: { label: "All", badge: "badge-neutral" },
    draft: { label: "Draft", badge: "badge-warning" },
    sent: { label: "Sent", badge: "badge-info" },
    paid: { label: "Paid", badge: "badge-success" },
    pending: { label: "Pending", badge: "badge-primary" },
    overdue: { label: "Overdue", badge: "badge-error" },
    cancelled: { label: "Cancelled", badge: "badge-secondary" }
});

export const paymentMethodOptions = createOptions<PaymentMethod>({
    all: { label: "All", badge: "badge-neutral" },
    credit_card: { label: "Credit Card", badge: "badge-primary" },
    bank_transfer: { label: "Bank Transfer", badge: "badge-secondary" },
    cash: { label: "Cash", badge: "badge-success" },
    check: { label: "Check", badge: "badge-info" }
});

export type InvoiceWithClient = Database["public"]["Tables"]["invoices"]["Row"] & {
    client: Client;
};

export type InvoiceWithDetails = Database["public"]["Tables"]["invoices"]["Row"] & {
    items: InvoiceItem[];
    client?: Client | null;
    project?: Project | null;
    billing_address: {
        name: string;
        attention?: string | null;
        street?: string | null;
        city?: string | null;
        state?: string | null;
        zip?: string | null;
        country?: string | null;
    };
    business_info: {
        name: string;
        street?: string | null;
        city?: string | null;
        state?: string | null;
        zip?: string | null;
        country?: string | null;
        phone?: string | null;
        email?: string | null;
        website?: string | null;
        logo_url?: string | null;
        tax_id?: string | null;
    };
};