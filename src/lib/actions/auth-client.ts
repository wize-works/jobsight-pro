'use client';

import { createClientAction, type ActionResult } from './client-action-factory';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { z } from 'zod';

// Create browser client
function createBrowserClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error('Supabase URL or Anon Key is missing');
        return null;
    }

    return createClient<Database>(supabaseUrl, supabaseAnonKey);
}

// Validation schemas
const PasswordResetSchema = z.object({
    email: z.string().email('Please enter a valid email address'),
});

const ResetTokenSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
});

/**
 * Send password reset email
 * Note: In offline mode, this will be queued and sent when connection is restored
 */
export async function sendPasswordResetEmail(email: string): Promise<ActionResult<{ messageId?: string }>> {
    try {
        // Validate input
        const validated = PasswordResetSchema.parse({ email });

        const supabase = createBrowserClient();
        if (!supabase) {
            return {
                error: 'Failed to initialize Supabase client',
            };
        }

        // Check if online for immediate processing
        if (navigator.onLine) {
            try {
                // Use Supabase auth built-in password reset
                const { error } = await supabase.auth.resetPasswordForEmail(validated.email, {
                    redirectTo: `${window.location.origin}/reset-password`,
                });

                if (error) {
                    return {
                        error: 'Failed to send password reset email. Please try again.',
                    };
                }

                return {
                    data: { messageId: 'supabase-reset-email' },
                };
            } catch (error) {
                console.error('Password reset error:', error);
                return {
                    error: 'Failed to send password reset email. Please try again.',
                };
            }
        } else {
            // Store request for later processing when online
            const offlineRequest = {
                type: 'password_reset',
                email: validated.email,
                timestamp: new Date().toISOString(),
            };

            // Store in IndexedDB for retry when online
            if ('indexedDB' in window) {
                const request = indexedDB.open('jobsight_offline', 1);
                request.onsuccess = (event) => {
                    const db = (event.target as any).result;
                    const transaction = db.transaction(['auth_requests'], 'readwrite');
                    const store = transaction.objectStore('auth_requests');
                    store.add(offlineRequest);
                };
            }

            return {
                data: { messageId: 'queued-for-send' },
                isPending: true,
            };
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                error: error.errors[0]?.message || 'Invalid email address',
            };
        }

        console.error('Unexpected error in sendPasswordResetEmail:', error);
        return {
            error: 'An unexpected error occurred. Please try again.',
        };
    }
}

/**
 * Verify password reset token
 * This requires online connectivity as it involves server validation
 */
export async function verifyResetToken(token: string): Promise<ActionResult<{ userId?: string; email?: string }>> {
    try {
        // Validate input
        const validated = ResetTokenSchema.parse({ token });

        if (!navigator.onLine) {
            return {
                error: 'Internet connection required to verify reset token. Please check your connection and try again.',
            };
        }

        try {
            // Decode the token to get basic info
            const decoded = JSON.parse(Buffer.from(validated.token, 'base64').toString());

            // Check if token is expired
            if (new Date(decoded.expiresAt) < new Date()) {
                return {
                    error: 'Reset token has expired. Please request a new password reset.',
                };
            }

            const supabase = createBrowserClient();
            if (!supabase) {
                return {
                    error: 'Failed to initialize Supabase client',
                };
            }

            // Verify user still exists and is active
            const { data: user, error } = await supabase
                .from('users')
                .select('id, email, status')
                .eq('id', decoded.userId)
                .eq('email', decoded.email)
                .eq('status', 'active')
                .single();

            if (error || !user) {
                return {
                    error: 'Invalid or expired reset token. Please request a new password reset.',
                };
            }

            return {
                data: {
                    userId: user.id,
                    email: user.email,
                },
            };
        } catch (error) {
            console.error('Error verifying reset token:', error);
            return {
                error: 'Invalid reset token format. Please request a new password reset.',
            };
        }
    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                error: error.errors[0]?.message || 'Invalid token',
            };
        }

        console.error('Unexpected error in verifyResetToken:', error);
        return {
            error: 'An unexpected error occurred. Please try again.',
        };
    }
}

/**
 * Initialize offline auth request store
 * Call this when the app starts to set up IndexedDB for offline auth requests
 */
export function initializeOfflineAuthStore(): void {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
        return;
    }

    const request = indexedDB.open('jobsight_offline', 1);

    request.onupgradeneeded = (event) => {
        const db = (event.target as any).result;
        if (!db.objectStoreNames.contains('auth_requests')) {
            const store = db.createObjectStore('auth_requests', {
                keyPath: 'id',
                autoIncrement: true
            });
            store.createIndex('timestamp', 'timestamp', { unique: false });
            store.createIndex('type', 'type', { unique: false });
        }
    };
}

/**
 * Process queued auth requests when back online
 * Call this when network connectivity is restored
 */
export async function processQueuedAuthRequests(): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window) || !navigator.onLine) {
        return;
    }

    try {
        const request = indexedDB.open('jobsight_offline', 1);

        request.onsuccess = async (event) => {
            const db = (event.target as any).result;
            const transaction = db.transaction(['auth_requests'], 'readwrite');
            const store = transaction.objectStore('auth_requests');

            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = async () => {
                const queuedRequests = getAllRequest.result;

                for (const request of queuedRequests) {
                    if (request.type === 'password_reset') {
                        // Retry password reset
                        const result = await sendPasswordResetEmail(request.email);
                        if (result.data && !result.error) {
                            // Remove from queue if successful
                            store.delete(request.id);
                        }
                    }
                }
            };
        };
    } catch (error) {
        console.error('Error processing queued auth requests:', error);
    }
}

// Auto-initialize the offline store when this module loads
if (typeof window !== 'undefined') {
    initializeOfflineAuthStore();
}
