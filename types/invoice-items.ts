import type { Database } from "@/types/supabase";

export type InvoiceItem = Database["public"]["Tables"]["invoice_items"]["Row"];
export type InvoiceItemInsert = Database["public"]["Tables"]["invoice_items"]["Insert"];
export type InvoiceItemUpdate = Database["public"]["Tables"]["invoice_items"]["Update"];