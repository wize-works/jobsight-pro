import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type Media = Database["public"]["Tables"]["media"]["Row"];
export type MediaInsert = Database["public"]["Tables"]["media"]["Insert"];
export type MediaUpdate = Database["public"]["Tables"]["media"]["Update"];

export type MediaType = "images" | "videos" | "audios" | "files" | "documents";

export const mediaTypeOptions = createOptions<MediaType>({
    images: { label: "Image", badge: "badge-primary" },
    videos: { label: "Video", badge: "badge-secondary" },
    audios: { label: "Audio", badge: "badge-success" },
    files: { label: "File", badge: "badge-warning" },
    documents: { label: "Document", badge: "badge-info" }
});