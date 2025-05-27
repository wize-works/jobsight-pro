import { Database } from "@/types/supabase";

export type Business = Database["public"]["Tables"]["businesses"]["Row"];
export type BusinessUpdate = Database["public"]["Tables"]["businesses"]["Update"];
export type BusinessInsert = Database["public"]["Tables"]["businesses"]["Insert"];

export type CreateBusinessParams = {
    userId: string
    businessName: string
    businessType: string
    phoneNumber?: string
    website?: string
    address?: string
    city?: string
    state?: string
    zipCode?: string
    country?: string
    email?: string
}