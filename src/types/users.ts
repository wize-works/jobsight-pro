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

export interface User {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
    auth_id: string | null;
    role: "admin" | "manager" | "member";
    status: "active" | "invited" | "inactive" | "revoked" | "email_failed";
    email_verified: boolean;
    business_id: string;
    created_at: string;
    updated_at: string;
}