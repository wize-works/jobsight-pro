"use client"

import { useState, useEffect } from "react"
import { getCrews, getCrewById, createCrew, updateCrew, deleteCrew, searchCrews } from "@/lib/crews"
import type { Crew, CrewInsert, CrewUpdate } from "@/lib/crews"

export function useCrews(businessId: string) {
  const [crews, setCrews] = useState<Crew[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchCrews() {
      try {
        setLoading(true)
        const { data, error } = await getCrews(businessId)
        if (error) throw error
        setCrews(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setLoading(false)
      }
    }

    fetchCrews()
  }, [businessId])

  const addCrew = async (crew: Omit<CrewInsert, "business_id">) => {
    try {
      const { data, error } = await createCrew(crew, businessId)
      if (error) throw error
      if (data) {
        setCrews((prev) => [...prev, data])
      }
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
    }
  }

  const updateCrewData = async (id: string, crew: CrewUpdate) => {
    try {
      const { data, error } = await updateCrew(id, crew, businessId)
      if (error) throw error
      if (data) {
        setCrews((prev) => prev.map((c) => (c.id === id ? data : c)))
      }
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
    }
  }

  const removeCrew = async (id: string) => {
    try {
      const { error } = await deleteCrew(id, businessId)
      if (error) throw error
      setCrews((prev) => prev.filter((c) => c.id !== id))
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) }
    }
  }

  const searchCrewsByQuery = async (query: string) => {
    try {
      const { data, error } = await searchCrews(query, businessId)
      if (error) throw error
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
    }
  }

  return {
    crews,
    loading,
    error,
    addCrew,
    updateCrew: updateCrewData,
    removeCrew,
    searchCrews: searchCrewsByQuery,
  }
}

export function useCrew(id: string, businessId: string) {
  const [crew, setCrew] = useState<Crew | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchCrew() {
      try {
        setLoading(true)
        const { data, error } = await getCrewById(id, businessId)
        if (error) throw error
        setCrew(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setLoading(false)
      }
    }

    fetchCrew()
  }, [id, businessId])

  const updateCrewData = async (crew: CrewUpdate) => {
    try {
      const { data, error } = await updateCrew(id, crew, businessId)
      if (error) throw error
      if (data) {
        setCrew(data)
      }
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
    }
  }

  return {
    crew,
    loading,
    error,
    updateCrew: updateCrewData,
  }
}
