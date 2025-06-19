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

export type ClientStatus = "all" | "active" | "inactive" | "prospect" | "archived";
export type ClientType = "all" | "commercial" | "residential" | "government" | "education" | "healthcare" | "nonprofit" | "other";
export type ClientIndustry = "all" | "construction" | "real_estate" | "manufacturing" | "retail" | "technology" | "finance" | "healthcare" | "education" | "government" | "nonprofit" | "other";

export const clientStatusOptions = createOptions<ClientStatus>({
    "all": { label: "Any Status", badge: "badge-neutral" },
    "active": { label: "Active", badge: "badge-success" },
    "inactive": { label: "Inactive", badge: "badge-secondary" },
    "prospect": { label: "Prospect", badge: "badge-info" },
    "archived": { label: "Archived", badge: "badge-error" }
});

export const clientTypeOptions = createOptions<ClientType>({
    "all": { label: "All Types", badge: "badge-neutral" },
    "commercial": { label: "Commercial", badge: "badge-primary" },
    "residential": { label: "Residential", badge: "badge-secondary" },
    "government": { label: "Government", badge: "badge-info" },
    "education": { label: "Education", badge: "badge-warning" },
    "healthcare": { label: "Healthcare", badge: "badge-success" },
    "nonprofit": { label: "Nonprofit", badge: "badge-neutral" },
    "other": { label: "Other", badge: "badge-light" }
});

export const clientIndustryOptions = createOptions<ClientIndustry>({
    "all": { label: "All Industries", badge: "badge-neutral" },
    "construction": { label: "Construction", badge: "badge-primary" },
    "real_estate": { label: "Real Estate", badge: "badge-secondary" },
    "manufacturing": { label: "Manufacturing", badge: "badge-info" },
    "retail": { label: "Retail", badge: "badge-warning" },
    "technology": { label: "Technology", badge: "badge-success" },
    "finance": { label: "Finance", badge: "badge-neutral" },
    "healthcare": { label: "Healthcare", badge: "badge-light" },
    "education": { label: "Education", badge: "badge-accent" },
    "government": { label: "Government", badge: "badge-error" },
    "nonprofit": { label: "Nonprofit", badge: "badge-dark" },
    "other": { label: "Other", badge: "badge-base-300" }
});