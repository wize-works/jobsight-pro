import type { Database } from "@/types/supabase";

export type MediaLink = Database["public"]["Tables"]["media_links"]["Row"];
export type MediaLinkInsert = Database["public"]["Tables"]["media_links"]["Insert"];
export type MediaLinkUpdate = Database["public"]["Tables"]["media_links"]["Update"];