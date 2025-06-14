import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type StripeCustomer = Database["public"]["Tables"]["stripe_customers"]["Row"];
export type StripeCustomerInsert = Database["public"]["Tables"]["stripe_customers"]["Insert"];
export type StripeCustomerUpdate = Database["public"]["Tables"]["stripe_customers"]["Update"];