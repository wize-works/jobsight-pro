'use client';

import { useState, useEffect } from 'react';
import {
    usersAPI,
    UsersAPI,
    UserResponse,
    UsersResponse,
    UserSearchResponse,
    UserDeleteResponse,
    CreateUserRequest,
    UpdateUserRequest,
    UpdateUserAsAdminRequest,
    UploadAvatarRequest,
    SendInvitationRequest,
    GetUsersParams,
    userUtils
} from '@/lib/api/users';
import { User, UserInsert, UserUpdate } from '@/types/users';

/**
 * Hook for managing users list
 */
export function useUsers(params: GetUsersParams = {}) {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [count, setCount] = useState(0);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await usersAPI.getUsers(params);
            if (result.success) {
                setUsers(Array.isArray(result.data) ? result.data : []);
                setCount(result.pagination?.count || 0);
            } else {
                setError(result.error || 'Failed to fetch users');
                setUsers([]); // Ensure users is always an array
                setCount(0);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch users');
            setUsers([]); // Ensure users is always an array
            setCount(0);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [JSON.stringify(params)]);

    return { users, loading, error, count, refetch: fetchUsers };
}

/**
 * Hook for managing a single user
 */
export function useUser(id: string | null) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = async () => {
        if (!id) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const result = await usersAPI.getUserById(id);
            if (result.success) {
                setUser(result.user || null);
            } else {
                setError(result.error || 'Failed to fetch user');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch user');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [id]);

    return { user, loading, error, refetch: fetchUser };
}

/**
 * Hook for getting user by auth ID
 */
export function useUserByAuthId(authId: string | null) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUser = async () => {
        if (!authId) {
            setUser(null);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const result = await usersAPI.getUserByAuthId(authId);
            if (result.success) {
                setUser(result.user || null);
            } else {
                setError(result.error || 'Failed to fetch user');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch user');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUser();
    }, [authId]);

    return { user, loading, error, refetch: fetchUser };
}

/**
 * Hook for user search
 */
export function useUserSearch() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const searchUsers = async (query: string) => {
        if (!query.trim()) {
            setUsers([]);
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const result = await usersAPI.searchUsers(query);
            if (result.success) {
                setUsers(result.data || []);
            } else {
                setError(result.error || 'Failed to search users');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to search users');
        } finally {
            setLoading(false);
        }
    };

    return { users, loading, error, searchUsers };
}

/**
 * Hook for user CRUD operations
 */
export function useUserMutations() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createUser = async (data: CreateUserRequest): Promise<UserResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await usersAPI.createUser(data);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const updateUser = async (id: string, data: UpdateUserRequest): Promise<UserResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await usersAPI.updateUser(id, data);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const updateUserByAuthId = async (authId: string, data: UpdateUserRequest): Promise<UserResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await usersAPI.updateUserByAuthId(authId, data);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const updateUserAsAdmin = async (userId: string, data: UpdateUserAsAdminRequest): Promise<UserResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await usersAPI.updateUserAsAdmin(userId, data);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const deleteUser = async (id: string): Promise<UserDeleteResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await usersAPI.deleteUser(id);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    return { createUser, updateUser, updateUserByAuthId, updateUserAsAdmin, deleteUser, loading, error };
}

/**
 * Hook for user avatar operations
 */
export function useUserAvatar() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const uploadAvatar = async (data: UploadAvatarRequest): Promise<UserResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await usersAPI.uploadUserAvatar(data);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to upload avatar';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    return { uploadAvatar, loading, error };
}

/**
 * Hook for user invitation operations
 */
export function useUserInvitations() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const sendInvitation = async (data: SendInvitationRequest): Promise<UserResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await usersAPI.sendUserInvitation(data);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to send invitation';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const resendInvitation = async (userId: string): Promise<UserResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await usersAPI.resendUserInvitation(userId);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to resend invitation';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    const revokeInvitation = async (userId: string): Promise<UserDeleteResponse> => {
        try {
            setLoading(true);
            setError(null);
            const result = await usersAPI.revokeUserInvitation(userId);
            return result;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to revoke invitation';
            setError(errorMessage);
            return { success: false, error: errorMessage };
        } finally {
            setLoading(false);
        }
    };

    return { sendInvitation, resendInvitation, revokeInvitation, loading, error };
}

/**
 * Hook for filtered users
 */
export function useFilteredUsers(users: User[], filters: {
    role?: string;
    status?: string;
    search?: string;
}) {
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

    useEffect(() => {
        let result = [...users];

        // Apply role filter
        if (filters.role) {
            result = userUtils.filterByRole(result, filters.role);
        }

        // Apply status filter
        if (filters.status) {
            result = userUtils.filterByStatus(result, filters.status);
        }

        // Apply search filter
        if (filters.search) {
            result = userUtils.searchUsers(result, filters.search);
        }

        setFilteredUsers(result);
    }, [users, filters.role, filters.status, filters.search]);

    return filteredUsers;
}

