import { NextRequest, NextResponse } from "next/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { fetchByBusiness, updateWithBusinessCheck, deleteWithBusinessCheck } from "@/lib/db";
import { PushSubscription, PushSubscriptionUpdate } from "@/types/notifications";
import { applyUpdated } from "@/utils/apply-updated";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { business } = await withBusinessServer();
        const { id } = await params;

        const { data, error } = await fetchByBusiness("push_subscriptions", business.id, "*", {
            filter: { id },
        });

        if (error) {
            console.error("Error fetching push subscription:", error);
            return NextResponse.json({ error: "Failed to fetch push subscription" }, { status: 500 });
        }

        if (!data || data.length === 0) {
            return NextResponse.json({ error: "Push subscription not found" }, { status: 404 });
        }

        return NextResponse.json(data[0]);
    } catch (error) {
        console.error("Error in GET /api/push-subscriptions/[id]:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { business } = await withBusinessServer();
        const { id } = await params;
        const updateData: PushSubscriptionUpdate = await request.json();

        const { data, error } = await updateWithBusinessCheck(
            "push_subscriptions",
            id,
            await applyUpdated<PushSubscriptionUpdate>(updateData),
            business.id
        );

        if (error) {
            console.error("Error updating push subscription:", error);
            return NextResponse.json({ error: "Failed to update push subscription" }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in PUT /api/push-subscriptions/[id]:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { business } = await withBusinessServer();
        const { id } = await params;

        const { error } = await deleteWithBusinessCheck("push_subscriptions", id, business.id);

        if (error) {
            console.error("Error deleting push subscription:", error);
            return NextResponse.json({ error: "Failed to delete push subscription" }, { status: 500 });
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error in DELETE /api/push-subscriptions/[id]:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
