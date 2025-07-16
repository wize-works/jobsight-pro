/**
 * Users API Client Library
 * 
 * This module provides a type-safe interface for interacting with the users API.
 * It includes all CRUD operations and utility functions for user management.
 */

import { User, UserInsert, UserUpdate } from '@/types/users';

// Response types
export interface UserResponse {
    success: boolean;
    user?: User;
    error?: string;
    message?: string;
}

export interface UsersResponse {
    success: boolean;
    users?: User[];
    count?: number;
    error?: string;
}

export interface UserSearchResponse {
    success: boolean;
    users?: User[];
    error?: string;
}

export interface UserDeleteResponse {
    success: boolean;
    error?: string;
    message?: string;
}

// Request types
export interface CreateUserRequest {
    user: UserInsert;
}

export interface UpdateUserRequest {
    user: UserUpdate;
}

export interface UpdateUserAsAdminRequest {
    updates: {
        first_name?: string;
        last_name?: string;
        email?: string;
        role?: string;
        status?: string;
    };
}

export interface UploadAvatarRequest {
    file: File;
}

export interface SendInvitationRequest {
    email: string;
    name: string;
    role: string;
}

export interface AssignBusinessRequest {
    businessId: string;
}

// Query parameters interface
export interface GetUsersParams {
    search?: string;
    role?: string;
    status?: string;
    limit?: number;
    offset?: number;
}

/**
 * Users API Client Class
 * Provides methods for all user-related operations
 */
export class UsersAPI {
    private baseUrl = '/api/users';

    /**
     * Get all users for the current business
     */
    async getUsers(params: GetUsersParams = {}): Promise<UsersResponse> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('action', 'list');

            if (params.search) searchParams.append('search', params.search);
            if (params.role) searchParams.append('role', params.role);
            if (params.status) searchParams.append('status', params.status);
            if (params.limit) searchParams.append('limit', params.limit.toString());
            if (params.offset) searchParams.append('offset', params.offset.toString());

