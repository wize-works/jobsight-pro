/**
 * Client-Side Users Actions
 * 
 * Replaces src/app/actions/users.ts with offline-first implementation.
 * Works entirely offline and syncs when connection is available.
 */

import type { Database } from "@/types/supabase";
import {
    createInsertAction,
    createUpdateAction,
    createDeleteAction,
    createSelectAction
} from "@/lib/actions/client-action-factory";
import { v4 as uuidv4 } from 'uuid';

// Extract Supabase types for users
type User = Database['public']['Tables']['users']['Row'];
type UserInsert = Database['public']['Tables']['users']['Insert'];
type UserUpdate = Partial<Database['public']['Tables']['users']['Update']>;

// Extended types for users with additional data
type UserWithRole = User & {
    role_name?: string;
    permissions?: string[];
};

// Create client-side user actions
const insertUser = createInsertAction('users', 'high');
const updateUser = createUpdateAction('users', 'high');
const deleteUser = createDeleteAction('users', 'medium');
const selectUsers = createSelectAction('users');

/**
 * Get all users for a business - works offline
 */
export const getUsers = async (businessId: string): Promise<User[]> => {
    try {
        const result = await selectUsers({}, businessId);

        if (result.error) {
            console.error("Error fetching users:", result.error);
            return [];
        }

        let users = (result.data || []) as User[];

        // Filter by business if specified
        if (businessId) {
            users = users.filter(u => u.business_id === businessId);
        }

        // Sort by name
        return users.sort((a, b) => {
            const nameA = `${a.first_name || ''} ${a.last_name || ''}`.trim();
            const nameB = `${b.first_name || ''} ${b.last_name || ''}`.trim();
            return nameA.localeCompare(nameB);
        });
    } catch (err) {
        console.error("Error in getUsers:", err);
        return [];
    }
};

/**
 * Get user by ID - works offline
 */
export const getUserById = async (businessId: string, id: string): Promise<User | null> => {
    try {
        const users = await getUsers(businessId);
        const user = users.find(u => u.id === id);

        if (!user) {
            console.warn(`User with ID ${id} not found`);
            return null;
        }

        return user;
    } catch (err) {
        console.error("Error in getUserById:", err);
        return null;
    }
};

/**
 * Get user by auth ID - works offline
 */
export const getUserByAuthId = async (businessId: string, authId: string): Promise<User | null> => {
    try {
        const users = await getUsers(businessId);
        const user = users.find(u => u.auth_id === authId);

        if (!user) {
            console.warn(`User with auth ID ${authId} not found`);
            return null;
        }

        return user;
    } catch (err) {
        console.error("Error in getUserByAuthId:", err);
        return null;
    }
};

/**
 * Get user by email - works offline
 */
export const getUserByEmail = async (businessId: string, email: string): Promise<User | null> => {
    try {
        const users = await getUsers(businessId);
        const user = users.find(u => u.email === email);

        if (!user) {
            console.warn(`User with email ${email} not found`);
            return null;
        }

        return user;
    } catch (err) {
        console.error("Error in getUserByEmail:", err);
        return null;
    }
};

/**
 * Create new user - works offline with optimistic updates
 */
