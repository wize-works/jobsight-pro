import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type MediaLink = Database["public"]["Tables"]["media_links"]["Row"];
export type MediaLinkInsert = Database["public"]["Tables"]["media_links"]["Insert"];
export type MediaLinkUpdate = Database["public"]["Tables"]["media_links"]["Update"];

export type MediaLinkType = "daily_log" | "equipment_assignment" | "project" | "crew" | "task" | "user" | "business";

export const mediaLinkTypeOptions = createOptions<MediaLinkType>({
    daily_log: { label: "Daily Log", badge: "badge-primary" },
    equipment_assignment: { label: "Equipment Assignment", badge: "badge-secondary" },
    project: { label: "Project", badge: "badge-info" },
    crew: { label: "Crew", badge: "badge-warning" },
    task: { label: "Task", badge: "badge-error" },
    user: { label: "User", badge: "badge-neutral" },
    business: { label: "Business", badge: "badge-light" }
});