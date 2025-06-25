import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type BusinessSubscription = Database["public"]["Tables"]["business_subscriptions"]["Row"];
export type BusinessSubscriptionInsert = Database["public"]["Tables"]["business_subscriptions"]["Insert"];
export type BusinessSubscriptionUpdate = Database["public"]["Tables"]["business_subscriptions"]["Update"];

export interface SubscriptionPlan {
    id: string;
    name: string;
    monthly_price: number | string; // string for "Custom" enterprise pricing
    annual_price: number | string; // string for "Custom" enterprise pricing
    included_users: number;
    extra_user_price: number;
    features: string[];
    stripe_product_id: string | null;
    stripe_monthly_price_id: string | null;
    stripe_annual_price_id: string | null;
}

export type BillingInterval = 'monthly' | 'annual';
