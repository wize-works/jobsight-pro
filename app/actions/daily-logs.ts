"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { DailyLog, DailyLogInsert, DailyLogUpdate } from "@/types/daily-logs";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";

export const getDailyLogs = async (): Promise<DailyLog[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch daily logs.");
        return [];
    }

    const { data, error } = await fetchByBusiness("daily_logs", businessId);

    if (error) {
        console.error("Error fetching daily logs:", error);
        return [];
    }

    if (!data || data.length === 0) {
        return [] as DailyLog[];
    }

    return data as unknown as DailyLog[];
}

export const getDailyLogById = async (id: string): Promise<DailyLog | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to fetch daily logs.");
        return null;
    }

    const { data, error } = await fetchByBusiness("daily_logs", businessId, id);

    if (error) {
        console.error("Error fetching daily log by ID:", error);
        return null;
    }

    if (data && data[0]) {
        return data[0] as unknown as DailyLog;
    }

    return null;
};

export const createDailyLog = async (log: DailyLogInsert): Promise<DailyLog | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to create a daily log.");
        return null;
    }

    const { data, error } = await insertWithBusiness("daily_logs", log, businessId);

    if (error) {
        console.error("Error creating daily log:", error);
        return null;
    }

    return data as unknown as DailyLog;
}

export const updateDailyLog = async (id: string, log: DailyLogUpdate): Promise<DailyLog | null> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to update a daily log.");
        return null;
    }

    const { data, error } = await updateWithBusinessCheck("daily_logs", id, log, businessId);

    if (error) {
        console.error("Error updating daily log:", error);
        return null;
    }

    return data as unknown as DailyLog;
}

export const deleteDailyLog = async (id: string): Promise<boolean> => {
    const kindeSession = await getKindeServerSession();
    const user = await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to delete a daily log.");
        return false;
    }

    const { error } = await deleteWithBusinessCheck("daily_logs", id, businessId);

    if (error) {
        console.error("Error deleting daily log:", error);
        return false;
    }

    return true;
}

export const searchDailyLogs = async (query: string): Promise<DailyLog[]> => {
    const kindeSession = await getKindeServerSession();
    const user = await await kindeSession.getUser();
    const business = await getUserBusiness(user?.id || "");
    const businessId = business?.id || "";

    if (!businessId) {
        console.error("Business ID is required to search daily logs.");
        return [];
    }

    const { data, error } = await fetchByBusiness("daily_logs", businessId, "*", {
        filter: {
            or: [
                { notes: { ilike: `%${query}%` } },
                { weather: { ilike: `%${query}%` } },
            ],
        },
        orderBy: { column: "id", ascending: true },
    });

    if (error) {
        console.error("Error searching daily logs:", error);
        return [];
    }

    return data as unknown as DailyLog[];
};
