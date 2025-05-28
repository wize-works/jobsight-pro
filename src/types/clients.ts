import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

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

export const clientStatusOptions = createOptions<ClientStatus>({
    "active": { label: "Active", badge: "badge-success" },
    "inactive": { label: "Inactive", badge: "badge-secondary" },
    "prospect": { label: "Prospect", badge: "badge-info" },
    "archived": { label: "Archived", badge: "badge-error" }
});

export const clientTypeOptions = createOptions<ClientType>({
    "individual": { label: "Individual", badge: "badge-primary" },
    "business": { label: "Business", badge: "badge-secondary" },
    "nonprofit": { label: "Nonprofit", badge: "badge-success" },
    "government": { label: "Government", badge: "badge-warning" },
    "other": { label: "Other", badge: "badge-neutral" }
});