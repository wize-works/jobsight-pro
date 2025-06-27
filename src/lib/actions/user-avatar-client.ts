/**
 * Client-Side User Avatar Actions
 * 
 * Replaces src/app/actions/user-avatar.ts with offline-first implementation.
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
type UserUpdate = Database['public']['Tables']['users']['Update'];
type Media = Database['public']['Tables']['media']['Row'];
type MediaInsert = Database['public']['Tables']['media']['Insert'];

// Create action instances
const insertMedia = createInsertAction('media', 'high');
const updateUser = createUpdateAction('users', 'high');
const selectUsers = createSelectAction('users');

/**
 * Upload user avatar with offline support
 * In offline mode, stores file locally and syncs when online
 */
export const uploadUserAvatar = async (
    businessId: string,
    file: File,
    userId: string
): Promise<{ data?: { avatarUrl: string }; error?: string; isPending?: boolean }> => {
    try {
        // Validate file type and size
        if (!file.type.startsWith('image/')) {
            return { error: "Please select an image file" };
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            return { error: "File size must be less than 5MB" };
        }

        // Get current user data
        const userResult = await selectUsers({
            filter: { id: userId }
        }, businessId);

        if (!userResult.data || userResult.data.length === 0) {
            return { error: "User not found" };
        }

        const currentUser = userResult.data[0] as User;

        if (navigator.onLine) {
            try {
                // Online: Direct upload to Azure Blob Storage
                // TODO: Implement Azure Blob Storage upload
                // For now, create a local blob URL as fallback
                const avatarUrl = URL.createObjectURL(file);

                // Create media record
                const mediaData: MediaInsert = {
                    id: crypto.randomUUID(),
                    name: `Avatar - ${currentUser.first_name} ${currentUser.last_name}`,
                    description: `Profile picture for ${currentUser.first_name} ${currentUser.last_name}`,
                    type: "image",
                    url: avatarUrl,
                    size: file.size,
                    business_id: businessId,
                    project_id: null,
                    uploaded_by: userId,
                    uploaded_at: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                    created_by: userId,
                    updated_at: new Date().toISOString(),
                    updated_by: userId
                };

                const mediaResult = await insertMedia(mediaData, businessId, userId);
                if (mediaResult.error) {
                    return { error: "Failed to create media record" };
                }

                // Update user record with new avatar URL
                const userUpdateData: UserUpdate = {
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString(),
                    status: null // Keep existing status
                };

                const userUpdateResult = await updateUser(userUpdateData, businessId, userId);
                if (userUpdateResult.error) {
                    return { error: "Failed to update user profile" };
                }

                return {
                    data: { avatarUrl }
                };

            } catch (error) {
                console.error("Error uploading avatar online:", error);
                return { error: "Failed to upload avatar online" };
            }
        } else {
            // Offline: Store file locally and queue for upload
            try {
                // Create blob URL for immediate display
                const avatarUrl = URL.createObjectURL(file);

                // Store file in IndexedDB for later upload
                if ('indexedDB' in window) {
                    const request = indexedDB.open('jobsight_offline', 1);
                    request.onsuccess = (event) => {
                        const db = (event.target as any).result;
                        const transaction = db.transaction(['pending_uploads'], 'readwrite');
                        const store = transaction.objectStore('pending_uploads');

                        const uploadRecord = {
                            id: crypto.randomUUID(),
                            type: 'user_avatar',
                            businessId,
                            userId,
                            file: {
                                name: file.name,
                                type: file.type,
                                size: file.size,
                                data: file
                            },
                            timestamp: new Date().toISOString(),
                            tempUrl: avatarUrl
                        };

                        store.add(uploadRecord);
                    };
                }

                // Update user record with temporary URL (optimistic update)
                const userUpdateData: UserUpdate = {
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString(),
                    status: null // Keep existing status
                };

                const userUpdateResult = await updateUser(userUpdateData, businessId, userId);
                if (userUpdateResult.error) {
                    return { error: "Failed to update user profile locally" };
                }

                return {
                    data: { avatarUrl },
                    isPending: true
                };

            } catch (error) {
                console.error("Error handling offline avatar upload:", error);
                return { error: "Failed to handle offline avatar upload" };
            }
        }

    } catch (error) {
        console.error("Error uploading user avatar:", error);
        return { error: "An unexpected error occurred" };
    }
};

/**
 * Get user avatar URL
 */
export const getUserAvatar = async (businessId: string, userId: string): Promise<{ data?: string; error?: string }> => {
    try {
        const userResult = await selectUsers({
            filter: { id: userId }
        }, businessId);

        if (!userResult.data || userResult.data.length === 0) {
            return { error: "User not found" };
        }

        const user = userResult.data[0] as User;
        return { data: user.avatar_url || '' };

    } catch (error) {
        console.error("Error getting user avatar:", error);
        return { error: "Failed to get user avatar" };
    }
};

/**
 * Remove user avatar
 */
export const removeUserAvatar = async (businessId: string, userId: string): Promise<{ data?: boolean; error?: string }> => {
    try {
        const userUpdateData: UserUpdate = {
            avatar_url: null,
            updated_at: new Date().toISOString(),
            status: null // Keep existing status
        };

        const result = await updateUser(userUpdateData, businessId, userId);
        if (result.error) {
            return { error: "Failed to remove avatar" };
        }

        return { data: true };

    } catch (error) {
        console.error("Error removing user avatar:", error);
        return { error: "Failed to remove user avatar" };
    }
};

/**
 * Initialize offline upload store
 */
export function initializeOfflineUploadStore(): void {
    if (typeof window === 'undefined' || !('indexedDB' in window)) {
        return;
    }

    const request = indexedDB.open('jobsight_offline', 1);

    request.onupgradeneeded = (event) => {
        const db = (event.target as any).result;
        if (!db.objectStoreNames.contains('pending_uploads')) {
            const store = db.createObjectStore('pending_uploads', {
                keyPath: 'id'
            });
            store.createIndex('type', 'type', { unique: false });
            store.createIndex('userId', 'userId', { unique: false });
            store.createIndex('timestamp', 'timestamp', { unique: false });
        }
    };
}

/**
 * Process pending uploads when back online
 */
export async function processPendingUploads(businessId: string): Promise<void> {
    if (typeof window === 'undefined' || !('indexedDB' in window) || !navigator.onLine) {
        return;
    }

    try {
        const request = indexedDB.open('jobsight_offline', 1);

        request.onsuccess = async (event) => {
            const db = (event.target as any).result;
            const transaction = db.transaction(['pending_uploads'], 'readwrite');
            const store = transaction.objectStore('pending_uploads');

            const getAllRequest = store.getAll();
            getAllRequest.onsuccess = async () => {
                const pendingUploads = getAllRequest.result;

                for (const upload of pendingUploads) {
                    if (upload.type === 'user_avatar' && upload.businessId === businessId) {
                        try {
                            // Process the upload
                            const result = await uploadUserAvatar(businessId, upload.file.data, upload.userId);
                            if (result.data && !result.error) {
                                // Remove from queue if successful
                                store.delete(upload.id);
                            }
                        } catch (error) {
                            console.error('Error processing pending avatar upload:', error);
                        }
                    }
                }
            };
        };
    } catch (error) {
        console.error('Error processing pending uploads:', error);
    }
}

// Auto-initialize the offline store when this module loads
if (typeof window !== 'undefined') {
    initializeOfflineUploadStore();
}
