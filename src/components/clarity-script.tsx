"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function ClarityScript() {
    const pathname = usePathname();

    useEffect(() => {
        if (typeof window === "undefined") return;

        const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID;

        if (!clarityId) {
            console.warn("Microsoft Clarity not initialized: Missing NEXT_PUBLIC_CLARITY_ID");
            return;
        }

        // Check if script is already loaded
        if (document.querySelector('script[src*="clarity.ms"]')) {
            console.log("Microsoft Clarity script already loaded");
            return;
        }

        try {
            // Load Microsoft Clarity via script injection
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.async = true;
            script.src = `https://www.clarity.ms/tag/${clarityId}`;
            script.onload = () => {
                console.log("Microsoft Clarity script loaded successfully");

                // Optional: Track page views manually if needed
                if (window.clarity && typeof window.clarity === 'function') {
                    window.clarity('set', 'page', pathname);
                }
            };

            script.onerror = (error) => {
                console.error("Failed to load Microsoft Clarity script:", error);
            };

            document.head.appendChild(script);

        } catch (error) {
            console.error("Failed to initialize Microsoft Clarity:", error);
        }
    }, [pathname]); return null;
}
