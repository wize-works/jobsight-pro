"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

/**
 * A safe wrapper around useRouter that handles cases where the router context
 * might not be available immediately during hydration
 */
export function useSafeRouter() {
    const [isReady, setIsReady] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Set ready state after component has mounted and router is available
        if (router) {
            setIsReady(true);
        }
    }, [router]);

    const safeRouter = {
        ...router,
        refresh: () => {
            if (isReady && router) {
                router.refresh();
            }
        },
        push: (href: string, options?: any) => {
            if (isReady && router) {
                router.push(href, options);
            }
        },
        replace: (href: string, options?: any) => {
            if (isReady && router) {
                router.replace(href, options);
            }
        },
        back: () => {
            if (isReady && router) {
                router.back();
            }
        },
        forward: () => {
            if (isReady && router) {
                router.forward();
            }
        },
        prefetch: (href: string) => {
            if (isReady && router) {
                router.prefetch(href);
            }
        },
        isReady
    };

    return safeRouter;
}
