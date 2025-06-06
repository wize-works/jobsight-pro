"use server"
import { createBusiness } from "@/app/actions/business"

type CreateBusinessParams = {
    userId: string // This should be the database UUID, not the Kinde ID
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

// Re-export the createBusiness function to maintain compatibility
export { createBusiness }

// The original createBusiness function can be kept as is or modified if needed
// For now, it's being re-exported from "@/app/actions/business"
