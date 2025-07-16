import { NextRequest, NextResponse } from "next/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { createServerClient } from "@/lib/supabase";
import { auth } from "@clerk/nextjs/server";
import { updateWithBusinessCheck } from "@/lib/db";
import type {
    BusinessSubscription,
    SubscriptionPlan,
    BillingInterval,
} from "@/types/subscription";
import { revalidatePath } from "next/cache";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');
        const businessId = searchParams.get('businessId');

        switch (action) {
            case 'get-current-subscription':
                if (!businessId) {
                    return NextResponse.json({ success: false, error: "Business ID required" }, { status: 400 });
                }
                return await getCurrentSubscription(businessId);
            case 'get-subscription-plans':
                return await getSubscriptionPlans();
            default:
                return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Subscriptions API error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const { action, ...data } = await req.json();

        switch (action) {
            case 'create-subscription':
                return await createSubscription(data.businessId, data.planId, data.billingInterval);
            case 'cancel-subscription':
                return await cancelSubscription(data.businessId);
            default:
                return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Subscriptions API error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

async function getCurrentSubscription(businessId: string) {
    try {
        const supabase = createServerClient();

        if (!supabase) {
            console.error("Supabase client not initialized");
            return NextResponse.json({ success: false, error: "Supabase client not initialized" }, { status: 500 });
        }

        const { data, error } = await supabase
            .from("business_subscriptions")
            .select("*")
            .eq("business_id", businessId)
            .in("status", ["active", "trialing"])
            .single();

        if (error) {
            console.error("Error fetching current subscription:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 404 });
        }

        return NextResponse.json({ success: true, subscription: data });
    } catch (error) {
        console.error("Error fetching current subscription:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch subscription" }, { status: 500 });
    }
}

async function getSubscriptionPlans() {
    try {
        // For now, we'll load from the static file. Later this could be from database or API
        const fs = require("fs");
        const path = require("path");

        const filePath = path.join(
            process.cwd(),
            "docs",
            "jobsight_pricing.json",
        );
        const fileContent = fs.readFileSync(filePath, "utf8");
        const plans = JSON.parse(fileContent);

        return NextResponse.json({ success: true, plans });
    } catch (error) {
        console.error("Error loading subscription plans:", error);
        return NextResponse.json({ success: false, error: "Failed to load subscription plans" }, { status: 500 });
    }
}

async function createSubscription(
    businessId: string,
    planId: string,
    billingInterval: BillingInterval,
) {
    try {
        // For subscription creation during registration, we need to get business manually
        console.log("Creating subscription for business:", businessId, "with plan:", planId);
        const supabase = createServerClient();
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ success: false, error: "User not authenticated" }, { status: 401 });
        }

        // Get user's business
        if (!supabase) {
            console.error("Supabase client is not initialized");
            return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
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
                return NextResponse.json({ success: false, error: error.message }, { status: 500 });
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
                return NextResponse.json({ success: false, error: error.message }, { status: 500 });
            }
        }

        revalidatePath("/dashboard/business");
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error creating subscription:", error);
        return NextResponse.json({ success: false, error: "Failed to create subscription" }, { status: 500 });
    }
}

async function cancelSubscription(businessId: string) {
    try {
        const { business, userId } = await withBusinessServer();

        const supabase = createServerClient();
        if (!supabase) {
            return NextResponse.json({ success: false, error: "Supabase client not initialized" }, { status: 500 });
        }

        // Get current subscription
        const { data: currentSubscription, error: fetchError } = await supabase
            .from("business_subscriptions")
            .select("*")
            .eq("business_id", businessId)
            .in("status", ["active", "trialing"])
            .single();

        if (fetchError || !currentSubscription) {
            return NextResponse.json({ success: false, error: "No active subscription found" }, { status: 404 });
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
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        revalidatePath("/dashboard/business");
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error canceling subscription:", error);
        return NextResponse.json({ success: false, error: "Failed to cancel subscription" }, { status: 500 });
    }
}
