"use client"

import { useState } from "react"
import type { Business, BusinessUpdate } from "@/types/business"
import { useWithBusiness } from "@/lib/auth/with-business"
import { toast } from "@/hooks/use-toast"
import { updateBusiness } from "@/app/actions/business"
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs"
import { CreateBusinessParams } from "@/types/business"

export function useBusiness() {
    const { businessId, businessData, loading: authLoading, error: authError, refreshBusiness } = useWithBusiness()
    const [loading, setLoading] = useState(false)
    const { user } = useKindeBrowserClient()

    const update = async (data: Partial<CreateBusinessParams>) => {
        if (!businessId || !user?.id) {
            toast.error({
                description: "Authentication required",
            })
            return { success: false, error: new Error("Authentication required") }
        }

        try {
            setLoading(true)
            await updateBusiness(businessId, user.id, data)
            await refreshBusiness()
            toast.success({
                description: "Business updated successfully",
            })
            return { success: true, data: businessData }
        } catch (err) {
            console.error("Error updating business:", err)
            const errorMessage = err instanceof Error ? err.message : "Failed to update business"
            toast.error({
                description: errorMessage,
            })
            return { success: false, error: err instanceof Error ? err : new Error(errorMessage) }
        } finally {
            setLoading(false)
        }
    }

    return {
        business: businessData,
        loading: loading || authLoading,
        error: authError ? new Error(authError) : null,
        update,
    }
}
