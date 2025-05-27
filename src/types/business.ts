import { Database } from "@/types/supabase";

export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type BusinessUpdate = Database["public"]["Tables"]["businesses"]["Update"];
export type BusinessInsert = Database["public"]["Tables"]["businesses"]["Insert"];