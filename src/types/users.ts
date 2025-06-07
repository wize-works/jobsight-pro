import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

// Helper function to get full name from user
export function getUserFullName(user: { first_name?: string | null; last_name?: string | null }): string {
    if (!user.first_name && !user.last_name) return '';
    return `${user.first_name || ''} ${user.last_name || ''}`.trim();
}

export type UserRole = "admin" | "manager" | "member";
export type UserStatus = "active" | "invited" | "inactive" | "revoked" | "email_failed" | "suspended";

export const userRoleOptions = createOptions<UserRole>({
    admin: { label: "Admin", badge: "badge-primary" },
    manager: { label: "Manager", badge: "badge-secondary" },
    member: { label: "Member", badge: "badge-info" }
});

export const userStatusOptions = createOptions<UserStatus>({
    active: { label: "Active", badge: "badge-success" },
    invited: { label: "Invited", badge: "badge-warning" },
    suspended: { label: "Suspended", badge: "badge-error" },
    inactive: { label: "Inactive", badge: "badge-secondary" },
    revoked: { label: "Revoked", badge: "badge-error" },
    email_failed: { label: "Email Failed", badge: "badge-error" }
});