/**
 * Hook for user statistics
 */
export function useUserStats(users: User[]) {
    const [stats, setStats] = useState({
        total: 0,
        active: 0,
        invited: 0,
        admins: 0,
        managers: 0,
        members: 0,
    });

    useEffect(() => {
        setStats(userUtils.getUserStats(users));
    }, [users]);

    return stats;
}

/**
 * Hook for user dropdown options
 */
export function useUserDropdownOptions(users: User[], filters?: {
    role?: string;
    status?: string;
    includeInactive?: boolean;
}) {
    const [options, setOptions] = useState<{ value: string; label: string }[]>([]);

    useEffect(() => {
        let filteredUsers = [...users];

        // Apply filters
        if (filters?.role) {
            filteredUsers = userUtils.filterByRole(filteredUsers, filters.role);
        }

        if (filters?.status) {
            filteredUsers = userUtils.filterByStatus(filteredUsers, filters.status);
        } else if (!filters?.includeInactive) {
            // Default to active users only
            filteredUsers = userUtils.filterActive(filteredUsers);
        }

        // Sort by name
        filteredUsers = userUtils.sortByName(filteredUsers);

        // Convert to dropdown options
        setOptions(userUtils.getUsersForDropdown(filteredUsers));
    }, [users, filters?.role, filters?.status, filters?.includeInactive]);

    return options;
}

/**
 * Combined hook for complete user management
 */
export function useUserManager() {
    const { users, loading: usersLoading, error: usersError, refetch: refetchUsers } = useUsers();
    const { createUser, updateUser, updateUserByAuthId, updateUserAsAdmin, deleteUser, loading: mutationLoading, error: mutationError } = useUserMutations();
    const { uploadAvatar, loading: avatarLoading, error: avatarError } = useUserAvatar();
    const { sendInvitation, resendInvitation, revokeInvitation, loading: invitationLoading, error: invitationError } = useUserInvitations();
    const { searchUsers, loading: searchLoading, error: searchError } = useUserSearch();
    const stats = useUserStats(users);

    // Combined loading state
    const loading = usersLoading || mutationLoading || avatarLoading || invitationLoading || searchLoading;

    // Combined error state
    const error = usersError || mutationError || avatarError || invitationError || searchError;

    const createUserWithRefetch = async (data: CreateUserRequest) => {
        const result = await createUser(data);
        if (result.success) {
            refetchUsers();
        }
        return result;
    };

    const updateUserWithRefetch = async (id: string, data: UpdateUserRequest) => {
        const result = await updateUser(id, data);
        if (result.success) {
            refetchUsers();
        }
        return result;
    };

    const updateUserByAuthIdWithRefetch = async (authId: string, data: UpdateUserRequest) => {
        const result = await updateUserByAuthId(authId, data);
        if (result.success) {
            refetchUsers();
        }
        return result;
    };

    const updateUserAsAdminWithRefetch = async (userId: string, data: UpdateUserAsAdminRequest) => {
        const result = await updateUserAsAdmin(userId, data);
        if (result.success) {
            refetchUsers();
        }
        return result;
    };

    const deleteUserWithRefetch = async (id: string) => {
        const result = await deleteUser(id);
        if (result.success) {
            refetchUsers();
        }
        return result;
    };

    const uploadAvatarWithRefetch = async (data: UploadAvatarRequest) => {
        const result = await uploadAvatar(data);
        if (result.success) {
            refetchUsers();
        }
        return result;
    };

    const sendInvitationWithRefetch = async (data: SendInvitationRequest) => {
        const result = await sendInvitation(data);
        if (result.success) {
            refetchUsers();
        }
        return result;
    };

    const resendInvitationWithRefetch = async (userId: string) => {
        const result = await resendInvitation(userId);
        if (result.success) {
            refetchUsers();
        }
        return result;
    };

    const revokeInvitationWithRefetch = async (userId: string) => {
        const result = await revokeInvitation(userId);
        if (result.success) {
            refetchUsers();
        }
        return result;
    };

    return {
        // Data
        users,
        stats,

        // Loading and error states
        loading,
        error,

        // User operations
        createUser: createUserWithRefetch,
        updateUser: updateUserWithRefetch,
        updateUserByAuthId: updateUserByAuthIdWithRefetch,
        updateUserAsAdmin: updateUserAsAdminWithRefetch,
        deleteUser: deleteUserWithRefetch,

        // Avatar operations
        uploadAvatar: uploadAvatarWithRefetch,

        // Invitation operations
        sendInvitation: sendInvitationWithRefetch,
        resendInvitation: resendInvitationWithRefetch,
        revokeInvitation: revokeInvitationWithRefetch,

        // Search operations
        searchUsers,

        // Refresh
        refetchUsers,

        // Utility functions
        utils: userUtils,
    };
}
