import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type StripePaymentEvent = Database["public"]["Tables"]["stripe_payment_events"]["Row"];
export type StripePaymentEventInsert = Database["public"]["Tables"]["stripe_payment_events"]["Insert"];
export type StripePaymentEventUpdate = Database["public"]["Tables"]["stripe_payment_events"]["Update"];