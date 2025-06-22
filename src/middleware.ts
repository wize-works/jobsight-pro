import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import { NextRequest, NextResponse } from "next/server";

export default withAuth(
    async function middleware(req: any) {
        const auth = req.kindeAuth as any;
        const url = req.nextUrl.clone();

        // Step 1: Ensure authenticated
        if (auth.user === null || !auth.user.id) {
            console.warn("Unauthenticated, redirecting to /");
            url.pathname = "/";
            return NextResponse.redirect(url);
        }

        // Step 2: Check for bizstate cookie
        const bizCookie = req.cookies.get('bizstate')?.value;
        if (bizCookie) {
            try {
                const { hasBusiness, hasSubscription } = JSON.parse(bizCookie);

                if (!hasBusiness) {
                    console.warn("No business, redirecting to /landing");
                    url.pathname = "/landing";
                    return NextResponse.redirect(url);
                }

                if (!hasSubscription) {
                    console.warn("No subscription, redirecting to landing");
                    url.pathname = "/landing";
                    return NextResponse.redirect(url);
                }
            } catch {
                console.error("Invalid bizstate cookie, redirecting to landing");
                url.pathname = "/landing";
                return NextResponse.redirect(url);
            }
        } else {
            // No cookie — treat as incomplete onboarding
            console.warn("Missing bizstate cookie, redirecting to landing");
            url.pathname = "/landing";
            return NextResponse.redirect(url);
        }

        return NextResponse.next();
    },
    {
        publicPaths: [
            "/",
            "/landing",
            "/pricing",
            "/register",
            "/onboarding",
            "/api",
        ],
        loginPath: "/",
    }
);

export const config = {
    matcher: ["/dashboard/:path*", "/projects/:path*", "/app/:path*", "/printables/:path*"],
};
