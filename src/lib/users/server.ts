import { createServerClient } from '@/lib/supabase';
import { serverFetchByBusiness, serverDeleteWithBusinessCheck, serverUpdateWithBusinessCheck, serverInsertWithBusiness } from '@/lib/db';
import { User, UserInsert, UserUpdate } from '@/types/users';

/**
 * Server-side utility to get all users for a business
 * Replaces server action for API route usage
 */
export async function getUsersServer(businessId: string): Promise<User[]> {
    try {
        if (!businessId) {
            console.error("No business found or business ID is missing");
            return [];
        }

        const { data, error } = await serverFetchByBusiness("users", businessId);

        if (error) {
            console.error("Error fetching users:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [] as User[];
        }

        return (data as unknown as User[]) || [];
    } catch (err) {
        console.error("Error in getUsersServer:", err);
        return [];
    }
}

/**
 * Server-side utility to get a user by ID
 * Replaces server action for API route usage
 */
export async function getUserByIdServer(businessId: string, id: string): Promise<User | null> {
    try {
        const { data, error } = await serverFetchByBusiness("users", businessId, "*", {
            filter: { auth_id: id },
        });

        if (error) {
            console.error("Error fetching user by ID:", error, id, businessId);
            return null;
        }

        if (data && data.length > 0) {
            return data[0] as unknown as User;
        }

        return null;
    } catch (err) {
        console.error("Error in getUserByIdServer:", err);
        return null;
    }
}

/**
 * Server-side utility to get a user by auth ID
 * Replaces server action for API route usage
 */
export async function getUserByAuthIdServer(businessId: string, authId: string): Promise<User | null> {
    try {
        const { data, error } = await serverFetchByBusiness("users", businessId, "*", {
            filter: { auth_id: authId },
        });

        if (error) {
            console.error("Error fetching user by auth ID:", error);
            return null;
        }

        if (data && data.length > 0) {
            return data[0] as unknown as User;
        }

        return null;
    } catch (err) {
        console.error("Error in getUserByAuthIdServer:", err);
        return null;
    }
}

/**
 * Server-side utility to create a new user
 * Replaces server action for API route usage
 */
export async function createUserServer(businessId: string, userId: string, user: UserInsert): Promise<User | null> {
    try {
        const userWithTimestamp = {
            ...user,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await serverInsertWithBusiness(
            "users",
            userWithTimestamp,
            businessId,
            userId
        );

        if (error) {
            console.error("Error creating user:", error);
            return null;
        }

        return Array.isArray(data) ? data[0] as User : data as User;
    } catch (err) {
        console.error("Error in createUserServer:", err);
        return null;
    }
}

/**
 * Server-side utility to update a user
 * Replaces server action for API route usage
 */
export async function updateUserServer(businessId: string, userId: string, id: string, user: UserUpdate): Promise<User | null> {
    try {
        const userWithTimestamp = {
            ...user,
            updated_at: new Date().toISOString(),
        };

        const { data, error } = await serverUpdateWithBusinessCheck(
            "users",
            id,
            userWithTimestamp,
            businessId,
            userId
        );

        if (error) {
            console.error("Error updating user:", error);
            return null;
        }

        return data as User;
    } catch (err) {
        console.error("Error in updateUserServer:", err);
        return null;
    }
}

/**
 * Server-side utility to delete a user
 * Replaces server action for API route usage
 */
export async function deleteUserServer(businessId: string, userId: string, id: string): Promise<boolean> {
    try {
        const { error } = await serverDeleteWithBusinessCheck("users", id, businessId);

        if (error) {
            console.error("Error deleting user:", error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in deleteUserServer:", err);
        return false;
    }
}

/**
 * Server-side utility to search users
 * Replaces server action for API route usage
 */
export async function searchUsersServer(businessId: string, query: string): Promise<User[]> {
    try {
        const { data, error } = await serverFetchByBusiness("users", businessId, "*", {
            filter: {
                or: [
                    { name: { ilike: `%${query}%` } },
                    { email: { ilike: `%${query}%` } },
                ],
            },
        });

        if (error) {
            console.error("Error searching users:", error);
            return [];
        }

        return (data as unknown as User[]) || [];
    } catch (err) {
        console.error("Error in searchUsersServer:", err);
        return [];
    }
}
