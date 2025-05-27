import type { Database } from "@/types/supabase";

export type DailyLogMaterial = Database["public"]["Tables"]["daily_log_materials"]["Row"];
export type DailyLogMaterialInsert = Database["public"]["Tables"]["daily_log_materials"]["Insert"];
export type DailyLogMaterialUpdate = Database["public"]["Tables"]["daily_log_materials"]["Update"];