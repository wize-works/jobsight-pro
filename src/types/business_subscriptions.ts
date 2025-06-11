import type { Database } from "@/types/supabase";
export type BusinessSubscription = Database["public"]["Tables"]["business_subscriptions"]["Row"];
export type BusinessSubscriptionInsert = Database["public"]["Tables"]["business_subscriptions"]["Insert"];
export type BusinessSubscriptionUpdate = Database["public"]["Tables"]["business_subscriptions"]["Update"];

export type BusinessSubscriptionStatus = "active" | "past_due" | "canceled" | "unpaid" | "incomplete" | "incomplete_expired";
export type BusinessSubscriptionPlan = "starter" | "personal" | "pro" | "business" | "enterprise";