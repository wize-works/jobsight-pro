import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type StripeSubscription = Database["public"]["Tables"]["stripe_subscriptions"]["Row"];
export type StripeSubscriptionInsert = Database["public"]["Tables"]["stripe_subscriptions"]["Insert"];
export type StripeSubscriptionUpdate = Database["public"]["Tables"]["stripe_subscriptions"]["Update"];