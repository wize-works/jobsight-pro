import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type Media = Database["public"]["Tables"]["media"]["Row"];
export type MediaInsert = Database["public"]["Tables"]["media"]["Insert"];
export type MediaUpdate = Database["public"]["Tables"]["media"]["Update"];

export type MediaType = "image" | "video" | "audio" | "document";

export const mediaTypeOptions = createOptions<MediaType>({
    image: { label: "Image", badge: "badge-primary" },
    video: { label: "Video", badge: "badge-secondary" },
    audio: { label: "Audio", badge: "badge-success" },
    document: { label: "Document", badge: "badge-info" }
});