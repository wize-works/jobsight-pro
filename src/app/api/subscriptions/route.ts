import { NextRequest, NextResponse } from "next/server";
import {
    getCurrentSubscriptionServer,
    getSubscriptionPlansServer,
    createSubscriptionServer,
    cancelSubscriptionServer,
} from "@/lib/subscriptions/server";
import type { BillingInterval } from "@/types/subscription";

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
        const subscription = await getCurrentSubscriptionServer(businessId);

        if (!subscription) {
            return NextResponse.json({ success: false, error: "No active subscription found" }, { status: 404 });
        }

        return NextResponse.json({ success: true, subscription }, { status: 200 });
    } catch (error) {
        console.error("Error fetching current subscription:", error);
        return NextResponse.json({ success: false, error: "Failed to fetch subscription" }, { status: 500 });
    }
}

async function getSubscriptionPlans() {
    try {
        const plans = await getSubscriptionPlansServer();
        return NextResponse.json({ success: true, plans }, { status: 200 });
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
        const result = await createSubscriptionServer(businessId, planId, billingInterval);

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error creating subscription:", error);
        return NextResponse.json({ success: false, error: "Failed to create subscription" }, { status: 500 });
    }
}

async function cancelSubscription(businessId: string) {
    try {
        const result = await cancelSubscriptionServer(businessId);

        if (!result.success) {
            return NextResponse.json({ success: false, error: result.error }, { status: 400 });
        }

        return NextResponse.json({ success: true }, { status: 200 });
    } catch (error) {
        console.error("Error canceling subscription:", error);
        return NextResponse.json({ success: false, error: "Failed to cancel subscription" }, { status: 500 });
    }
}