export const createUser = async (
    data: UserInsert & { id?: string },
    businessId: string,
    currentUserId?: string
): Promise<{ data?: User; error?: string }> => {
    try {
        // Generate ID if not provided
        const newUserId = data.id || uuidv4();

        // Ensure required fields
        const userData: UserInsert = {
            first_name: data.first_name,
            last_name: data.last_name,
            email: data.email,
            phone: data.phone || null,
            role: data.role || 'member',
            status: data.status || 'active',
            auth_id: data.auth_id,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const result = await insertUser(userData, businessId, currentUserId);

        if (result.error) {
            return { error: result.error };
        }

        return { data: result.data as User };
    } catch (err) {
        console.error("Error in createUser:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Update user - works offline with optimistic updates
 */
export const updateUserById = async (
    id: string,
    data: UserUpdate,
    businessId: string,
    userId?: string
): Promise<{ data?: User; error?: string }> => {
    try {
        const updateData = {
            ...data,
            id,
            updated_at: new Date().toISOString(),
        };

        const result = await updateUser(updateData, businessId, userId);

        if (result.error) {
            return { error: result.error };
        }

        return { data: result.data as User };
    } catch (err) {
        console.error("Error in updateUserById:", err);
        return { error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Update user profile - works offline
 */
export const updateUserProfile = async (
    id: string,
    profileData: {
        first_name?: string;
        last_name?: string;
        phone?: string;
        avatar_url?: string;
    },
    businessId: string,
    userId?: string
): Promise<{ data?: User; error?: string }> => {
    return updateUserById(id, profileData, businessId, userId);
};

/**
 * Update user role - works offline
 */
export const updateUserRole = async (
    id: string,
    role: string,
    businessId: string,
    userId?: string
): Promise<{ data?: User; error?: string }> => {
    return updateUserById(id, { role }, businessId, userId);
};

/**
 * Update user status - works offline
 */
export const updateUserStatus = async (
    id: string,
    status: string,
    businessId: string,
    userId?: string
): Promise<{ data?: User; error?: string }> => {
    return updateUserById(id, { status }, businessId, userId);
};

/**
 * Deactivate user - works offline
 */
export const deactivateUser = async (
    id: string,
    businessId: string,
    userId?: string
): Promise<{ data?: User; error?: string }> => {
    return updateUserStatus(id, 'inactive', businessId, userId);
};

/**
 * Activate user - works offline
 */
export const activateUser = async (
    id: string,
    businessId: string,
    userId?: string
): Promise<{ data?: User; error?: string }> => {
    return updateUserStatus(id, 'active', businessId, userId);
};

/**
 * Delete user - works offline with optimistic updates
 */
export const deleteUserById = async (
    id: string,
    businessId: string,
    userId?: string
): Promise<{ success: boolean; error?: string }> => {
    try {
        const result = await deleteUser({ id }, businessId, userId);

        if (result.error) {
            return { success: false, error: result.error };
        }

        return { success: true };
    } catch (err) {
        console.error("Error in deleteUserById:", err);
        return { success: false, error: err instanceof Error ? err.message : "Unknown error" };
    }
};

/**
 * Get users by role - works offline
 */
export const getUsersByRole = async (businessId: string, role: string): Promise<User[]> => {
    try {
        const users = await getUsers(businessId);
        return users.filter(user => user.role === role);
    } catch (err) {
        console.error("Error in getUsersByRole:", err);
        return [];
    }
};

/**
 * Get active users - works offline
 */
export const getActiveUsers = async (businessId: string): Promise<User[]> => {
    try {
        const users = await getUsers(businessId);
        return users.filter(user => user.status === 'active');
    } catch (err) {
        console.error("Error in getActiveUsers:", err);
        return [];
    }
};

/**
 * Get users with roles - works offline
 */
export const getUsersWithRoles = async (businessId: string): Promise<UserWithRole[]> => {
    try {
        const users = await getUsers(businessId);

        // TODO: Implement role data caching and joining
        return users.map(user => ({
            ...user,
            role_name: user.role || 'Member', // Placeholder - implement role lookup
            permissions: [] // Placeholder - implement permissions lookup
        })) as UserWithRole[];

    } catch (err) {
        console.error("Error in getUsersWithRoles:", err);
        return [];
    }
};

/**
 * Search users by name or email - works offline
 */
export const searchUsers = async (businessId: string, query: string): Promise<User[]> => {
    try {
        const users = await getUsers(businessId);
        const searchQuery = query.toLowerCase().trim();

        if (!searchQuery) {
            return users;
        }

        return users.filter(user => {
            const fullName = `${user.first_name || ''} ${user.last_name || ''}`.toLowerCase();
            const email = (user.email || '').toLowerCase();

            return fullName.includes(searchQuery) || email.includes(searchQuery);
        });
    } catch (err) {
        console.error("Error in searchUsers:", err);
        return [];
    }
};

/**
 * Get user count by status - works offline
 */
export const getUserCountByStatus = async (businessId: string): Promise<Record<string, number>> => {
    try {
        const users = await getUsers(businessId);
        const statusCounts: Record<string, number> = {};

        users.forEach(user => {
            const status = user.status || 'unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        return statusCounts;
    } catch (err) {
        console.error("Error in getUserCountByStatus:", err);
        return {};
    }
};

/**
 * Check if user operations are pending sync
 */
export const getUserSyncStatus = async (businessId: string) => {
    // This could check IndexedDB sync queue for pending user operations
    // Implementation would depend on sync queue structure
    return {
        hasPendingSync: false, // Placeholder
        pendingOperations: 0
    };
};

// Export compatibility functions for existing code
export {
    getUsers as default,
    createUser as insertUser,
    updateUserById as updateUser,
    deleteUserById as deleteUser
};
