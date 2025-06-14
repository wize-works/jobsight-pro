import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type BusinessSubscription = Database["public"]["Tables"]["business_subscriptions"]["Row"];
export type BusinessSubscriptionInsert = Database["public"]["Tables"]["business_subscriptions"]["Insert"];
export type BusinessSubscriptionUpdate = Database["public"]["Tables"]["business_subscriptions"]["Update"];

export interface SubscriptionPlan {
    id: string;
    name: string;
    monthly_price: number;
    annual_price: number;
    included_users: number;
    extra_user_price: number;
    ai_addon_available: boolean;
    ai_addon_price?: number;
    features: string[];
    stripe_product_id: string;
    stripe_monthly_price_id: string;
    stripe_annual_price_id: string;
}

export type BillingInterval = 'monthly' | 'annual';
