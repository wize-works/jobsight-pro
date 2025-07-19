import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import {
    createNotificationWithEmailServer
} from "@/lib/notifications/server";
import { NotificationInsert } from "@/types/notifications";

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

        const { notification, sendEmail = true, excludeUserId }: {
            notification: NotificationInsert;
            sendEmail?: boolean;
            excludeUserId?: string;
        } = await request.json();

        if (!notification) {
            return NextResponse.json({ error: "Notification is required" }, { status: 400 });
        }

        const createdNotification = await createNotificationWithEmailServer(
            businessId,
            notification,
            sendEmail,
            excludeUserId
        );

        if (!createdNotification) {
            return NextResponse.json({ error: "Failed to create notification" }, { status: 500 });
        }

        return NextResponse.json({ notification: createdNotification });
    } catch (error) {
        console.error("Error creating notification with email:", error);
        return NextResponse.json(
            { error: "Failed to create notification with email" },
            { status: 500 }
        );
    }
}
