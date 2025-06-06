"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { toast } from "@/hooks/use-toast";
import { acceptInvitation } from "./actions";

export default function OnboardingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, isLoading: isAuthLoading } = useKindeBrowserClient();
    const [isProcessing, setIsProcessing] = useState(false);
    const [invitationData, setInvitationData] = useState<any>(null);

    useEffect(() => {
        const token = searchParams.get("token");

        if (!token) {
            toast({
                title: "Invalid Invitation",
                description: "No invitation token found",
                variant: "destructive"
            });
            router.push("/");
            return;
        }

        // Decode the invitation token
        try {
            const decoded = JSON.parse(Buffer.from(token, "base64").toString());

            // Check if token is expired
            if (new Date(decoded.expiresAt) < new Date()) {
                toast({
                    title: "Invitation Expired",
                    description: "This invitation link has expired. Please request a new one.",
                    variant: "destructive"
                });
                router.push("/");
                return;
            }

            setInvitationData(decoded);
        } catch (error) {
            toast({
                title: "Invalid Invitation",
                description: "Invalid invitation token",
                variant: "destructive"
            });
            router.push("/");
        }
    }, [searchParams, router]);

    useEffect(() => {
        const processInvitation = async () => {
            // Wait for auth to complete and user to be available
            if (isAuthLoading || !user?.id || !invitationData || isProcessing) {
                return;
            }

            setIsProcessing(true);

            try {
                const result = await acceptInvitation(
                    invitationData.userId,
                    user.id,
                    invitationData.email
                );

                if (result.success) {
                    toast({
                        title: "Welcome!",
                        description: "Your invitation has been accepted successfully",
                        variant: "default"
                    });
                    router.push("/dashboard");
                } else {
                    toast({
                        title: "Error",
                        description: result.error || "Failed to accept invitation",
                        variant: "destructive"
                    });
                    router.push("/");
                }
            } catch (error) {
                console.error("Error processing invitation:", error);
                toast({
                    title: "Error",
                    description: "Failed to process invitation",
                    variant: "destructive"
                });
                router.push("/");
            }
        };

        processInvitation();
    }, [user, invitationData, isAuthLoading, isProcessing, router]);

    if (isAuthLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="loading loading-spinner loading-lg"></div>
                    <p className="mt-4">Authenticating...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Complete Your Invitation</h1>
                    <p className="mb-6">Please sign in to accept your team invitation</p>
                    <a href="/api/auth/login" className="btn btn-primary">
                        Sign In
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <div className="loading loading-spinner loading-lg"></div>
                <p className="mt-4">Processing your invitation...</p>
            </div>
        </div>
    );
}