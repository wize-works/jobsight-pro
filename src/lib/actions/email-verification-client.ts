/**
 * Client-side email verification actions with offline support
 * Provides offline-first email verification, queuing, and user management
 * 
 * Migrated from: src/app/actions/email-verification.ts
 */

import {
    createInsertAction,
    createUpdateAction,
    createSelectAction
} from './client-action-factory';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

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

// Extract Supabase types
type User = Database['public']['Tables']['users']['Row'];

// Email verification types
export interface EmailVerificationRequest {
    id: string;
    user_id: string;
    business_id: string;
    email: string;
    verification_token: string;
    expires_at: string;
    sent_at: string;
    verified_at?: string;
    created_at: string;
    updated_at: string;
}

export interface EmailVerificationOptions {
    userId: string;
    customMessage?: string;
    resend?: boolean;
}

export interface VerificationResult {
    success: boolean;
    message: string;
    error?: string;
    user?: User;
    messageId?: string;
}

// Create client actions with offline support
const insertEmailVerification = createInsertAction('email_verifications', 'high');
const updateEmailVerification = createUpdateAction('email_verifications', 'high');
const selectEmailVerifications = createSelectAction('email_verifications');

/**
 * Send email verification to user
 * In offline mode, this queues the request for when connection is restored
 */
