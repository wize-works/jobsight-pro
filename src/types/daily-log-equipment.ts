import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type DailyLogEquipment = Database["public"]["Tables"]["daily_log_equipment"]["Row"];
export type DailyLogEquipmentInsert = Database["public"]["Tables"]["daily_log_equipment"]["Insert"];
export type DailyLogEquipmentUpdate = Database["public"]["Tables"]["daily_log_equipment"]["Update"];

export type DailyLogEquipmentCondition = "new" | "good" | "fair" | "poor" | "damaged";

export const dailyLogEquipmetnConditionOptions = createOptions<DailyLogEquipmentCondition>({
    new: { label: "New", badge: "badge-success" },
    good: { label: "Good", badge: "badge-primary" },
    fair: { label: "Fair", badge: "badge-warning" },
    poor: { label: "Poor", badge: "badge-error" },
    damaged: { label: "Damaged", badge: "badge-secondary" }
});