import type { Database } from "@/types/supabase";

export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
export type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];

export type ClientWithStats = Client & {

    total_projects?: number;
    active_projects?: number;
    total_budget?: number;
}

export type ClientStatus = "active" | "inactive" | "prospect" | "archived";
export type ClientType = "individual" | "business" | "nonprofit" | "government" | "other";