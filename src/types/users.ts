import type { Database } from "@/types/supabase";
import { createOptions } from "@/utils/options";

export type User = Database["public"]["Tables"]["users"]["Row"];
export type UserInsert = Database["public"]["Tables"]["users"]["Insert"];
export type UserUpdate = Database["public"]["Tables"]["users"]["Update"];

export type UserRole = "admin" | "manager" | "member";

export const userRoleOptions = createOptions<UserRole>({
    admin: { label: "Admin", badge: "badge-primary" },
    manager: { label: "Manager", badge: "badge-secondary" },
    member: { label: "Member", badge: "badge-info" }
});