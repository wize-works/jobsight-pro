"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A custom hook that provides safe state updates to prevent memory leaks
 * and state updates on unmounted components.
 */
export function useSafeState<T>(initialState: T): [T, (value: T | ((prev: T) => T)) => void] {
    const [state, setState] = useState<T>(initialState);
    const isMountedRef = useRef(true);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    const safeSetState = useCallback((value: T | ((prev: T) => T)) => {
        if (isMountedRef.current) {
            setState(value);
        }
    }, []);

    return [state, safeSetState];
}

/**
 * A hook to check if the component is still mounted
 */
export function useIsMounted() {
    const isMountedRef = useRef(false);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    return useCallback(() => isMountedRef.current, []);
}

/**
 * A hook to safely run async operations with cleanup
 */
export function useSafeAsync<T>(
    asyncFunction: () => Promise<T>,
    dependencies: React.DependencyList,
    onSuccess?: (result: T) => void,
    onError?: (error: Error) => void
) {
    const isMountedRef = useRef(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    useEffect(() => {
        let cancelled = false;

        const runAsync = async () => {
            if (!isMountedRef.current) return;

            setLoading(true);
            setError(null);

            try {
                const result = await asyncFunction();

                if (!cancelled && isMountedRef.current) {
                    setLoading(false);
                    onSuccess?.(result);
                }
            } catch (err) {
                if (!cancelled && isMountedRef.current) {
                    const error = err instanceof Error ? err : new Error(String(err));
                    setError(error);
                    setLoading(false);
                    onError?.(error);
                }
            }
        };

        runAsync();

        return () => {
            cancelled = true;
        };
    }, dependencies);

    return { loading, error };
}
