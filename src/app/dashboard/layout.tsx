import type React from "react";
import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { DashboardClient } from "./dashboard-client";

// Server component - can be statically generated
export default async function DashboardLayout({
    children
}: {
    children: React.ReactNode
}) {
    // Server-side authentication check
    const { userId } = await auth();

    // Redirect to sign-in if not authenticated
    if (!userId) {
        redirect('/sign-in');
    }

    // Pass the authenticated state to the client component
    return <DashboardClient>{children}</DashboardClient>;
}