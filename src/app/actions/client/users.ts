"use client";

/**
 * Users Client Actions - Offline-First Implementation (Phase 2)
 * 
 * IMPORTANT: Throughout this file, 'userId' parameters refer to the auth_id
 * from your authentication provider (Clerk, Auth0, etc.), NOT the internal user.id.
 * This ensures optimal performance by avoiding additional database queries.
 */

import { User, UserInsert, UserUpdate, UserRole, UserStatus } from "@/types/users";
import { db } from "@/lib/offline/dexie-db";
import { getCurrentUserId, isOnline } from "./auth-utils";
import {
    ListResponse,
    GetResponse,
    CreateResponse,
    UpdateResponse,
    DeleteResponse,
    ClientActionErrorType,
    createListSuccessResponse,
    createListErrorResponse,
    createSuccessResponse,
    createErrorResponse
} from "@/types/client-actions";
import { v4 as uuidv4 } from "uuid";

// Validate that user has access to the specified business (using auth_id)
async function validateUserBusinessAccess(userAuthId: string, businessId: string): Promise<boolean> {
    try {
        // Check if user has a mapping to this business (using auth_id)
        const userBusinessId = await db.userBusinessMappings.get(userAuthId);
        if (userBusinessId?.businessId === businessId) {
            return true;
        }

        // Also check if user is the owner of the business (using auth_id)
        const business = await db.businesses.get(businessId);
        if (business && business.owner_id === userAuthId) {
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error validating user business access:", error);
        return false;
    }
}

/**
 * Users Offline Manager - Similar to BusinessOfflineManager
 */
export class UsersOfflineManager {
    // Add a user to local storage
    static async addUser(user: User): Promise<void> {
        await db.users.put(user);
    }

    // Get user by ID
    static async getUserById(userId: string): Promise<User | undefined> {
        return await db.users.get(userId);
    }

    // Get user by auth_id
    static async getUserByAuthId(authId: string): Promise<User | undefined> {
        return await db.users.where('auth_id').equals(authId).first();
    }

    // Get users for a specific business
    static async getUsersForBusiness(businessId: string): Promise<User[]> {
        return await db.users.where('business_id').equals(businessId).toArray();
    }

    // Update user
    static async updateUser(userId: string, data: Partial<User>): Promise<void> {
        await db.users.update(userId, data);
    }

    // Delete user
    static async deleteUser(userId: string): Promise<void> {
        await db.users.delete(userId);
    }

    // Search users by name or email
    static async searchUsers(businessId: string, query: string): Promise<User[]> {
        const lowercaseQuery = query.toLowerCase();
        return await db.users
            .where('business_id')
            .equals(businessId)
            .filter(user =>
                user.first_name?.toLowerCase().includes(lowercaseQuery) ||
                user.last_name?.toLowerCase().includes(lowercaseQuery) ||
                user.email?.toLowerCase().includes(lowercaseQuery)
            )
            .toArray();
    }

    // Add to sync queue
    static async addToSyncQueue(
        table: string,
        operation: 'insert' | 'update' | 'delete',
        data: any,
        recordId: string,
        businessId: string,
        userAuthId?: string
    ): Promise<void> {
        const queueItem = {
            id: uuidv4(),
            table,
            operation,
            data,
            businessId,
            userId: userAuthId,
            timestamp: Date.now(),
            retryCount: 0,
            synced: false
        };

        await db.syncQueue.add(queueItem);
    }

    // Check if data is fresh (within specified minutes)
    static async hasFreshData(recordId: string, table: string, freshMinutes: number = 5): Promise<boolean> {
        const metadata = await db.syncMetadata.get(`${table}_${recordId}`);
        if (!metadata) return false;

        const freshThreshold = Date.now() - (freshMinutes * 60 * 1000);
        return metadata.lastSync > freshThreshold;
    }

    // Update sync metadata
    static async updateSyncMetadata(recordId: string, table: string, businessId: string): Promise<void> {
        await db.syncMetadata.put({
            id: `${table}_${recordId}`,
            lastSync: Date.now(),
            businessId,
            table
        });
    }

    // Clear user data for specific business
    static async clearUserDataForBusiness(businessId: string): Promise<void> {
        await db.users.where('business_id').equals(businessId).delete();
    }

    // Validate user access to specific user record
    static async validateUserAccess(currentUserAuthId: string, targetUserId: string, businessId: string): Promise<boolean> {
        // Check if current user has access to the business
        const hasBusinessAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasBusinessAccess) {
            return false;
        }

        // Get the target user to verify they're in the same business
        const targetUser = await this.getUserById(targetUserId);
        if (!targetUser || targetUser.business_id !== businessId) {
            return false;
        }

        return true;
    }
}

/**
 * Get all users for a business - Cache-first implementation with authorization
 * @param businessId - The business ID to get users for
 */
