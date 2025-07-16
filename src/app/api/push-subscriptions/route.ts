import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { fetchByBusiness, insertWithBusiness, updateWithBusinessCheck } from "@/lib/db";
import { PushSubscription, PushSubscriptionInsert, PushSubscriptionUpdate } from "@/types/notifications";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export async function GET(request: NextRequest) {
    try {
        const { business } = await withBusinessServer();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const { data, error } = await fetchByBusiness("push_subscriptions", business.id, "*", {
            filter: { user_id: userId },
        });

        if (error) {
            console.error("Error fetching push subscriptions:", error);
            return NextResponse.json({ error: "Failed to fetch push subscriptions" }, { status: 500 });
        }

        return NextResponse.json(data || []);
    } catch (error) {
        console.error("Error in GET /api/push-subscriptions:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const { business } = await withBusinessServer();
        const subscription: PushSubscriptionInsert = await request.json();

        // Validate required fields
        if (!subscription.user_id || !subscription.endpoint || !subscription.p256dh || !subscription.auth) {
            return NextResponse.json({
                error: "Missing required fields: user_id, endpoint, p256dh, auth"
            }, { status: 400 });
        }

        // Check if the subscription already exists
        const { data: existingSub } = await fetchByBusiness("push_subscriptions", business.id, "*", {
            filter: {
                user_id: subscription.user_id,
                endpoint: subscription.endpoint
            },
        });

        if (existingSub && existingSub.length > 0) {
            // Subscription already exists, update it
            const { data, error } = await updateWithBusinessCheck(
                "push_subscriptions",
                (existingSub[0] as unknown as PushSubscription).id,
                await applyUpdated<PushSubscriptionUpdate>(subscription),
                business.id
            );

            if (error) {
                console.error("Error updating existing push subscription:", error);
                return NextResponse.json({ error: "Failed to update push subscription" }, { status: 500 });
            }

            return NextResponse.json(data);
        }

        // Create new subscription
        const { data, error } = await insertWithBusiness(
            "push_subscriptions",
            await applyCreated<PushSubscriptionInsert>(subscription),
            business.id
        );

        if (error) {
            console.error("Error creating push subscription:", error);
            return NextResponse.json({ error: "Failed to create push subscription" }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in POST /api/push-subscriptions:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
