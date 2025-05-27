import type { Database } from "@/types/supabase";

export type DailyLog = Database["public"]["Tables"]["daily_logs"]["Row"];
export type DailyLogInsert = Database["public"]["Tables"]["daily_logs"]["Insert"];
export type DailyLogUpdate = Database["public"]["Tables"]["daily_logs"]["Update"];