"use server"

import { createServerClient } from "@/lib/supabase"
import { v4 as uuidv4 } from "uuid"
import { revalidatePath } from "next/cache"
import { CreateBusinessParams } from "@/types/business"


export async function createBusiness(params: CreateBusinessParams) {
    const supabase = createServerClient()
    if (!supabase) {
        throw new Error("Supabase client not initialized")
    }

    const { userId, businessName, businessType, phoneNumber, website, address, city, state, zipCode, country, email } =
        params

    try {
        // Create a new business
        const businessId = uuidv4()
        const now = new Date().toISOString()

        // Insert the business with the correct column names
        const { error: businessError } = await supabase.from("businesses").insert({
            id: businessId,
            name: businessName,
            business_type: businessType || "General Contractor",
            address: address || null,
            city: city || null,
            state: state || null,
            zip: zipCode || null,
            country: country || null,
            phone: phoneNumber || null,
            email: email || null,
            website: website || null,
            owner_id: userId, // Use ownerId if provided, otherwise use userId
            created_at: now,
            updated_at: now,
            created_by: userId,
            updated_by: userId,
        })

        if (businessError) {
            console.error("Error creating business:", businessError)
            throw new Error(`Failed to create business: ${businessError.message}`)
        }

        // Try to update existing user, or create new one if doesn't exist
        const { data: existingUser, error: getUserError } = await supabase
            .from("users")
            .select("id, business_id")
            .eq("auth_id", userId)
            .single()

        if (getUserError && getUserError.code === 'PGRST116') {
            // User doesn't exist, create new user
            console.log("Creating new user record for:", userId)
            const { error: createUserError } = await supabase
                .from("users")
                .insert({
                    auth_id: userId,
                    business_id: businessId,
                    email: email || null,
                    created_at: now,
                    updated_at: now,
                    created_by: userId,
                    updated_by: userId,
                })

            if (createUserError) {
                console.error("Error creating user:", createUserError)
                return {
                    success: false,
                    error: "Failed to create user record"
                }
            }
        } else if (getUserError) {
            console.error("Error checking existing user:", getUserError)
            return {
                success: false,
                error: "Failed to check user record"
            }
        } else {
            // User exists, check if they already have a business
            if (existingUser.business_id) {
                console.log("User already has a business:", existingUser.business_id)
                return {
                    success: false,
                    error: "User already has a business associated"
                }
            }

            // User exists but has no business, update with business ID
            console.log("Updating existing user with new business ID")
            const { error: userError } = await supabase
                .from("users")
                .update({ business_id: businessId, updated_at: now })
                .eq("auth_id", userId)

            if (userError) {
                console.error("Error updating user with business ID:", userError)
                return {
                    success: false,
                    error: "Failed to update user record"
                }
            }
        }

        revalidatePath("/dashboard")
        return { success: true, businessId }
    } catch (error) {
        console.error("Error in createBusiness:", error)
        throw error
    }
}

export async function getBusinessById(businessId: string) {
    const supabase = createServerClient()
    if (!supabase) {
        throw new Error("Supabase client not initialized")
    }

    try {
        const { data, error } = await supabase.from("businesses").select("*").eq("id", businessId).single()

        if (error) {
            throw new Error(`Failed to fetch business: ${error.message}`)
        }

        return data
    } catch (error) {
        console.error("Error in getBusinessById:", error)
        throw error
    }
}

export async function getUserBusiness(userId: string) {
    const supabase = createServerClient()
    if (!supabase) {
        throw new Error("Supabase client not initialized")
    }

    try {
        // First get the user to find their business_id
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", userId)
            .single()

        if (userError) {
            return {
                success: false,
                redirect: "/",
                error: "Invalid user credentials. Please log in again."
            }
        }


        if (!userData?.business_id) {
            return null // User doesn't have a business yet
        }

        // Now get the business details
        const { data: businessData, error: businessError } = await supabase
            .from("businesses")
            .select("*")
            .eq("id", userData.business_id)
            .single()

        if (businessError) {
            throw new Error(`Failed to fetch business: ${businessError.message}`)
        }

        return businessData
    } catch (error) {
        throw error
    }
}

