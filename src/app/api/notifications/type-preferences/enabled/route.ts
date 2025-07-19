import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import {
    getEnabledNotificationTypesServer
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

        const { userId, channel }: {
            userId: string;
            channel: 'email' | 'push' | 'in_app';
        } = await request.json();

        if (!userId || !channel) {
            return NextResponse.json({ error: "User ID and channel are required" }, { status: 400 });
        }

        const types = await getEnabledNotificationTypesServer(businessId, userId, channel);

        return NextResponse.json({ types });
    } catch (error) {
        console.error("Error fetching enabled notification types:", error);
        return NextResponse.json(
            { error: "Failed to fetch enabled notification types" },
            { status: 500 }
        );
    }
}
