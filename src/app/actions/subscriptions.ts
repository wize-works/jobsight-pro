"use server";

import { withBusinessServer } from "@/lib/auth/with-business-server";
import { createServerClient } from "@/lib/supabase";
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
import { revalidatePath } from "next/cache";

export async function getCurrentSubscription(): Promise<BusinessSubscription | null> {
  try {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness(
      "business_subscriptions",
      business.id,
      "*",
      {
        filter: { status: "active" },
      },
    );

    if (!data || data.length === 0) {
      return null; // No active subscription found
    }
    if (error) {
      console.error("Error fetching current subscription:", error);
      return null;
    }
    return data[0];
  } catch (error) {
    console.error("Error fetching current subscription:", error);
    return null;
  }
}

export async function getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  // For now, we'll load from the static file. Later this could be from database or API
  const fs = require("fs");
  const path = require("path");

  try {
    const filePath = path.join(
      process.cwd(),
      "docs",
      "jobsight_pricing_with_ai_addon.json",
    );
    const fileContent = fs.readFileSync(filePath, "utf8");
    return JSON.parse(fileContent);
  } catch (error) {
    console.error("Error loading subscription plans:", error);
    return [];
  }
}

export async function createSubscription(
  planId: string,
  billingInterval: BillingInterval,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { business, userId } = await withBusinessServer();

    // Check if there's already an active subscription
    const existingSubscription = await getCurrentSubscription();

    if (existingSubscription) {
      // For now, we'll just update the existing subscription
      // In a real implementation, this would involve Stripe to change the subscription
      const { data, error } = await updateWithBusinessCheck(
        "business_subscriptions",
        existingSubscription.id,
        {
          plan_id: planId,
          updated_at: new Date().toISOString(),
          updated_by: userId,
        } as BusinessSubscription,
        business.id,
      );

      if (error) {
        return { success: false, error: error.message };
      }
    } else {
      // Create new subscription
      const newSubscription = {
        business_id: business.id,
        plan_id: planId,
        start_date: new Date().toISOString(),
        status: "active",
        created_by: userId,
        created_at: new Date().toISOString(),
      } as BusinessSubscription;

      const { data, error } = await insertWithBusiness(
        "business_subscriptions",
        newSubscription,
        business.id,
      );

      if (error) {
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

export async function cancelSubscription(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { business, userId } = await withBusinessServer();

    const currentSubscription = await getCurrentSubscription();
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
      business.id,
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
