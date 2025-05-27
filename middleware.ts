import { withAuth } from "@kinde-oss/kinde-auth-nextjs/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";


export default withAuth(
    async function middleware(req: NextRequest) {
        // Kinde Auth attaches the user to req.auth if authenticated
        const isLoggedIn = (req as any).auth?.userId;

        if (!isLoggedIn) {
            const url = req.nextUrl.clone();
            url.pathname = "/";
            return NextResponse.redirect(url);
        }

        // Proceed normally if authenticated
        return NextResponse.next();
    },
    {
        publicPaths: ["/public", "/landing", "/pricing", "/register", "/api"],
    }
);

export const config = {
    matcher: [
        // Run on everything but Next internals and static files
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    ]
};
