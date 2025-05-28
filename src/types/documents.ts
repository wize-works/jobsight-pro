import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type Document = Database["public"]["Tables"]["documents"]["Row"];
export type DocumentInsert = Database["public"]["Tables"]["documents"]["Insert"];
export type DocumentUpdate = Database["public"]["Tables"]["documents"]["Update"];

export type DocumentType = "report" | "invoice" | "contract" | "specification" | "other";
export type DocumentStatus = "draft" | "review" | "approved" | "rejected" | "archived";

export const documentTyppeOptions = createOptions<DocumentType>({
    report: { label: "Report", badge: "badge-primary" },
    invoice: { label: "Invoice", badge: "badge-secondary" },
    contract: { label: "Contract", badge: "badge-success" },
    specification: { label: "Specification", badge: "badge-info" },
    other: { label: "Other", badge: "badge-neutral" }
});

export const documentStatusOptions = createOptions<DocumentStatus>({
    draft: { label: "Draft", badge: "badge-warning" },
    review: { label: "Review", badge: "badge-info" },
    approved: { label: "Approved", badge: "badge-success" },
    rejected: { label: "Rejected", badge: "badge-error" },
    archived: { label: "Archived", badge: "badge-secondary" }
});