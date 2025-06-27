/**
 * Client-Side User Invitations Actions
 * 
 * Replaces src/app/actions/user-invitations.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 */

import type { Database } from "@/types/supabase";
import {
    createInsertAction,
    createUpdateAction,
    createDeleteAction,
    createSelectAction
} from "@/lib/actions/client-action-factory";

// Type definitions from Supabase schema
type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Database['public']['Tables']['users']['Update'];

// Create action instances
const insertUser = createInsertAction('users', 'high');
const updateUser = createUpdateAction('users', 'high');
const selectUsers = createSelectAction('users');

/**
 * Send user invitation with offline support
 * In offline mode, queues invitation for sending when online
 */
export const sendUserInvitation = async (
    businessId: string,
    email: string,
    name: string,
    role: 'admin' | 'manager' | 'member',
    currentUserId: string
): Promise<{ data?: User; error?: string; isPending?: boolean }> => {
    try {
        // Validate inputs
        if (!email || !name || !role) {
            return { error: "Email, name, and role are required" };
        }

        if (!['admin', 'manager', 'member'].includes(role)) {
            return { error: "Invalid role specified" };
        }

        // Check if user already exists
        const existingResult = await selectUsers({
            filter: { email, business_id: businessId }
        }, businessId);

        if (existingResult.data && existingResult.data.length > 0) {
            return { error: "User with this email already exists in this business" };
        }

        // Split name into first and last name
        const nameParts = name.trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        // Create user record with invited status
        const userId = crypto.randomUUID();
        const newUser: UserInsert = {
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: null,
            role: role,
            status: "invited",
            auth_id: `invited_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        // Pass the ID and business_id separately to the client action
        const userResult = await insertUser(newUser, businessId, currentUserId);
        if (userResult.error) {
            return { error: userResult.error };
        }

        const createdUser = userResult.data as User;

        if (navigator.onLine) {
            try {
                // Online: Send invitation email immediately
                await sendInvitationEmail(createdUser, businessId);

                return { data: createdUser };
            } catch (error) {
                console.error("Error sending invitation email:", error);
                // User was created but email failed - queue for retry
                await queueInvitationEmail(createdUser, businessId);
                return {
                    data: createdUser,
                    isPending: true
                };
            }
        } else {
            // Offline: Queue invitation for sending when online
            await queueInvitationEmail(createdUser, businessId);
            return {
                data: createdUser,
                isPending: true
            };
        }

    } catch (error) {
        console.error("Error sending user invitation:", error);
        return { error: "Failed to send user invitation" };
    }
};

/**
 * Accept user invitation
 */
export const acceptUserInvitation = async (
    token: string,
    authId: string
): Promise<{ data?: User; error?: string }> => {
    try {
        if (!navigator.onLine) {
            return { error: "Internet connection required to accept invitation" };
        }

        // Decode invitation token
        const decoded = JSON.parse(Buffer.from(token, 'base64').toString());

        // Check if token is expired
        if (new Date(decoded.expiresAt) < new Date()) {
            return { error: "Invitation has expired" };
        }

        // Update user status to active and set auth_id
        const userUpdateData: UserUpdate = {
            status: "active",
            auth_id: authId,
            updated_at: new Date().toISOString()
        };

        const result = await updateUser(userUpdateData, decoded.businessId, decoded.userId);
        if (result.error) {
            return { error: "Failed to activate user account" };
        }

        return { data: result.data as User };

    } catch (error) {
        console.error("Error accepting invitation:", error);
        return { error: "Invalid invitation token" };
    }
};

/**
 * Resend user invitation
 */
export const resendUserInvitation = async (
    businessId: string,
    userId: string,
    currentUserId: string
): Promise<{ data?: boolean; error?: string; isPending?: boolean }> => {
    try {
        // Get user details
        const userResult = await selectUsers({
            filter: { id: userId, business_id: businessId }
        }, businessId);

        if (!userResult.data || userResult.data.length === 0) {
            return { error: "User not found" };
        }

        const user = userResult.data[0] as User;

        if (user.status !== "invited") {
            return { error: "User is not in invited status" };
        }

        if (navigator.onLine) {
            try {
                await sendInvitationEmail(user, businessId);
                return { data: true };
            } catch (error) {
                console.error("Error resending invitation:", error);
                await queueInvitationEmail(user, businessId);
                return { data: true, isPending: true };
            }
        } else {
            await queueInvitationEmail(user, businessId);
            return { data: true, isPending: true };
        }

    } catch (error) {
        console.error("Error resending invitation:", error);
        return { error: "Failed to resend invitation" };
    }
};

/**
 * Cancel user invitation
 */
export const cancelUserInvitation = async (
    businessId: string,
    userId: string,
    currentUserId: string
): Promise<{ data?: boolean; error?: string }> => {
    try {
        // Get user to verify they're in invited status
        const userResult = await selectUsers({
            filter: { id: userId, business_id: businessId }
        }, businessId);

        if (!userResult.data || userResult.data.length === 0) {
            return { error: "User not found" };
        }

        const user = userResult.data[0] as User;

        if (user.status !== "invited") {
            return { error: "User is not in invited status" };
        }

        // Update status to cancelled
        const userUpdateData: UserUpdate = {
            status: "cancelled",
            updated_at: new Date().toISOString()
        };

        const result = await updateUser(userUpdateData, businessId, currentUserId);
        if (result.error) {
            return { error: "Failed to cancel invitation" };
        }

        return { data: true };

    } catch (error) {
        console.error("Error cancelling invitation:", error);
        return { error: "Failed to cancel invitation" };
    }
};

/**
 * Get pending invitations for a business
 */
export const getPendingInvitations = async (businessId: string): Promise<User[]> => {
    try {
        const result = await selectUsers({
            filter: {
                business_id: businessId,
                status: "invited"
            },
            orderBy: { column: 'created_at', ascending: false }
        }, businessId);

        if (result.error) {
            console.error("Error getting pending invitations:", result.error);
            return [];
        }

        return (result.data || []) as User[];

    } catch (error) {
        console.error("Error in getPendingInvitations:", error);
        return [];
    }
};

// Helper functions

/**
 * Send invitation email (online only)
 */
async function sendInvitationEmail(user: User, businessId: string): Promise<void> {
    // Generate invitation token
    const invitationToken = Buffer.from(
        JSON.stringify({
            userId: user.id,
            email: user.email,
            businessId: businessId,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
    ).toString('base64');

    const invitationUrl = `${window.location.origin}/invite?token=${invitationToken}`;

    // TODO: Implement actual email sending via API when online
    // For now, just log the invitation details
    console.log('Invitation email would be sent:', {
        to: user.email,
        name: `${user.first_name} ${user.last_name}`,
        url: invitationUrl
    });
}

/**
 * Queue invitation email for sending when online
 */
async function queueInvitationEmail(user: User, businessId: string): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
        return;
    }

    const request = indexedDB.open('jobsight_offline', 1);
    request.onsuccess = (event) => {
        const db = (event.target as any).result;
        const transaction = db.transaction(['email_queue'], 'readwrite');
        const store = transaction.objectStore('email_queue');

        const emailRecord = {
            id: crypto.randomUUID(),
            type: 'user_invitation',
            businessId,
            userId: user.id,
            email: user.email,
            name: `${user.first_name} ${user.last_name}`,
            timestamp: new Date().toISOString()
        };

        store.add(emailRecord);
    };
}

/**
 * Initialize offline email queue store
 */
export function initializeOfflineEmailQueue(): void {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
        return;
    }

    const request = indexedDB.open('jobsight_offline', 1);

    request.onupgradeneeded = (event) => {
        const db = (event.target as any).result;
        if (!db.objectStoreNames.contains('email_queue')) {
            const store = db.createObjectStore('email_queue', {
                keyPath: 'id'
            });
            store.createIndex('type', 'type', { unique: false });
            store.createIndex('businessId', 'businessId', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
        }
    };
}

/**
 * Process queued emails when back online
 */
export async function processQueuedEmails(businessId: string): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window) || !navigator.onLine) {
        return;
    }

    try {
        const request = indexedDB.open('jobsight_offline', 1);

        request.onsuccess = async (event) => {
            const db = (event.target as any).result;
            const transaction = db.transaction(['email_queue'], 'readwrite');
            const store = transaction.objectStore('email_queue');

            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = async () => {
                const queuedEmails = getAllRequest.result;

                for (const email of queuedEmails) {
                    if (email.businessId === businessId && email.type === 'user_invitation') {
                        try {
                            // Get current user data
                            const userResult = await selectUsers({
                                filter: { id: email.userId }
                            }, businessId);

                            if (userResult.data && userResult.data.length > 0) {
                                const user = userResult.data[0] as User;
                                await sendInvitationEmail(user, businessId);

                                // Remove from queue if successful
                                store.delete(email.id);
                            }
                        } catch (error) {
                            console.error('Error processing queued invitation email:', error);
                        }
                    }
                }
            };
        };
    } catch (error) {
        console.error('Error processing queued emails:', error);
    }
}

// Auto-initialize the offline store when this module loads
if (typeof window !== 'undefined') {
    initializeOfflineEmailQueue();
}
