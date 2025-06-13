import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type StripeInvoice = Database["public"]["Tables"]["stripe_invoices"]["Row"];
export type StripeInvoiceInsert = Database["public"]["Tables"]["stripe_invoices"]["Insert"];
export type StripeInvoiceUpdate = Database["public"]["Tables"]["stripe_invoices"]["Update"];