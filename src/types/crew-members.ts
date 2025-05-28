import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type CrewMember = Database["public"]["Tables"]["crew_members"]["Row"];
export type CrewMemberInsert = Database["public"]["Tables"]["crew_members"]["Insert"];
export type CrewMemberUpdate = Database["public"]["Tables"]["crew_members"]["Update"];

export type CrewMemberStatus = "active" | "inactive" | "on_leave" | "terminated";

export type CrewMemberRole = "foreman" | "operator" | "laborer" | "mechanic" | "admin";

export const crewMemberStatusOptions = createOptions<CrewMemberStatus>({
    active: { label: "Active", badge: "badge-success" },
    inactive: { label: "Inactive", badge: "badge-secondary" },
    on_leave: { label: "On Leave", badge: "badge-warning" },
    terminated: { label: "Terminated", badge: "badge-error" },
});

export const crewMemberRoleOptions = createOptions<CrewMemberRole>({
    foreman: { label: "Foreman", badge: "badge-primary" },
    operator: { label: "Operator", badge: "badge-secondary" },
    laborer: { label: "Laborer", badge: "badge-success" },
    mechanic: { label: "Mechanic", badge: "badge-warning" },
    admin: { label: "Admin", badge: "badge-info" },
});