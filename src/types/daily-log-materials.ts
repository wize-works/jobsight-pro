import type { Database } from "@/types/supabase";

export type DailyLogMaterial = Database["public"]["Tables"]["daily_log_materials"]["Row"];
export type DailyLogMaterialInsert = Database["public"]["Tables"]["daily_log_materials"]["Insert"];
export type DailyLogMaterialUpdate = Database["public"]["Tables"]["daily_log_materials"]["Update"];

export type DailyLogMaterialWithDetails = DailyLogMaterial & {
    daily_log: {
        id: string;
        date: string;
        project_id: string;
        crew_id: string | null;
        weather: string | null;
        notes: string | null;
    };
    material: {
        id: string;
        name: string;
        unit: string | null;
        quantity: number | null;
        cost_per_unit: number | null;
    };
};