export async function getUsers(businessId: string): Promise<ListResponse<User>> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            return createListErrorResponse(
                "Authentication required",
                ClientActionErrorType.AUTHENTICATION_REQUIRED
            );
        }

        // Validate that user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            return createListErrorResponse(
                "Access denied to this business",
                ClientActionErrorType.ACCESS_DENIED
            );
        }

        // First, try to get from local database
        const cachedUsers = await UsersOfflineManager.getUsersForBusiness(businessId);

        // Check if data is fresh (within 5 minutes)
        const hasFreshData = await UsersOfflineManager.hasFreshData(businessId, 'users');

        if (cachedUsers.length > 0 && (hasFreshData || !isOnline())) {
            return createListSuccessResponse(cachedUsers);
        }

        // If not in cache or data is stale, and we're online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/users/business/${businessId}`);
                if (response.ok) {
                    const users = await response.json();
                    if (users && Array.isArray(users)) {
                        // Store users in local database
                        for (const user of users) {
                            await UsersOfflineManager.addUser(user);
                        }
                        // Update sync metadata
                        await UsersOfflineManager.updateSyncMetadata(businessId, 'users', businessId);
                        return createListSuccessResponse(users);
                    }
                }
            } catch (error) {
                console.error("Failed to fetch users from server:", error);
            }
        }

        // Return cached version if available, even if stale
        return createListSuccessResponse(cachedUsers);
    } catch (error) {
        console.error("Error in getUsers:", error);
        return createListErrorResponse(
            error instanceof Error ? error.message : "Failed to get users",
            ClientActionErrorType.UNKNOWN_ERROR
        );
    }
}

/**
 * Get user by ID - Cache-first implementation with authorization
 * @param businessId - The business ID the user belongs to
 * @param userId - The user ID to get (internal database ID)
 */
export async function getUserById(businessId: string, userId: string): Promise<User | null> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            console.error("No authenticated user found");
            return null;
        }

        // Validate access to the user record
        const hasAccess = await UsersOfflineManager.validateUserAccess(currentUserAuthId, userId, businessId);
        if (!hasAccess) {
            console.error("User does not have access to user record:", userId);
            return null;
        }

        // First, try to get from local database
        const cachedUser = await UsersOfflineManager.getUserById(userId);

        if (cachedUser) {
            // Check if data is fresh (within 5 minutes)
            const hasFreshData = await UsersOfflineManager.hasFreshData(userId, 'users');

            if (hasFreshData || !isOnline()) {
                return cachedUser;
            }
        }

        // If not in cache or data is stale, and we're online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/users/business/${businessId}/user/${userId}`);
                if (response.ok) {
                    const user = await response.json();
                    if (user) {
                        // Store in local database
                        await UsersOfflineManager.addUser(user);
                        // Update sync metadata
                        await UsersOfflineManager.updateSyncMetadata(userId, 'users', businessId);
                        return user;
                    }
                }
            } catch (error) {
                console.error("Failed to fetch user from server:", error);
            }
        }

        // Return cached version if available, even if stale
        return cachedUser || null;
    } catch (error) {
        console.error("Error in getUserById:", error);
        return null;
    }
}

/**
 * Get user by auth_id - Cache-first implementation with authorization
 * @param businessId - The business ID the user belongs to  
 * @param authId - The auth_id from the auth provider
 */
export async function getUserByAuthId(businessId: string, authId: string): Promise<User | null> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            console.error("No authenticated user found");
            return null;
        }

        // Validate that user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            console.error("User does not have access to business:", businessId);
            return null;
        }

        // First, try to get from local database
        const cachedUser = await UsersOfflineManager.getUserByAuthId(authId);

        if (cachedUser && cachedUser.business_id === businessId) {
            // Check if data is fresh (within 5 minutes)
            const hasFreshData = await UsersOfflineManager.hasFreshData(cachedUser.id, 'users');

            if (hasFreshData || !isOnline()) {
                return cachedUser;
            }
        }

        // If not in cache or data is stale, and we're online, fetch from server
        if (isOnline()) {
            try {
                const response = await fetch(`/api/users/business/${businessId}/auth/${authId}`);
                if (response.ok) {
                    const user = await response.json();
                    if (user) {
                        // Store in local database
                        await UsersOfflineManager.addUser(user);
                        // Update sync metadata
                        await UsersOfflineManager.updateSyncMetadata(user.id, 'users', businessId);
                        return user;
                    }
                }
            } catch (error) {
                console.error("Failed to fetch user by auth_id from server:", error);
            }
        }

        // Return cached version if available, even if stale
        return cachedUser && cachedUser.business_id === businessId ? cachedUser : null;
    } catch (error) {
        console.error("Error in getUserByAuthId:", error);
        return null;
    }
}

/**
 * Create a new user - Offline-first implementation
 * @param businessId - The business ID to create the user in
 * @param userData - The user data to create
 */
