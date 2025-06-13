
"use server";

import { withBusinessServer } from "@/lib/auth/with-business-server";
import { stripe } from "@/lib/stripe";
import { createServerClient } from "@/lib/supabase";
import { getSubscriptionPlans } from "./subscriptions";
import type { StripeCustomerInsert, StripeSubscriptionInsert } from "@/types";
import { revalidatePath } from "next/cache";

export async function createStripeCustomer(): Promise<{
  success: boolean;
  customerId?: string;
  error?: string;
}> {
  try {
    const { business, userId } = await withBusinessServer();
    const supabase = createServerClient();

    // Check if customer already exists
    const { data: existingCustomer } = await supabase
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("business_id", business.id)
      .single();

    if (existingCustomer) {
      return { success: true, customerId: existingCustomer.stripe_customer_id };
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      name: business.name,
      email: business.email || undefined,
      metadata: {
        business_id: business.id,
      },
    });

    // Save to database
    const { error } = await supabase
      .from("stripe_customers")
      .insert({
        id: crypto.randomUUID(),
        business_id: business.id,
        stripe_customer_id: customer.id,
        created_at: new Date().toISOString(),
      } as StripeCustomerInsert);

    if (error) {
      console.error("Error saving customer to database:", error);
      return { success: false, error: error.message };
    }

    return { success: true, customerId: customer.id };
  } catch (error) {
    console.error("Error creating Stripe customer:", error);
    return { success: false, error: "Failed to create customer" };
  }
}

export async function createCheckoutSession(
  planId: string,
  billingInterval: "monthly" | "annual"
): Promise<{
  success: boolean;
  sessionUrl?: string;
  error?: string;
}> {
  try {
    const { business } = await withBusinessServer();
    
    // Get subscription plans
    const plans = await getSubscriptionPlans();
    const plan = plans.find(p => p.id === planId);
    
    if (!plan) {
      return { success: false, error: "Plan not found" };
    }

    // Skip Stripe for personal plan
    if (planId === "personal") {
      return { success: false, error: "Personal plan doesn't require payment" };
    }

    // Get or create Stripe customer
    const customerResult = await createStripeCustomer();
    if (!customerResult.success || !customerResult.customerId) {
      return { success: false, error: customerResult.error };
    }

    const priceId = billingInterval === "monthly" 
      ? plan.stripe_monthly_price_id 
      : plan.stripe_annual_price_id;

    if (!priceId) {
      return { success: false, error: "Price ID not found for plan" };
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerResult.customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/business?subscription=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/business?subscription=cancelled`,
      metadata: {
        business_id: business.id,
        plan_id: planId,
        billing_interval: billingInterval,
      },
    });

    return { success: true, sessionUrl: session.url || undefined };
  } catch (error) {
    console.error("Error creating checkout session:", error);
    return { success: false, error: "Failed to create checkout session" };
  }
}

export async function createBillingPortalSession(): Promise<{
  success: boolean;
  sessionUrl?: string;
  error?: string;
}> {
  try {
    const { business } = await withBusinessServer();
    const supabase = createServerClient();

    // Get Stripe customer
    const { data: customer, error } = await supabase
      .from("stripe_customers")
      .select("stripe_customer_id")
      .eq("business_id", business.id)
      .single();

    if (error || !customer) {
      return { success: false, error: "Customer not found" };
    }

    // Create billing portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customer.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/business`,
    });

    return { success: true, sessionUrl: session.url };
  } catch (error) {
    console.error("Error creating billing portal session:", error);
    return { success: false, error: "Failed to create billing portal session" };
  }
}

export async function getStripeSubscription(): Promise<{
  success: boolean;
  subscription?: any;
  error?: string;
}> {
  try {
    const { business } = await withBusinessServer();
    const supabase = createServerClient();

    // Get Stripe subscription from database
    const { data: stripeSubscription, error } = await supabase
      .from("stripe_subscriptions")
      .select("*")
      .eq("business_id", business.id)
      .eq("status", "active")
      .single();

    if (error || !stripeSubscription) {
      return { success: false, error: "No active subscription found" };
    }

    // Get full subscription from Stripe
    const subscription = await stripe.subscriptions.retrieve(
      stripeSubscription.stripe_subscription_id
    );

    return { success: true, subscription };
  } catch (error) {
    console.error("Error getting Stripe subscription:", error);
    return { success: false, error: "Failed to get subscription" };
  }
}