export async function sendEmailVerification(options: EmailVerificationOptions): Promise<VerificationResult> {
    try {
        const { userId, customMessage, resend = false } = options;

        // Get business ID from localStorage or current business context
        const currentBusiness = localStorage.getItem('currentBusiness');
        const business = currentBusiness ? JSON.parse(currentBusiness) : null;

        if (!business?.id) {
            throw new Error('Business context not available');
        }

        const supabase = createBrowserClient();
        if (!supabase) {
            throw new Error('Failed to create Supabase client');
        }

        // Get user details
        let user: User | null = null;

        try {
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .eq('business_id', business.id)
                .single();

            if (userError || !userData) {
                return {
                    success: false,
                    message: 'User not found',
                    error: 'User not found'
                };
            }

            user = userData;
        } catch (error) {
            return {
                success: false,
                message: 'Failed to fetch user data',
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }

        // Check if already verified
        if (user?.email_verified && !resend) {
            return {
                success: false,
                message: 'Email is already verified',
                error: 'Email is already verified'
            };
        }

        // Ensure user exists before proceeding
        if (!user) {
            return {
                success: false,
                message: 'User not found',
                error: 'User not found'
            };
        }

        // Generate verification token
        const verificationToken = btoa(JSON.stringify({
            userId: user.id,
            email: user.email,
            businessId: business.id,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
        }));

        const verificationRequest = {
            id: crypto.randomUUID(),
            user_id: userId,
            business_id: business.id,
            email: user.email,
            verification_token: verificationToken,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            sent_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Store verification request offline-first
        await insertEmailVerification(verificationRequest, business.id);

        // In offline mode, queue the email send request
        if (!navigator.onLine) {
            // Queue for background processing when online
            await queueEmailSend(verificationRequest, customMessage);

            return {
                success: true,
                message: 'Verification email queued for sending when connection is restored'
            };
        }

        // Try to send email immediately if online
        try {
            const emailResult = await sendVerificationEmail(verificationRequest, customMessage);
            return emailResult;
        } catch (error) {
            // Email send failed but verification request is stored
            console.warn('Email send failed, but verification request stored:', error);
            await queueEmailSend(verificationRequest, customMessage);

            return {
                success: true,
                message: 'Verification request created, email will be sent when service is available'
            };
        }

    } catch (error) {
        console.error('Error in sendEmailVerification:', error);
        return {
            success: false,
            message: 'Failed to send verification email',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Verify email token
 * This requires online connectivity for security
 */
export async function verifyEmailToken(token: string): Promise<VerificationResult> {
    try {
        if (!navigator.onLine) {
            return {
                success: false,
                message: 'Email verification requires internet connection',
                error: 'Offline verification not supported for security reasons'
            };
        }

        // Decode and validate token
        let decoded: any;
        try {
            decoded = JSON.parse(atob(token));
        } catch (error) {
            return {
                success: false,
                message: 'Invalid verification token',
                error: 'Token decode failed'
            };
        }

        // Check if token is expired
        if (new Date(decoded.expiresAt) < new Date()) {
            return {
                success: false,
                message: 'Verification token has expired',
                error: 'Token expired'
            };
        }

        const supabase = createBrowserClient();
        if (!supabase) {
            throw new Error('Failed to create Supabase client');
        }

        // Update user verification status
        const { data: user, error } = await supabase
            .from('users')
            .update({
                email_verified: true,
                status: 'active'
            })
            .eq('id', decoded.userId)
            .eq('email', decoded.email)
            .eq('business_id', decoded.businessId)
            .select()
            .single();

        if (error || !user) {
            return {
                success: false,
                message: 'Invalid verification token',
                error: 'User update failed'
            };
        }

        // Mark verification request as completed
        try {
            const existingRequests = await selectEmailVerifications({}, decoded.businessId);
            const matchingRequest = existingRequests.data?.find((req: EmailVerificationRequest) =>
                req.user_id === decoded.userId && req.verification_token === token
            );

            if (matchingRequest) {
                await updateEmailVerification(matchingRequest.id, {
                    ...matchingRequest,
                    verified_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                }, decoded.businessId);
            }
        } catch (error) {
            console.warn('Failed to update verification request:', error);
            // Don't fail the verification if this fails
        }

        return {
            success: true,
            message: 'Email verified successfully',
            user
        };

    } catch (error) {
        console.error('Error verifying email:', error);
        return {
            success: false,
            message: 'Failed to verify email',
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

/**
 * Get verification requests for a business
 */
export async function getVerificationRequests(businessId: string): Promise<EmailVerificationRequest[]> {
    const result = await selectEmailVerifications({}, businessId);
    return result.data || [];
}

/**
 * Queue email send for background processing
 */
async function queueEmailSend(
    verificationRequest: EmailVerificationRequest,
    customMessage?: string
): Promise<void> {
    try {
        const emailQueue = JSON.parse(localStorage.getItem('emailVerificationQueue') || '[]');
        emailQueue.push({
            ...verificationRequest,
            customMessage,
            queuedAt: new Date().toISOString()
        });
        localStorage.setItem('emailVerificationQueue', JSON.stringify(emailQueue));
    } catch (error) {
        console.error('Failed to queue email:', error);
    }
}

/**
 * Process queued email sends when online
 */
export async function processEmailVerificationQueue(): Promise<void> {
    if (!navigator.onLine) return;

    try {
        const emailQueue = JSON.parse(localStorage.getItem('emailVerificationQueue') || '[]');
        if (emailQueue.length === 0) return;

        const processedIds: string[] = [];

        for (const queuedEmail of emailQueue) {
            try {
                await sendVerificationEmail(queuedEmail, queuedEmail.customMessage);
                processedIds.push(queuedEmail.id);
            } catch (error) {
                console.warn('Failed to send queued verification email:', error);
                // Continue processing other emails
            }
        }

        // Remove processed emails from queue
        const remainingQueue = emailQueue.filter((email: any) => !processedIds.includes(email.id));
        localStorage.setItem('emailVerificationQueue', JSON.stringify(remainingQueue));

    } catch (error) {
        console.error('Error processing email verification queue:', error);
    }
}

/**
 * Send verification email via server API
 * This is a fallback that requires online connectivity
 */
async function sendVerificationEmail(
    verificationRequest: EmailVerificationRequest,
    customMessage?: string
): Promise<VerificationResult> {
    try {
        // In a real implementation, this would call a server API or email service
        // For now, we'll simulate the email send

        const verificationUrl = `${window.location.origin}/verify-email?token=${verificationRequest.verification_token}`;

        // Simulate API call to email service
        const response = await fetch('/api/send-verification-email', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                email: verificationRequest.email,
                verificationUrl,
                customMessage
            })
        });

        if (!response.ok) {
            throw new Error('Email service unavailable');
        }

        const result = await response.json();

        return {
            success: true,
            message: 'Verification email sent successfully',
            messageId: result.messageId
        };

    } catch (error) {
        console.error('Email send failed:', error);
        throw error;
    }
}

// Auto-process email queue when coming online
if (typeof window !== 'undefined') {
    window.addEventListener('online', processEmailVerificationQueue);
}
