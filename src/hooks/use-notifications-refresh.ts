
"use client";

import { useEffect, useRef } from "react";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { useBusiness } from "@/lib/business-context";

interface UseNotificationRefreshProps {
    onRefresh: () => void;
    interval?: number; // in milliseconds
    enabled?: boolean;
}

export function useNotificationRefresh({
    onRefresh,
    interval = 30000, // 30 seconds default
    enabled = true
}: UseNotificationRefreshProps) {
    const { user } = useKindeAuth();
    const { businessId } = useBusiness();
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (!enabled || !user?.id || !businessId) {
            return;
        }

        // Set up interval for refreshing notifications
        intervalRef.current = setInterval(() => {
            onRefresh();
        }, interval);

        // Also refresh when the page becomes visible
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                onRefresh();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [onRefresh, interval, enabled, user?.id, businessId]);

    return {
        refresh: onRefresh
    };
}
