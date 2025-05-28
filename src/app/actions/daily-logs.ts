"use server";

import { fetchByBusiness, deleteWithBusinessCheck, updateWithBusinessCheck, insertWithBusiness } from "@/lib/db";
import { DailyLog, DailyLogInsert, DailyLogUpdate } from "@/types/daily-logs";
import { getUserBusiness } from "@/app/actions/business";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { withBusinessServer } from "@/lib/auth/with-business-server";
import { applyCreated } from "@/utils/apply-created";
import { applyUpdated } from "@/utils/apply-updated";

export const getDailyLogs = async (): Promise<DailyLog[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("daily_logs", business.id);

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
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("daily_logs", business.id, id);

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
    const { business } = await withBusinessServer();

    log = await applyCreated<DailyLogInsert>(log);

    const { data, error } = await insertWithBusiness("daily_logs", log, business.id);

    if (error) {
        console.error("Error creating daily log:", error);
        return null;
    }

    return data as unknown as DailyLog;
}

export const updateDailyLog = async (id: string, log: DailyLogUpdate): Promise<DailyLog | null> => {
    const { business } = await withBusinessServer();

    log = await applyUpdated<DailyLogUpdate>(log);

    const { data, error } = await updateWithBusinessCheck("daily_logs", id, log, business.id);

    if (error) {
        console.error("Error updating daily log:", error);
        return null;
    }

    return data as unknown as DailyLog;
}

export const deleteDailyLog = async (id: string): Promise<boolean> => {
    const { business } = await withBusinessServer();

    const { error } = await deleteWithBusinessCheck("daily_logs", id, business.id);

    if (error) {
        console.error("Error deleting daily log:", error);
        return false;
    }

    return true;
}

export const searchDailyLogs = async (query: string): Promise<DailyLog[]> => {
    const { business } = await withBusinessServer();

    const { data, error } = await fetchByBusiness("daily_logs", business.id, "*", {
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
