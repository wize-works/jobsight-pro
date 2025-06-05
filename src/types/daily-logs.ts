import type { Database } from "@/types/supabase";

export type DailyLog = Database["public"]["Tables"]["daily_logs"]["Row"];
export type DailyLogInsert = Database["public"]["Tables"]["daily_logs"]["Insert"];
export type DailyLogUpdate = Database["public"]["Tables"]["daily_logs"]["Update"];

export type DailyLogWithDetails = DailyLog & {
    client: {
        id: string;
        name: string | null;
        contact_name: string | null;
        contact_email: string | null;
        contact_phone: string | null;
    };
    project: {
        id: string;
        name: string;
        description: string | null;
    };
    crew: {
        id: string;
        name: string | null;
    } | null;
    equipment: {
        id: string;
        name: string | null;
        hours: number | null;
    }[];
    materials: {
        id: string;
        name: string | null;
        quantity: number | null;
        cost: number;
        supplier: string | null;
    }[];
};