            const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`);
            const data = await response.json();

            return data as UsersResponse;
        } catch (error) {
            console.error('Error fetching users:', error);
            return { success: false, error: 'Failed to fetch users' };
        }
    }

    /**
     * Get a user by ID
     */
    async getUserById(id: string): Promise<UserResponse> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('action', 'get-by-id');
            searchParams.append('id', id);

            const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`);
            const data = await response.json();

            return data as UserResponse;
        } catch (error) {
            console.error('Error fetching user by ID:', error);
            return { success: false, error: 'Failed to fetch user' };
        }
    }

    /**
     * Get a user by auth ID
     */
    async getUserByAuthId(authId: string): Promise<UserResponse> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('action', 'get-by-auth-id');
            searchParams.append('authId', authId);

            const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`);
            const data = await response.json();

            return data as UserResponse;
        } catch (error) {
            console.error('Error fetching user by auth ID:', error);
            return { success: false, error: 'Failed to fetch user' };
        }
    }

    /**
     * Search users
     */
    async searchUsers(query: string): Promise<UserSearchResponse> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('action', 'search');
            searchParams.append('query', query);

            const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`);
            const data = await response.json();

            return data as UserSearchResponse;
        } catch (error) {
            console.error('Error searching users:', error);
            return { success: false, error: 'Failed to search users' };
        }
    }

    /**
     * Create a new user
     */
    async createUser(request: CreateUserRequest): Promise<UserResponse> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('action', 'create');

            const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            const data = await response.json();
            return data as UserResponse;
        } catch (error) {
            console.error('Error creating user:', error);
            return { success: false, error: 'Failed to create user' };
        }
    }

    /**
     * Update a user
     */
    async updateUser(id: string, request: UpdateUserRequest): Promise<UserResponse> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('action', 'update');
            searchParams.append('id', id);

            const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            const data = await response.json();
            return data as UserResponse;
        } catch (error) {
            console.error('Error updating user:', error);
            return { success: false, error: 'Failed to update user' };
        }
    }

    /**
     * Update a user by auth ID
     */
    async updateUserByAuthId(authId: string, request: UpdateUserRequest): Promise<UserResponse> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('action', 'update-by-auth-id');
            searchParams.append('id', authId);

            const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            const data = await response.json();
            return data as UserResponse;
        } catch (error) {
            console.error('Error updating user by auth ID:', error);
            return { success: false, error: 'Failed to update user' };
        }
    }

    /**
     * Update a user as admin
     */
    async updateUserAsAdmin(userId: string, request: UpdateUserAsAdminRequest): Promise<UserResponse> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('action', 'update-as-admin');
            searchParams.append('id', userId);

            const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            const data = await response.json();
            return data as UserResponse;
        } catch (error) {
            console.error('Error updating user as admin:', error);
            return { success: false, error: 'Failed to update user' };
        }
    }

    /**
     * Delete a user
     */
    async deleteUser(id: string): Promise<UserDeleteResponse> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('action', 'delete');
            searchParams.append('id', id);

            const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            return data as UserDeleteResponse;
        } catch (error) {
            console.error('Error deleting user:', error);
            return { success: false, error: 'Failed to delete user' };
        }
    }

    /**
     * Upload user avatar
     */
    async uploadUserAvatar(request: UploadAvatarRequest): Promise<UserResponse> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('action', 'upload-avatar');

            const formData = new FormData();
            formData.append('file', request.file);

            const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`, {
                method: 'POST',
                body: formData,
            });

            const data = await response.json();
            return data as UserResponse;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            return { success: false, error: 'Failed to upload avatar' };
        }
    }

    /**
     * Send user invitation
     */
    async sendUserInvitation(request: SendInvitationRequest): Promise<UserResponse> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('action', 'send-invitation');

            const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            const data = await response.json();
            return data as UserResponse;
        } catch (error) {
            console.error('Error sending invitation:', error);
            return { success: false, error: 'Failed to send invitation' };
        }
    }

    /**
     * Resend user invitation
     */
    async resendUserInvitation(userId: string): Promise<UserResponse> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('action', 'resend-invitation');
            searchParams.append('id', userId);

            const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`, {
                method: 'PUT',
            });

            const data = await response.json();
            return data as UserResponse;
        } catch (error) {
            console.error('Error resending invitation:', error);
            return { success: false, error: 'Failed to resend invitation' };
        }
    }

    /**
     * Revoke user invitation
     */
    async revokeUserInvitation(userId: string): Promise<UserDeleteResponse> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('action', 'revoke-invitation');
            searchParams.append('id', userId);

            const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            return data as UserDeleteResponse;
        } catch (error) {
            console.error('Error revoking invitation:', error);
            return { success: false, error: 'Failed to revoke invitation' };
        }
    }

    /**
     * Assign business to user
     */
    async assignBusinessToUser(request: AssignBusinessRequest): Promise<UserResponse> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('action', 'assign-business');

            const response = await fetch(`${this.baseUrl}?${searchParams.toString()}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            });

            const data = await response.json();
            return data as UserResponse;
        } catch (error) {
            console.error('Error assigning business to user:', error);
            return { success: false, error: 'Failed to assign business to user' };
        }
    }
}

// Utility functions
export const userUtils = {
    /**
     * Get full name from user
     */
    getFullName(user: User): string {
        return `${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email;
    },

    /**
     * Get user initials
     */
    getInitials(user: User): string {
        const firstName = user.first_name?.charAt(0) || '';
        const lastName = user.last_name?.charAt(0) || '';
        return (firstName + lastName).toUpperCase() || user.email.charAt(0).toUpperCase();
    },

    /**
     * Check if user is admin
     */
    isAdmin(user: User): boolean {
        return user.role === 'admin';
    },

    /**
     * Check if user is manager
     */
    isManager(user: User): boolean {
        return user.role === 'manager';
    },

    /**
     * Check if user is active
     */
    isActive(user: User): boolean {
        return user.status === 'active';
    },

    /**
     * Check if user is invited
     */
    isInvited(user: User): boolean {
        return user.status === 'invited';
    },

    /**
     * Format user role for display
     */
    formatRole(role: string): string {
        return role.charAt(0).toUpperCase() + role.slice(1);
    },

    /**
     * Format user status for display
     */
    formatStatus(status: string): string {
        return status.charAt(0).toUpperCase() + status.slice(1);
    },

    /**
     * Sort users by name
     */
    sortByName(users: User[]): User[] {
        return users.sort((a, b) => {
            const nameA = this.getFullName(a).toLowerCase();
            const nameB = this.getFullName(b).toLowerCase();
            return nameA.localeCompare(nameB);
        });
    },

    /**
     * Sort users by role
     */
    sortByRole(users: User[]): User[] {
        const roleOrder = { admin: 1, manager: 2, member: 3 };
        return users.sort((a, b) => {
            const roleA = roleOrder[a.role as keyof typeof roleOrder] || 4;
            const roleB = roleOrder[b.role as keyof typeof roleOrder] || 4;
            return roleA - roleB;
        });
    },

    /**
     * Filter users by role
     */
    filterByRole(users: User[], role: string): User[] {
        return users.filter(user => user.role === role);
    },

    /**
     * Filter users by status
     */
    filterByStatus(users: User[], status: string): User[] {
        return users.filter(user => user.status === status);
    },

    /**
     * Filter active users
     */
    filterActive(users: User[]): User[] {
        return users.filter(user => user.status === 'active');
    },

    /**
     * Filter invited users
     */
    filterInvited(users: User[]): User[] {
        return users.filter(user => user.status === 'invited');
    },

    /**
     * Search users by name or email
     */
    searchUsers(users: User[], query: string): User[] {
        const lowerQuery = query.toLowerCase();
        return users.filter(user => {
            const fullName = this.getFullName(user).toLowerCase();
            const email = user.email.toLowerCase();
            return fullName.includes(lowerQuery) || email.includes(lowerQuery);
        });
    },

    /**
     * Get user statistics
     */
    getUserStats(users: User[]) {
        const stats = {
            total: users.length,
            active: users.filter(u => u.status === 'active').length,
            invited: users.filter(u => u.status === 'invited').length,
            admins: users.filter(u => u.role === 'admin').length,
            managers: users.filter(u => u.role === 'manager').length,
            members: users.filter(u => u.role === 'member').length,
        };

        return stats;
    },

    /**
     * Validate email format
     */
    validateEmail(email: string): boolean {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    /**
     * Validate user data for creation
     */
    validateUserData(userData: Partial<UserInsert>): { valid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (!userData.email) {
            errors.push('Email is required');
        } else if (!this.validateEmail(userData.email)) {
            errors.push('Invalid email format');
        }

        if (!userData.first_name) {
            errors.push('First name is required');
        }

        if (userData.role && !['admin', 'manager', 'member'].includes(userData.role)) {
            errors.push('Invalid role');
        }

        return { valid: errors.length === 0, errors };
    },

    /**
     * Generate user avatar URL or placeholder
     */
    getAvatarUrl(user: User): string {
        return user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.getFullName(user))}&background=random`;
    },

    /**
     * Format user for display in dropdowns
     */
    formatForDropdown(user: User): { value: string; label: string } {
        return {
            value: user.id,
            label: this.getFullName(user),
        };
    },

    /**
     * Get users for dropdown
     */
    getUsersForDropdown(users: User[]): { value: string; label: string }[] {
        return users.map(user => this.formatForDropdown(user));
    },
};

// Export singleton instance
export const usersAPI = new UsersAPI();
