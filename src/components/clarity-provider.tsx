"use client";

import { useEffect } from "react";
import Clarity from "@microsoft/clarity";
import clarityUtils from "@/lib/clarity-utils";

export function ClarityProvider() {
    useEffect(() => {
        if (typeof window === "undefined") return;

        const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;

        if (!clarityId) {
            console.warn("Microsoft Clarity not initialized: Missing NEXT_PUBLIC_CLARITY_ID");
            return;
        }

        try {
            // Initialize Microsoft Clarity
            Clarity.init(clarityId);
            Clarity.consent();

            console.log("Microsoft Clarity initialized successfully with ID:", clarityId);

            // Test the connection after a short delay to ensure everything is loaded
            setTimeout(() => {
                const debugInfo = clarityUtils.getDebugInfo();
                if (debugInfo.isLoaded) {
                    clarityUtils.testConnection();
                } else {
                    console.warn("Microsoft Clarity failed to load properly");
                }
            }, 2000);

        } catch (error) {
            console.error("Failed to initialize Microsoft Clarity:", error);

            // Additional debugging in case of errors
            clarityUtils.getDebugInfo();
        }
    }, []);

    return null;
}
