"use client"

import { useState, useEffect } from "react"
import { getBusiness, updateBusiness, type Business, type BusinessUpdate } from "@/lib/business"
import { useBusiness as useBusinessContext } from "@/lib/business-context"

export function useBusiness() {
  const { businessId } = useBusinessContext()
  const [business, setBusiness] = useState<Business | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchBusiness() {
      if (!businessId) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const { data, error } = await getBusiness(businessId)

        if (error) {
          throw error
        }

        setBusiness(data)
      } catch (err) {
        console.error("Error fetching business:", err)
        setError(err instanceof Error ? err : new Error("Failed to fetch business"))
      } finally {
        setLoading(false)
      }
    }

    fetchBusiness()
  }, [businessId])

  const update = async (data: BusinessUpdate) => {
    if (!businessId) {
      return { success: false, error: new Error("No business ID available") }
    }

    try {
      setLoading(true)
      const { data: updatedBusiness, error } = await updateBusiness(businessId, data)

      if (error) {
        throw error
      }

      setBusiness(updatedBusiness)
      return { success: true, data: updatedBusiness }
    } catch (err) {
      console.error("Error updating business:", err)
      setError(err instanceof Error ? err : new Error("Failed to update business"))
      return { success: false, error: err instanceof Error ? err : new Error("Failed to update business") }
    } finally {
      setLoading(false)
    }
  }

  return {
    business,
    loading,
    error,
    update,
  }
}
