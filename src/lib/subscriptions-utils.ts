// src/lib/subscription-utils.ts
import { createServerClient } from "@/lib/supabase"

export async function getActiveSubscription(businessId: string) {
    const supabase = createServerClient();

    if (!businessId) {
        console.error("Business ID is required to check for active subscription.");
        return null;
    }

    if (!supabase) {
        console.error("Supabase client is not initialized.");
        return null;
    }

    const { data, error } = await supabase
        .from("business_subscriptions")
        .select("*")
        .eq("business_id", businessId)
        .eq("status", "active")
        .single();

    if (error) {
        console.error("Error checking active subscription:", error);
        return null;
    }

    return data;
}
