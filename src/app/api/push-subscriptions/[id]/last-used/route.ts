import { NextRequest, NextResponse } from "next/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { updateWithBusinessCheck } from "@/lib/db";
import { PushSubscriptionUpdate } from "@/types/notifications";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { business } = await withBusinessServer();
        const { id } = await params;

        const update = {
            last_used_at: new Date().toISOString(),
        } as PushSubscriptionUpdate;

        const { data, error } = await updateWithBusinessCheck(
            "push_subscriptions",
            id,
            update,
            business.id
        );

        if (error) {
            console.error("Error updating push subscription last used:", error);
            return NextResponse.json({ error: "Failed to update push subscription last used" }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error("Error in PUT /api/push-subscriptions/[id]/last-used:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
