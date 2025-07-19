import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import {
    getUserNotificationPreferencesServer,
    updateUserNotificationPreferencesServer
} from "@/lib/notifications/server";
import { UserNotificationPreferenceUpdate } from "@/types/notifications";

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

        const preferences = await getUserNotificationPreferencesServer(businessId, userId);

        return NextResponse.json({ preferences });
    } catch (error) {
        console.error("Error fetching notification preferences:", error);
        return NextResponse.json(
            { error: "Failed to fetch notification preferences" },
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

        const { userId, preferences }: {
            userId: string;
            preferences: UserNotificationPreferenceUpdate;
        } = await request.json();

        if (!userId || !preferences) {
            return NextResponse.json({ error: "User ID and preferences are required" }, { status: 400 });
        }

        const updatedPreference = await updateUserNotificationPreferencesServer(
            businessId,
            userId,
            preferences
        );

        if (!updatedPreference) {
            return NextResponse.json({ error: "Failed to update notification preferences" }, { status: 500 });
        }

        return NextResponse.json({ preference: updatedPreference });
    } catch (error) {
        console.error("Error updating notification preferences:", error);
        return NextResponse.json(
            { error: "Failed to update notification preferences" },
            { status: 500 }
        );
    }
}
