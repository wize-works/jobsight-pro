import type { Database } from "@/types/supabase";

export type ClientContact = Database["public"]["Tables"]["client_contacts"]["Row"];
export type ClientContactInsert = Database["public"]["Tables"]["client_contacts"]["Insert"];
export type ClientContactUpdate = Database["public"]["Tables"]["client_contacts"]["Update"];