import { User } from '@/types/users';

/**
 * Client-side utility to fetch users from API
 * Replaces direct server action calls
 */
export async function getUsersClient(): Promise<User[]> {
    try {
        const response = await fetch('/api/users');
        if (!response.ok) {
            throw new Error('Failed to fetch users');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching users:', error);
        return [];
    }
}

/**
 * Client-side utility to get current user by auth ID
 * Replaces direct server action calls
 */
export async function getUserByAuthIdClient(authId: string): Promise<User | null> {
    try {
        const response = await fetch(`/api/users/${authId}`);
        if (!response.ok) {
            return null;
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching user by auth ID:', error);
        return null;
    }
}
