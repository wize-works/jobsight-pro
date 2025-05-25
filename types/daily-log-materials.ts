import type { Database } from "@/types/supabase";

export type DailyLogMaterials = Database["public"]["Tables"]["daily_log_materials"]["Row"];
export type DailyLogMaterialsInsert = Database["public"]["Tables"]["daily_log_materials"]["Insert"];
export type DailyLogMaterialsUpdate = Database["public"]["Tables"]["daily_log_materials"]["Update"];