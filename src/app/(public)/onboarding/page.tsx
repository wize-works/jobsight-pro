"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function OnboardingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const token = searchParams.get("token");

        if (token) {
            // Redirect to the unified registration page with the token
            router.replace(`/register?token=${token}`);
        } else {
            // No token, redirect to landing
            router.replace("/");
        }
    }, [searchParams, router]);

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="loading loading-spinner loading-lg"></div>
                <p className="mt-4">Redirecting...</p>
            </div>
        </div>
    );
}