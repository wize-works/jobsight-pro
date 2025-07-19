"use server";

import { createServerClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import {
    fetchByBusiness,
    insertWithBusiness,
    updateWithBusinessCheck,
} from "@/lib/db";
import type {
    BusinessSubscription,
    SubscriptionPlan,
    BillingInterval,
} from "@/types/subscription";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { revalidatePath } from "next/cache";

/**
 * Server utility to get current subscription for a business
 */
export async function getCurrentSubscriptionServer(businessId: string): Promise<BusinessSubscription | null> {
    try {
        const supabase = createServerClient();

        if (!supabase) {
            console.error("Supabase client not initialized");
            return null;
        }

        const { data, error } = await supabase
            .from("business_subscriptions")
            .select("*")
            .eq("business_id", businessId)
            .in("status", ["active", "trialing"])
            .single();

        if (error) {
            console.error("Error fetching current subscription:", error);
            return null;
        }

        return data;
    } catch (error) {
        console.error("Error fetching current subscription:", error);
        return null;
    }
}

/**
 * Server utility to get subscription plans from JSON file
 */
export async function getSubscriptionPlansServer(): Promise<SubscriptionPlan[]> {
    // For now, we'll load from the static file. Later this could be from database or API
    const fs = require("fs");
    const path = require("path");

    try {
        const filePath = path.join(
            process.cwd(),
            "docs",
            "jobsight_pricing.json",
        );
        const fileContent = fs.readFileSync(filePath, "utf8");
        return JSON.parse(fileContent);
    } catch (error) {
        console.error("Error loading subscription plans:", error);
        return [];
    }
}

/**
 * Server utility to create or update subscription for a business
 */
export async function createSubscriptionServer(
    businessId: string,
    planId: string,
    billingInterval: BillingInterval,
): Promise<{ success: boolean; error?: string }> {
    try {
        // For subscription creation during registration, we need to get business manually
        console.log("Creating subscription for business:", businessId, "with plan:", planId);
        const supabase = createServerClient();
        const { userId } = await auth();
        if (!userId) {
            return { success: false, error: "User not authenticated" };
        }

        // Get user's business
        if (!supabase) {
            console.error("Supabase client is not initialized");
            return { success: false, error: "Internal server error" };
        }

        // Check if there's already an active or trialing subscription
        const { data: existingSubscription, error: subError } = await supabase
            .from("business_subscriptions")
            .select("*")
            .eq("business_id", businessId)
            .in("status", ["active", "trialing"])
            .single();

        // Get stripe customer ID for the business
        const { data: stripeCustomer } = await supabase
            .from("stripe_customers")
            .select("stripe_customer_id")
            .eq("business_id", businessId)
            .single();

        if (existingSubscription) {
            // Update existing subscription
            const { error } = await supabase
                .from("business_subscriptions")
                .update({
                    plan_id: planId,
                    stripe_customer_id: stripeCustomer?.stripe_customer_id || null,
                    updated_at: new Date().toISOString(),
                    updated_by: userId,
                })
                .eq("id", existingSubscription.id);

            if (error) {
                console.error("Error updating subscription:", error);
                return { success: false, error: error.message };
            }
        } else {
            // Create new subscription
            const { error } = await supabase
                .from("business_subscriptions")
                .insert({
                    business_id: businessId,
                    plan_id: planId,
                    start_date: new Date().toISOString(),
                    status: "active",
                    stripe_customer_id: stripeCustomer?.stripe_customer_id || null,
                    created_by: userId,
                    created_at: new Date().toISOString(),
                });

            if (error) {
                console.error("Error creating subscription:", error);
                return { success: false, error: error.message };
            }
        }

        revalidatePath("/dashboard/business");
        return { success: true };
    } catch (error) {
        console.error("Error creating subscription:", error);
        return { success: false, error: "Failed to create subscription" };
    }
}

/**
 * Server utility to cancel subscription for a business
 */
export async function cancelSubscriptionServer(businessId: string): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        const { business, userId } = await withBusinessServer();

        const currentSubscription = await getCurrentSubscriptionServer(businessId);
        if (!currentSubscription) {
            return { success: false, error: "No active subscription found" };
        }

        // Update subscription status to canceled
        const { data, error } = await updateWithBusinessCheck(
            "business_subscriptions",
            currentSubscription.id,
            {
                status: "canceled",
                end_date: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                updated_by: userId,
            } as BusinessSubscription,
            businessId,
        );

        if (error) {
            return { success: false, error: error.message };
        }

        revalidatePath("/dashboard/business");
        return { success: true };
    } catch (error) {
        console.error("Error canceling subscription:", error);
        return { success: false, error: "Failed to cancel subscription" };
    }
}
