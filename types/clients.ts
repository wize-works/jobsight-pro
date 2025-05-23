import type { Database } from "@/types/supabase";

export type Client = Database["public"]["Tables"]["clients"]["Row"];
export type ClientInsert = Database["public"]["Tables"]["clients"]["Insert"];
export type ClientUpdate = Database["public"]["Tables"]["clients"]["Update"];

export type ClientInteraction = Database["public"]["Tables"]["client_interactions"]["Row"];
export type ClientInteractionInsert = Database["public"]["Tables"]["client_interactions"]["Insert"];
export type ClientInteractionUpdate = Database["public"]["Tables"]["client_interactions"]["Update"];

export type ClientContact = Database["public"]["Tables"]["client_contacts"]["Row"];
export type ClientContactInsert = Database["public"]["Tables"]["client_contacts"]["Insert"];
export type ClientContactUpdate = Database["public"]["Tables"]["client_contacts"]["Update"];

export type ClientWithStats = Client & {

    total_projects?: number;
    active_projects?: number;
    total_budget?: number;
}