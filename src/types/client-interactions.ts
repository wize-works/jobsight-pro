import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type ClientInteraction = Database["public"]["Tables"]["client_interactions"]["Row"];
export type ClientInteractionInsert = Database["public"]["Tables"]["client_interactions"]["Insert"];
export type ClientInteractionUpdate = Database["public"]["Tables"]["client_interactions"]["Update"];

export type ClientInteractionType = "call" | "email" | "meeting" | "note" | "task" | "other";

export const clientInteractionTypeOptions = createOptions<ClientInteractionType>({
    "call": { label: "Call", badge: "badge-primary" },
    "email": { label: "Email", badge: "badge-secondary" },
    "meeting": { label: "Meeting", badge: "badge-success" },
    "note": { label: "Note", badge: "badge-info" },
    "task": { label: "Task", badge: "badge-warning" },
    "other": { label: "Other", badge: "badge-neutral" }
});