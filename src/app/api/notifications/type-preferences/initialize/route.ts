import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import {
    initializeDefaultNotificationTypePreferencesServer
} from "@/lib/notifications/server";

export async function POST(request: NextRequest) {
    try {
        const { userId: clerkUserId } = await auth();
        if (!clerkUserId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await (await clerkClient()).users.getUser(clerkUserId);
        const businessId = user.publicMetadata?.businessId as string;

        if (!businessId) {
            return NextResponse.json({ error: "Business ID not found" }, { status: 400 });
        }

        const { userId } = await request.json();

        if (!userId) {
            return NextResponse.json({ error: "User ID is required" }, { status: 400 });
        }

        const success = await initializeDefaultNotificationTypePreferencesServer(businessId, userId);

        return NextResponse.json({ success });
    } catch (error) {
        console.error("Error initializing notification type preferences:", error);
        return NextResponse.json(
            { error: "Failed to initialize notification type preferences" },
            { status: 500 }
        );
    }
}
