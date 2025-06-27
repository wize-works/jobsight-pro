/**
 * @fileoverview Business State Client Actions
 * Replaces src/lib/cookies/set-bizstate.ts with client-side implementation.
 * Handles business state management for client-side applications.
 */

interface ActionResult<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}

interface BusinessState {
    hasBusiness: boolean;
    hasSubscription: boolean;
}

/**
 * Set business state in local storage (client-side equivalent of cookie)
 */
export async function setBizState({
    hasBusiness,
    hasSubscription,
}: BusinessState): Promise<ActionResult<void>> {
    if (typeof window === 'undefined') {
        return { success: false, error: 'Client-side only function' };
    }

    try {
        const payload = JSON.stringify({ hasBusiness, hasSubscription });

        // Store in localStorage for client-side applications
        localStorage.setItem('bizstate', payload);

        // Also store with expiration
        const expirationTime = Date.now() + (7 * 24 * 60 * 60 * 1000); // 7 days
        localStorage.setItem('bizstate_expires', expirationTime.toString());

        return {
            success: true,
            data: undefined,
            message: 'Business state updated successfully'
        };
    } catch (error) {
        console.error('Error setting business state:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to set business state'
        };
    }
}

/**
 * Get business state from local storage
 */
export async function getBizState(): Promise<BusinessState | null> {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const expiration = localStorage.getItem('bizstate_expires');
        if (expiration && Date.now() > parseInt(expiration)) {
            // State has expired, remove it
            localStorage.removeItem('bizstate');
            localStorage.removeItem('bizstate_expires');
            return null;
        }

        const payload = localStorage.getItem('bizstate');
        if (!payload) {
            return null;
        }

        const state = JSON.parse(payload) as BusinessState;
        return state;
    } catch (error) {
        console.error('Error getting business state:', error);
        return null;
    }
}

/**
 * Clear business state
 */
export async function clearBizState(): Promise<ActionResult<void>> {
    if (typeof window === 'undefined') {
        return { success: false, error: 'Client-side only function' };
    }

    try {
        localStorage.removeItem('bizstate');
        localStorage.removeItem('bizstate_expires');

        return {
            success: true,
            data: undefined,
            message: 'Business state cleared successfully'
        };
    } catch (error) {
        console.error('Error clearing business state:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to clear business state'
        };
    }
}

/**
 * Check if business state exists and is valid
 */
export async function hasBizState(): Promise<boolean> {
    const state = await getBizState();
    return state !== null;
}

/**
 * Update business state partially
 */
export async function updateBizState(updates: Partial<BusinessState>): Promise<ActionResult<void>> {
    try {
        const currentState = await getBizState();
        const newState = {
            hasBusiness: false,
            hasSubscription: false,
            ...currentState,
            ...updates
        };

        return await setBizState(newState);
    } catch (error) {
        console.error('Error updating business state:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update business state'
        };
    }
}
