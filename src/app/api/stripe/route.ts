import { NextRequest, NextResponse } from "next/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { stripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase";
import { loadSubscriptionPlans } from "@/lib/subscriptions/plans";
import type { StripeCustomerInsert } from "@/types/stripe-customers";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
    try {
        const { business } = await withBusinessServer();
        const { action, ...data } = await req.json();

        switch (action) {
            case 'create-customer':
                return await createStripeCustomer(business.id);
            case 'create-checkout-session':
                return await createCheckoutSession(business.id, data.planId, data.billingInterval);
            case 'create-billing-portal-session':
                return await createBillingPortalSession(business.id);
            case 'update-subscription':
                return await updateStripeSubscription(business.id, data.planId, data.billingInterval);
            case 'cancel-subscription':
                return await cancelStripeSubscription(business.id);
            default:
                return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Stripe API error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function GET(req: NextRequest) {
    try {
        const { business } = await withBusinessServer();
        const { searchParams } = new URL(req.url);
        const action = searchParams.get('action');

        switch (action) {
            case 'get-subscription':
                return await getStripeSubscription(business.id);
            default:
                return NextResponse.json({ success: false, error: "Invalid action" }, { status: 400 });
        }
    } catch (error) {
        console.error("Stripe API error:", error);
        return NextResponse.json(
            { success: false, error: "Internal server error" },
            { status: 500 }
        );
    }
}

async function createStripeCustomer(businessId: string) {
    try {
        const supabase = createServerClient();

        if (!supabase) {
            return NextResponse.json({ success: false, error: "Supabase client not initialized" }, { status: 500 });
        }

        // Check if customer already exists
        const { data: existingCustomer } = await supabase
            .from("stripe_customers")
            .select("stripe_customer_id")
            .eq("business_id", businessId)
            .single();

        if (existingCustomer) {
            return NextResponse.json({ success: true, customerId: existingCustomer.stripe_customer_id });
        }

        // Get business details
        const { data: business } = await supabase
            .from("businesses")
            .select("name, email")
            .eq("id", businessId)
            .single();

        // Create Stripe customer
        const customer = await stripe.customers.create({
            name: business?.name || businessId,
            email: business?.email || undefined,
            metadata: {
                business_id: businessId,
            },
        });

        // Save to database
        const { error } = await supabase
            .from("stripe_customers")
            .insert({
                id: crypto.randomUUID(),
                business_id: businessId,
                stripe_customer_id: customer.id,
                created_at: new Date().toISOString(),
            } as StripeCustomerInsert);

        if (error) {
            console.error("Error saving customer to database:", error);
            return NextResponse.json({ success: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json({ success: true, customerId: customer.id });
    } catch (error) {
        console.error("Error creating Stripe customer:", error);
        return NextResponse.json({ success: false, error: "Failed to create customer" }, { status: 500 });
    }
}

async function createCheckoutSession(businessId: string, planId: string, billingInterval: "monthly" | "annual") {
    try {
        // Get subscription plans
        const plans = await loadSubscriptionPlans();
        const plan = plans.find((p: any) => p.id === planId);

        if (!plan) {
            return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });
        }

        // Skip Stripe for personal plan
        if (planId === "personal") {
            return NextResponse.json({ success: false, error: "Personal plan doesn't require payment" }, { status: 400 });
        }

        // Get or create Stripe customer
        const customerResult = await createStripeCustomer(businessId);
        const customerData = await customerResult.json();

        if (!customerData.success || !customerData.customerId) {
            return NextResponse.json({ success: false, error: customerData.error }, { status: 500 });
        }

        const priceId = billingInterval === "monthly"
            ? plan.stripe_monthly_price_id
            : plan.stripe_annual_price_id;

        if (!priceId) {
            return NextResponse.json({ success: false, error: "Price ID not found for plan" }, { status: 400 });
        }

        // Create checkout session
        const session = await stripe.checkout.sessions.create({
            customer: customerData.customerId,
            payment_method_types: ['card'],
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            mode: 'subscription',
            subscription_data: {
                trial_period_days: 30, // 30-day free trial
            },
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/business?subscription=success`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/business?subscription=cancelled`,
            metadata: {
                business_id: businessId,
                plan_id: planId,
                billing_interval: billingInterval,
            },
        });

        return NextResponse.json({ success: true, sessionUrl: session.url || undefined });
    } catch (error) {
        console.error("Error creating checkout session:", error);
        return NextResponse.json({ success: false, error: "Failed to create checkout session" }, { status: 500 });
    }
}

async function createBillingPortalSession(businessId: string) {
    try {
        const supabase = createServerClient();

        if (!supabase) {
            return NextResponse.json({ success: false, error: "Supabase client not initialized" }, { status: 500 });
        }

        // Get Stripe customer
        const { data: customer, error } = await supabase
            .from("stripe_customers")
            .select("stripe_customer_id")
            .eq("business_id", businessId)
            .single();

        if (error || !customer) {
            return NextResponse.json({ success: false, error: "Customer not found" }, { status: 404 });
        }

        // Create billing portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: customer.stripe_customer_id,
            return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/business`,
        });

        return NextResponse.json({ success: true, sessionUrl: session.url });
    } catch (error) {
        console.error("Error creating billing portal session:", error);
        return NextResponse.json({ success: false, error: "Failed to create billing portal session" }, { status: 500 });
    }
}

async function updateStripeSubscription(businessId: string, planId: string, billingInterval: "monthly" | "annual") {
    try {
        const supabase = createServerClient();

        if (!supabase) {
            console.error("Supabase client not initialized");
            return NextResponse.json({ success: false, error: "Supabase client not initialized" }, { status: 500 });
        }

        // Get subscription plans
        const plans = await loadSubscriptionPlans();
        const plan = plans.find((p: any) => p.id === planId);

        if (!plan) {
            return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });
        }

        const priceId = billingInterval === "monthly"
            ? plan.stripe_monthly_price_id
            : plan.stripe_annual_price_id;

        if (!priceId) {
            return NextResponse.json({ success: false, error: "Price ID not found for plan" }, { status: 400 });
        }

        // Get current Stripe subscription (active or trialing)
        const { data: stripeSubscription, error } = await supabase
            .from("stripe_subscriptions")
            .select("*")
            .eq("business_id", businessId)
            .in("status", ["active", "trialing"])
            .single();

        if (error || !stripeSubscription) {
            return NextResponse.json({ success: false, error: "No active or trialing subscription found" }, { status: 404 });
        }

        // Update subscription in Stripe
        const subscription = await stripe.subscriptions.retrieve(
            stripeSubscription.stripe_subscription_id
        );

        const updatedSubscription = await stripe.subscriptions.update(stripeSubscription.stripe_subscription_id, {
            items: [{
                id: subscription.items.data[0].id,
                price: priceId,
            }],
            proration_behavior: 'create_prorations',
            // Don't add trial_end or trial_period_days to avoid re-enabling trial
        });

        // Update database
        await supabase
            .from("stripe_subscriptions")
            .update({
                plan_id: planId,
                updated_at: new Date().toISOString(),
            })
            .eq("id", stripeSubscription.id);

        await supabase
            .from("business_subscriptions")
            .update({
                plan_id: planId,
                stripe_subscription_id: stripeSubscription.stripe_subscription_id,
                updated_at: new Date().toISOString(),
            })
            .eq("business_id", businessId)
            .in("status", ["active", "trialing"]);

        revalidatePath("/dashboard/business");
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error updating Stripe subscription:", error);
        return NextResponse.json({ success: false, error: "Failed to update subscription" }, { status: 500 });
    }
}

async function getStripeSubscription(businessId: string) {
    try {
        const supabase = createServerClient();

        if (!supabase) {
            return NextResponse.json({ success: false, error: "Supabase client not initialized" }, { status: 500 });
        }

        // Get Stripe subscription from database (active or trialing)
        const { data: stripeSubscription, error } = await supabase
            .from("stripe_subscriptions")
            .select("*")
            .eq("business_id", businessId)
            .in("status", ["active", "trialing"])
            .single();

        if (error || !stripeSubscription) {
            return NextResponse.json({ success: false, error: "No active or trialing subscription found" }, { status: 404 });
        }

        // Get full subscription from Stripe
        const subscription = await stripe.subscriptions.retrieve(
            stripeSubscription.stripe_subscription_id
        );

        return NextResponse.json({ success: true, subscription }, { status: 200 });
    } catch (error) {
        console.error("Error getting Stripe subscription:", error);
        return NextResponse.json({ success: false, error: "Failed to get subscription" }, { status: 500 });
    }
}

async function cancelStripeSubscription(businessId: string) {
    try {
        const supabase = createServerClient();

        if (!supabase) {
            return NextResponse.json({ success: false, error: "Supabase client not initialized" }, { status: 500 });
        }

        // Get current Stripe subscription (active or trialing)
        const { data: stripeSubscription, error } = await supabase
            .from("stripe_subscriptions")
            .select("*")
            .eq("business_id", businessId)
            .in("status", ["active", "trialing"])
            .single();

        if (error || !stripeSubscription) {
            return NextResponse.json({ success: false, error: "No active or trialing subscription found" }, { status: 404 });
        }

        // Cancel subscription in Stripe (at period end)
        await stripe.subscriptions.update(stripeSubscription.stripe_subscription_id, {
            cancel_at_period_end: true,
        });

        // Update database
        await supabase
            .from("stripe_subscriptions")
            .update({
                cancel_at_period_end: true,
                updated_at: new Date().toISOString(),
            })
            .eq("id", stripeSubscription.id);

        await supabase
            .from("business_subscriptions")
            .update({
                status: "canceled",
                end_date: new Date().toISOString(),
                updated_at: new Date().toISOString(),
            })
            .eq("business_id", businessId)
            .in("status", ["active", "trialing"]);

        revalidatePath("/dashboard/business");
        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error canceling Stripe subscription:", error);
        return NextResponse.json({ success: false, error: "Failed to cancel subscription" }, { status: 500 });
    }
}