export async function createUser(businessId: string, userData: UserInsert): Promise<{
    success: boolean;
    userId?: string;
    error?: string;
}> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            return {
                success: false,
                error: "Authentication required"
            };
        }

        // Validate that user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            return {
                success: false,
                error: "User does not have access to this business"
            };
        }

        const userId = uuidv4();
        const now = new Date().toISOString();

        // Create user object
        const newUser = {
            id: userId,
            business_id: businessId,
            auth_id: userData.auth_id,
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name,
            phone: userData.phone,
            role: userData.role || 'member',
            status: userData.status || 'active',
            avatar_url: userData.avatar_url || null,
            created_at: now,
            updated_at: now,
        } as User;

        // Store locally immediately
        await UsersOfflineManager.addUser(newUser);

        // Queue for server sync
        await UsersOfflineManager.addToSyncQueue(
            'users',
            'insert',
            newUser,
            userId,
            businessId,
            currentUserAuthId
        );

        // If online, try to sync immediately (optional - could be background)
        if (isOnline()) {
            console.log('Online - user creation queued for sync');
        }

        return { success: true, userId };
    } catch (error) {
        console.error("Error in createUser:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to create user"
        };
    }
}

/**
 * Update user - Offline-first implementation with authorization
 * @param businessId - The business ID the user belongs to
 * @param userId - The user ID to update
 * @param userData - The user data to update
 */
export async function updateUser(
    businessId: string,
    userId: string,
    userData: UserUpdate
): Promise<{ success: boolean; error?: string }> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            return {
                success: false,
                error: "Authentication required"
            };
        }

        // Validate access to the user record
        const hasAccess = await UsersOfflineManager.validateUserAccess(currentUserAuthId, userId, businessId);
        if (!hasAccess) {
            return {
                success: false,
                error: "User does not have access to this user record"
            };
        }

        const now = new Date().toISOString();

        // Prepare update data - be explicit about types
        const updateData: Partial<User> = {
            updated_at: now,
        };

        // Only include defined values from userData that match User schema
        if (userData.auth_id !== undefined) updateData.auth_id = userData.auth_id;
        if (userData.avatar_url !== undefined) updateData.avatar_url = userData.avatar_url;
        if (userData.business_id !== undefined) updateData.business_id = userData.business_id;
        if (userData.created_at !== undefined) updateData.created_at = userData.created_at;
        if (userData.email !== undefined && userData.email !== null) updateData.email = userData.email;
        if (userData.first_name !== undefined) updateData.first_name = userData.first_name;
        if (userData.last_name !== undefined) updateData.last_name = userData.last_name;
        if (userData.phone !== undefined) updateData.phone = userData.phone;
        if (userData.role !== undefined) updateData.role = userData.role;
        if (userData.status !== undefined) updateData.status = userData.status;

        // Update locally first (optimistic update)
        await UsersOfflineManager.updateUser(userId, updateData);

        // Queue for server sync
        await UsersOfflineManager.addToSyncQueue(
            'users',
            'update',
            { id: userId, ...updateData },
            userId,
            businessId,
            currentUserAuthId
        );

        return { success: true };
    } catch (error) {
        console.error("Error in updateUser:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update user"
        };
    }
}

/**
 * Delete user - Offline-first implementation with authorization
 * @param businessId - The business ID the user belongs to
 * @param userId - The user ID to delete
 */
export async function deleteUser(
    businessId: string,
    userId: string
): Promise<{ success: boolean; error?: string }> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            return {
                success: false,
                error: "Authentication required"
            };
        }

        // Validate access to the user record
        const hasAccess = await UsersOfflineManager.validateUserAccess(currentUserAuthId, userId, businessId);
        if (!hasAccess) {
            return {
                success: false,
                error: "User does not have access to this user record"
            };
        }

        // Delete locally first (optimistic update)
        await UsersOfflineManager.deleteUser(userId);

        // Queue for server sync
        await UsersOfflineManager.addToSyncQueue(
            'users',
            'delete',
            { id: userId },
            userId,
            businessId,
            currentUserAuthId
        );

        return { success: true };
    } catch (error) {
        console.error("Error in deleteUser:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete user"
        };
    }
}

/**
 * Search users - Cache-first implementation with authorization
 * @param businessId - The business ID to search users in
 * @param query - The search query (name or email)
 */
export async function searchUsers(businessId: string, query: string): Promise<User[]> {
    try {
        // Get current authenticated user (auth_id)
        const currentUserAuthId = await getCurrentUserId();
        if (!currentUserAuthId) {
            console.error("No authenticated user found");
            return [];
        }

        // Validate that user has access to this business
        const hasAccess = await validateUserBusinessAccess(currentUserAuthId, businessId);
        if (!hasAccess) {
            console.error("User does not have access to business:", businessId);
            return [];
        }

        // Search in local database first
        const localResults = await UsersOfflineManager.searchUsers(businessId, query);

        // If offline or we have results, return them
        if (!isOnline() || localResults.length > 0) {
            return localResults;
        }

        // If online and no local results, try server search
        if (isOnline()) {
            try {
                const response = await fetch(`/api/users/business/${businessId}/search?q=${encodeURIComponent(query)}`);
                if (response.ok) {
                    const users = await response.json();
                    if (users && Array.isArray(users)) {
                        // Store users in local database for future searches
                        for (const user of users) {
                            await UsersOfflineManager.addUser(user);
                        }
                        return users;
                    }
                }
            } catch (error) {
                console.error("Failed to search users on server:", error);
            }
        }

        // Return local results as fallback
        return localResults;
    } catch (error) {
        console.error("Error in searchUsers:", error);
        return [];
    }
}
