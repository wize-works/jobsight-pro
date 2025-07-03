import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from "next/server";

const isProtectedRoute = createRouteMatcher([
    '/dashboard(.*)',
    '/projects(.*)',
    '/app(.*)',
    '/printables(.*)',
]);

export default clerkMiddleware(async (auth, req: NextRequest) => {
    try {
        const { userId } = await auth();

        // If accessing a protected route without authentication, redirect to sign-in
        if (isProtectedRoute(req) && !userId) {
            return NextResponse.redirect(new URL('/sign-in', req.url));
        }

        // Let the application handle business/subscription logic via context providers
        return NextResponse.next();
    } catch (error) {
        console.error("Clerk middleware error:", error);
        // If Clerk fails, allow access but log the error
        return NextResponse.next();
    }
});

export const config = {
    matcher: [
        '/((?!api/clerk|__clerk|_next/static|_next/image|favicon.ico).*)',
    ],
};
