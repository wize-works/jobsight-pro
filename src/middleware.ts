import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/projects(.*)',
    '/app(.*)',
    '/printables(.*)',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
    // Check if Clerk is properly configured
    const publishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
    if (!publishableKey || publishableKey === "placeholder" || publishableKey === "") {
        console.error("Invalid Clerk publishable key:", publishableKey);
        // For development, allow access to public routes
        if (process.env.NODE_ENV === "development") {
            return NextResponse.next();
        }
        // For production, redirect to error page or return 500
        return NextResponse.json(
            { error: "Authentication service not configured" },
            { status: 500 }
        );
    }

    try {
        const { userId } = await auth();
        const url = req.nextUrl.clone();

        // If accessing a protected route without authentication
        if (isProtectedRoute(req) && !userId) {
            return NextResponse.redirect(new URL('/sign-in', req.url));
        }

        // If authenticated and accessing a protected route
        if (isProtectedRoute(req) && userId) {
            // Check for bizstate cookie (business/subscription validation)
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
        }
    } catch (error) {
        console.error("Clerk middleware error:", error);
        // If Clerk fails, allow access but log the error
        return NextResponse.next();
    }

    return NextResponse.next();
});

export const config = {
    matcher: [
        '/((?!api/clerk|__clerk|_next/static|_next/image|favicon.ico).*)',
    ],
};
