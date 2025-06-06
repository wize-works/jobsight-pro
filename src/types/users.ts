import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export type UserRole = "admin" | "manager" | "member";
export type UserStatus = "active" | "invited" | "suspended";

export const userRoleOptions = createOptions<UserRole>({
    admin: { label: "Admin", badge: "badge-primary" },
    manager: { label: "Manager", badge: "badge-secondary" },
    member: { label: "Member", badge: "badge-info" }
});

export const userStatusOptions = createOptions<UserStatus>({
    active: { label: "Active", badge: "badge-success" },
    invited: { label: "Invited", badge: "badge-warning" },
    suspended: { label: "Suspended", badge: "badge-error" }
});