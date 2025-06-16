"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { User, UserInsert, UserUpdate } from "@/types/users";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";
import { createServerClient } from "@/lib/supabase";


export const getUsers = async (businessId: string): Promise<User[]> => {
    try {


        if (!businessId) {
            console.error("No business found or business ID is missing");
            return [];
        }

        const { data, error } = await fetchByBusiness("users", businessId);

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

export const getUserById = async (businessId: string, id: string): Promise<User | null> => {
    try {


        const { data, error } = await fetchByBusiness("users", businessId, "*", {
            filter: { auth_id: id },  // this should be moved to the correct field in the future, but for now we use auth_id
        }
        );

        if (error) {
            console.error("Error fetching user by ID:", error, id, businessId);
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

export const getUserByAuthId = async (businessId: string, authId: string): Promise<User | null> => {
    try {


        const { data, error } = await fetchByBusiness("users", businessId, "*", {
            filter: { auth_id: authId },
        });

        if (error) {
            console.error("Error fetching user by auth_id:", error);
            return null;
        }

        if (data && data[0]) {
            return data[0] as unknown as User;
        }

        return null;
    } catch (err) {
        console.error("Error in getUserByAuthId:", err);
        return null;
    }
};

export const getSelfByAuthId = async (authId: string): Promise<User | null> => {
    try {
        const supabase = createServerClient();
        if (!supabase) {
            throw new Error("Supabase client is not initialized");
        }

        const { data, error } = await supabase.from("users").select("*").eq("auth_id", authId).single<User>();


        if (error) {
            console.error("Error fetching self by auth_id:", error);
            return null;
        }

        if (data) {
            return data;
        }

        return null;
    } catch (err) {
        console.error("Error in getSelfByAuthId:", err);
        return null;
    }
};

export const createUser = async (businessId: string, user: UserInsert): Promise<User | null> => {
    try {


        user = await applyCreated<UserInsert>(user);

        const { data, error } = await insertWithBusiness("users", user, businessId);

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

export const createSelf = async (user: UserInsert): Promise<User | null> => {
    try {
        const supabase = createServerClient();
        if (!supabase) {
            throw new Error("Supabase client is not initialized");
        }

        const { data, error } = await supabase.from("users").insert(user).select("*").single<User>();

        if (error) {
            console.error("Error creating self user:", error);
            return null;
        }

        return data;
    } catch (err) {
        console.error("Error in createSelf:", err);
        return null;
    }
}

export const updateUser = async (businessId: string, id: string, user: UserUpdate): Promise<User | null> => {
    try {


        user = await applyUpdated<UserUpdate>(user);

        const { data, error } = await updateWithBusinessCheck("users", id, user, businessId);

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

export const updateUserByAuthId = async (businessId: string, authId: string, user: UserUpdate): Promise<User | null> => {
    try {


        // First get the user by auth_id to get their database ID
        const currentUser = await getUserById(businessId, authId);
        if (!currentUser) {
            console.error("User not found with auth_id:", authId);
            return null;
        }

        // Now update using the database ID
        return await updateUser(businessId, currentUser.id, user);
    } catch (err) {
        console.error("Error in updateUserByAuthId:", err);
        return null;
    }
}

export const deleteUser = async (businessId: string, id: string): Promise<boolean> => {
    try {


        const { error } = await deleteWithBusinessCheck("users", id, businessId);

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

export const searchUsers = async (businessId: string, query: string): Promise<User[]> => {
    try {


        const { data, error } = await fetchByBusiness("users", businessId, "*", {
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

export const assignBusinessToSelf = async (userId: string, businessId: string): Promise<User | null> => {
    try {
        const supabase = createServerClient();
        if (!supabase) {
            throw new Error("Supabase client is not initialized");
        }

        const { data, error } = await supabase
            .from("users")
            .update({ business_id: businessId })
            .eq("auth_id", userId)
            .select("*")
            .single<User>();

        if (error) {
            console.error("Error assigning business to self:", error);
            return null;
        }

        return data;
    } catch (err) {
        console.error("Error in assignBusinessToSelf:", err);
        return null;
    }
}