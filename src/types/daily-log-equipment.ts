import type { Database } from "@/types/supabase";

export type DailyLogEquipment = Database["public"]["Tables"]["daily_log_equipment"]["Row"];
export type DailyLogEquipmentInsert = Database["public"]["Tables"]["daily_log_equipment"]["Insert"];
export type DailyLogEquipmentUpdate = Database["public"]["Tables"]["daily_log_equipment"]["Update"];