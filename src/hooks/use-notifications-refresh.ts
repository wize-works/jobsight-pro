
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
    const callbackRef = useRef(onRefresh);

    // Update callback ref when onRefresh changes to prevent stale closures
    useEffect(() => {
        callbackRef.current = onRefresh;
    }, [onRefresh]);

    useEffect(() => {
        if (!enabled || !user?.id || !businessId) {
            // Clear existing interval if conditions are not met
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            return;
        }

        // Set up interval for refreshing notifications
        intervalRef.current = setInterval(() => {
            try {
                callbackRef.current();
            } catch (error) {
                console.error('Error in notification refresh callback:', error);
            }
        }, interval);

        // Also refresh when the page becomes visible
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && enabled && user?.id && businessId) {
                try {
                    callbackRef.current();
                } catch (error) {
                    console.error('Error in visibility change notification refresh:', error);
                }
            }
        };

        // Add passive option for better performance
        document.addEventListener('visibilitychange', handleVisibilityChange, { passive: true });

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        };
    }, [interval, enabled, user?.id, businessId]);

    return {
        refresh: onRefresh
    };
}
