import type { Database } from "@/types/supabase";

export type DailyLogImage = Database["public"]["Tables"]["daily_log_images"]["Row"];
export type DailyLogImageInsert = Database["public"]["Tables"]["daily_log_equipment"]["Insert"];
export type DailyLogImageUpdate = Database["public"]["Tables"]["daily_log_equipment"]["Update"];