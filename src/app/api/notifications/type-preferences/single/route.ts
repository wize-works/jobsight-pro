import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import {
    getNotificationTypePreferenceServer
} from "@/lib/notifications/server";
import { NotificationTypeOptions } from "@/types/notifications";

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

        const { userId, notificationType }: {
            userId: string;
            notificationType: NotificationTypeOptions;
        } = await request.json();

        if (!userId || !notificationType) {
            return NextResponse.json({ error: "User ID and notification type are required" }, { status: 400 });
        }

        const preference = await getNotificationTypePreferenceServer(businessId, userId, notificationType);

        return NextResponse.json({ preference });
    } catch (error) {
        console.error("Error fetching notification type preference:", error);
        return NextResponse.json(
            { error: "Failed to fetch notification type preference" },
            { status: 500 }
        );
    }
}
