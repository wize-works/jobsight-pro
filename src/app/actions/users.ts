"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { User, UserInsert, UserUpdate } from "@/types/users";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getUsers = async (): Promise<User[]> => {
    try {
        const { business } = await withBusinessServer();

        const { data, error } = await fetchByBusiness("users", business.id);

        if (error) {
            console.error("Error fetching users:", error);
            return [];
        }

        if (!data || data.length === 0) {
            return [] as User[];
        }

        return data as unknown as User[];
    } catch (err) {
        console.error("Error in getUsers:", err);
        return [];
    }
}

export const getUserById = async (id: string): Promise<User | null> => {
    try {
        const { business } = await withBusinessServer();

        const { data, error } = await fetchByBusiness("users", business.id, "*", {
            filter: { auth_id: id },
        }
        );

        if (error) {
            console.error("Error fetching user by ID:", error);
            return null;
        }

        if (data && data[0]) {
            return data[0] as unknown as User;
        }

        return null;
    } catch (err) {
        console.error("Error in getUserById:", err);
        return null;
    }
};

export const createUser = async (user: UserInsert): Promise<User | null> => {
    try {
        const { business } = await withBusinessServer();

        user = await applyCreated<UserInsert>(user);

        const { data, error } = await insertWithBusiness("users", user, business.id);

        if (error) {
            console.error("Error creating user:", error);
            return null;
        }

        return data as unknown as User;
    } catch (err) {
        console.error("Error in createUser:", err);
        return null;
    }
}

export const updateUser = async (id: string, user: UserUpdate): Promise<User | null> => {
    try {
        const { business } = await withBusinessServer();

        user = await applyUpdated<UserUpdate>(user);

        const { data, error } = await updateWithBusinessCheck("users", id, user, business.id);

        if (error) {
            console.error("Error updating user:", error);
            return null;
        }

        return data as unknown as User;
    } catch (err) {
        console.error("Error in updateUser:", err);
        return null;
    }
}

export const deleteUser = async (id: string): Promise<boolean> => {
    try {
        const { business } = await withBusinessServer();

        const { error } = await deleteWithBusinessCheck("users", id, business.id);

        if (error) {
            console.error("Error deleting user:", error);
            return false;
        }

        return true;
    } catch (err) {
        console.error("Error in deleteUser:", err);
        return false;
    }
}

export const searchUsers = async (query: string): Promise<User[]> => {
    try {
        const { business } = await withBusinessServer();

        const { data, error } = await fetchByBusiness("users", business.id, "*", {
            filter: {
                or: [
                    { name: { ilike: `%${query}%` } },
                    { description: { ilike: `%${query}%` } },
                ],
            },
            orderBy: { column: "email", ascending: true },
        });

        if (error) {
            console.error("Error searching users:", error);
            return [];
        }

        return data as unknown as User[];
    } catch (err) {
        console.error("Error in searchUsers:", err);
        return [];
    }
};