export async function updateBusiness(businessId: string, userId: string, data: Partial<CreateBusinessParams>) {
    const supabase = createServerClient()
    if (!supabase) {
        throw new Error("Supabase client not initialized")
    }

    try {
        const now = new Date().toISOString()

        // Map the data to the correct column names
        const businessData = {
            name: data.businessName,
            business_type: data.businessType,
            phone: data.phoneNumber,
            website: data.website,
            address: data.address,
            city: data.city,
            state: data.state,
            zip: data.zipCode,
            country: data.country,
            email: data.email,
            updated_at: now,
            updated_by: userId,
        }

        // Remove undefined values
        //Object.keys(businessData).forEach((key) => businessData[key] === undefined && delete businessData[key])

        const { error } = await supabase.from("businesses").update(businessData).eq("id", businessId)

        if (error) {
            throw new Error(`Failed to update business: ${error.message}`)
        }

        revalidatePath("/dashboard")
        revalidatePath("/dashboard/business")
        return { success: true }
    } catch (error) {
        console.error("Error in updateBusiness:", error)
        throw error
    }
}

// New action to directly update business data from form
export async function updateBusinessFromForm(formData: FormData) {
    const supabase = createServerClient()
    if (!supabase) {
        throw new Error("Supabase client not initialized")
    }

    try {
        // Get business ID from form data or session
        const businessId = formData.get("id") as string
        if (!businessId) {
            throw new Error("Business ID is required")
        }

        // Convert form data to object
        const data: Record<string, any> = {}
        formData.forEach((value, key) => {
            if (key !== "id") {
                data[key] = value
            }
        })

        // Add updated_at timestamp
        const now = new Date().toISOString()
        data.updated_at = now

        const { error } = await supabase.from("businesses").update(data).eq("id", businessId)

        if (error) {
            throw new Error(`Failed to update business: ${error.message}`)
        }

        revalidatePath("/dashboard")
        revalidatePath("/dashboard/business")
        return { success: true }
    } catch (error) {
        console.error("Error in updateBusinessFromForm:", error)
        return { success: false, error: error instanceof Error ? error.message : "Unknown error" }
    }
}

export async function checkUserBusinessStatus(userId: string) {
    const supabase = createServerClient()
    if (!supabase) {
        throw new Error("Supabase client not initialized")
    }

    try {
        // Check if user exists and has a business
        const { data: userData, error: userError } = await supabase
            .from("users")
            .select("business_id")
            .eq("auth_id", userId)
            .single()

        if (userError && userError.code !== 'PGRST116') {
            console.error("Error checking user business:", userError)
            return { success: false, error: "Database error" }
        }

        const hasBusiness = userData?.business_id ? true : false

        return {
            success: true,
            hasBusiness,
            businessId: userData?.business_id || null
        }

    } catch (error) {
        console.error("Error in checkUserBusinessStatus:", error)
        return { success: false, error: "Internal server error" }
    }
}

export async function checkBusinessStatus(userId: string) {
    const supabase = createServerClient()
    if (!supabase) {
        throw new Error("Supabase client not initialized")
    }

    try {
        // Check if user exists and has a business
        const { data, error } = await supabase
            .from("businesses")
            .select(`
                *,
                business_subscriptions (
                    *
                )
            `)
            .eq("owner_id", userId)
            .single()

        if (error && error.code !== 'PGRST116') {
            console.error("Error checking user business:", error)
            return { success: false, error: "Database error" }
        }



        const hasSubscription = data?.business_subscriptions.subscription_id ? true : false

        const hasBusiness = data?.id ? true : false

        return {
            success: true,
            hasBusiness,
            hasSubscription,
            businessId: data?.id || null
        }

    } catch (error) {
        console.error("Error in checkBusinessStatus:", error)
        return { success: false, error: "Internal server error" }
    }
}

export async function assignSubscriptionToBusiness(
    userId: string,
    businessId: string,
    subscriptionId: string
) {
    const supabase = createServerClient()
    if (!supabase) {
        throw new Error("Supabase client not initialized")
    }

    try {
        const now = new Date().toISOString()

        // Insert or update the business subscription
        const { error } = await supabase.from("business_subscriptions").upsert({
            business_id: businessId,
            plan_id: subscriptionId,
            status: "incomplete",
            created_at: now,
            updated_at: now,
            created_by: userId,
            updated_by: userId,
        })

        if (error) {
            console.error("Error assigning subscription to business:", error)
            throw new Error(`Failed to assign subscription: ${error.message}`)
        }

        revalidatePath("/dashboard/business")
        return { success: true }
    } catch (error) {
        console.error("Error in assignSubscriptionToBusiness:", error)
        throw error
    }
}