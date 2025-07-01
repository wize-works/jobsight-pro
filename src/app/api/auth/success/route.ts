// src/app/api/auth/success/route.ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from '@clerk/nextjs/server';
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { setBizStateCookie } from "@/lib/cookies/set-bizstate";

export async function GET(req: NextRequest) {
    const { business, subscription } = await withBusinessServer();
    console.log("req.url: ", req.url);
    const res = NextResponse.redirect(new URL("/dashboard", process.env.NEXT_PUBLIC_APP_URL || "https://pro.jobsight.co"));
    try {
        const { userId } = await auth();
        if (userId) {
            setBizStateCookie({ hasBusiness: !!business, hasSubscription: !!subscription });
        }
    } catch (err) {
        console.error("Failed to set bizstate cookie after login:", err);
    }

    return res;
}