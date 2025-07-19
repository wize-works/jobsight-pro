import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import {
    getAllNotificationTypePreferencesServer,
    updateNotificationTypePreferenceServer,
    deleteNotificationTypePreferenceServer,
    initializeDefaultNotificationTypePreferencesServer,
    getEnabledNotificationTypesServer
} from "@/lib/notifications/server";
import { UserNotificationTypePreferenceUpdate, NotificationTypeOptions } from "@/types/notifications";

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

        const preferences = await getAllNotificationTypePreferencesServer(businessId, userId);

        return NextResponse.json({ preferences });
    } catch (error) {
        console.error("Error fetching notification type preferences:", error);
        return NextResponse.json(
            { error: "Failed to fetch notification type preferences" },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
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

        const { userId, notificationType, preferences }: {
            userId: string;
            notificationType: NotificationTypeOptions;
            preferences: UserNotificationTypePreferenceUpdate;
        } = await request.json();

        if (!userId || !notificationType || !preferences) {
            return NextResponse.json({ error: "User ID, notification type, and preferences are required" }, { status: 400 });
        }

        const updatedPreference = await updateNotificationTypePreferenceServer(
            businessId,
            userId,
            notificationType,
            preferences
        );

        if (!updatedPreference) {
            return NextResponse.json({ error: "Failed to update notification type preference" }, { status: 500 });
        }

        return NextResponse.json({ preference: updatedPreference });
    } catch (error) {
        console.error("Error updating notification type preference:", error);
        return NextResponse.json(
            { error: "Failed to update notification type preference" },
            { status: 500 }
        );
    }
}

export async function DELETE(request: NextRequest) {
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

        const success = await deleteNotificationTypePreferenceServer(
            businessId,
            userId,
            notificationType
        );

        return NextResponse.json({ success });
    } catch (error) {
        console.error("Error deleting notification type preference:", error);
        return NextResponse.json(
            { error: "Failed to delete notification type preference" },
            { status: 500 }
        );
    }
}
