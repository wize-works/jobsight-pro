import { NextRequest, NextResponse } from "next/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { fetchByBusiness, deleteWithBusinessCheck } from "@/lib/db";
import { PushSubscription } from "@/types/notifications";

export async function DELETE(request: NextRequest) {
    try {
        const { business } = await withBusinessServer();
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');
        const endpoint = searchParams.get('endpoint');

        if (!userId || !endpoint) {
            return NextResponse.json({
                error: "User ID and endpoint are required"
            }, { status: 400 });
        }

        // Find the subscription first
        const { data: subscriptions } = await fetchByBusiness("push_subscriptions", business.id, "*", {
            filter: {
                user_id: userId,
                endpoint: decodeURIComponent(endpoint)
            },
        });

        if (!subscriptions || subscriptions.length === 0) {
            return NextResponse.json({ success: true }); // Nothing to delete
        }

        // Delete all matching subscriptions (should typically be just one)
        const deletePromises = (subscriptions as unknown as PushSubscription[]).map((sub) =>
            deleteWithBusinessCheck("push_subscriptions", sub.id, business.id)
        );

        try {
            await Promise.all(deletePromises);
            return NextResponse.json({ success: true });
        } catch (error) {
            console.error("Error deleting push subscriptions:", error);
            return NextResponse.json({ error: "Failed to delete push subscriptions" }, { status: 500 });
        }
    } catch (error) {
        console.error("Error in DELETE /api/push-subscriptions/endpoint:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
