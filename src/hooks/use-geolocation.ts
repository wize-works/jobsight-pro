"use client";

import { useState, useEffect, useRef, useCallback } from 'react';

interface GeolocationState {
    position: GeolocationPosition | null;
    error: GeolocationPositionError | null;
    loading: boolean;
}

interface UseGeolocationOptions {
    enableHighAccuracy?: boolean;
    timeout?: number;
    maximumAge?: number;
    watch?: boolean;
}

export function useGeolocation(options: UseGeolocationOptions = {}) {
    const [state, setState] = useState<GeolocationState>({
        position: null,
        error: null,
        loading: false,
    });

    const watchIdRef = useRef<number | null>(null);
    const isMountedRef = useRef(true);

    const {
        enableHighAccuracy = false,
        timeout = 10000,
        maximumAge = 0,
        watch = false,
    } = options;

    const clearWatch = useCallback(() => {
        if (watchIdRef.current !== null) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
    }, []);

    const getCurrentPosition = useCallback(() => {
        if (!navigator.geolocation) {
            const error = {
                code: 2, // POSITION_UNAVAILABLE
                message: 'Geolocation is not supported',
                PERMISSION_DENIED: 1,
                POSITION_UNAVAILABLE: 2,
                TIMEOUT: 3,
            } as GeolocationPositionError;
            if (isMountedRef.current) {
                setState(prev => ({ ...prev, error, loading: false }));
            }
            return;
        }

        if (isMountedRef.current) {
            setState(prev => ({ ...prev, loading: true, error: null }));
        }

        const successCallback = (position: GeolocationPosition) => {
            if (isMountedRef.current) {
                setState(prev => ({ ...prev, position, loading: false, error: null }));
            }
        };

        const errorCallback = (error: GeolocationPositionError) => {
            if (isMountedRef.current) {
                setState(prev => ({ ...prev, error, loading: false }));
            }
        };

        const positionOptions: PositionOptions = {
            enableHighAccuracy,
            timeout,
            maximumAge,
        };

        if (watch) {
            clearWatch(); // Clear any existing watch
            watchIdRef.current = navigator.geolocation.watchPosition(
                successCallback,
                errorCallback,
                positionOptions
            );
        } else {
            navigator.geolocation.getCurrentPosition(
                successCallback,
                errorCallback,
                positionOptions
            );
        }
    }, [enableHighAccuracy, timeout, maximumAge, watch, clearWatch]);

    useEffect(() => {
        isMountedRef.current = true;
        getCurrentPosition();

        return () => {
            isMountedRef.current = false;
            clearWatch();
        };
    }, [getCurrentPosition, clearWatch]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            clearWatch();
        };
    }, [clearWatch]);

    return {
        ...state,
        refetch: getCurrentPosition,
        clearWatch,
    };
}

// Simple hook for one-time position fetch
export function useCurrentPosition(options: Omit<UseGeolocationOptions, 'watch'> = {}) {
    return useGeolocation({ ...options, watch: false });
}

// Hook for watching position changes
export function useWatchPosition(options: Omit<UseGeolocationOptions, 'watch'> = {}) {
    return useGeolocation({ ...options, watch: true });
}
