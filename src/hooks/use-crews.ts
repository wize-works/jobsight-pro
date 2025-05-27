"use client"

import { useState, useEffect } from "react"
import { getCrews, getCrewById, createCrew, updateCrew, deleteCrewById, searchCrews } from "@/app/actions/crews"
import type { Crew, CrewInsert, CrewUpdate } from "@/types/crews"

export function useCrews(businessId: string) {
    const [crews, setCrews] = useState<Crew[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchCrews() {
            try {
                setLoading(true)
                const data = await getCrews()
                setCrews(data || [])
            } catch (err) {
                console.error("Error fetching crews:", err)
                setCrews([])
                setLoading(false)
                // Optionally, you can set an error state here
            } finally {
                setLoading(false)
            }
        }

        fetchCrews()
    }, [businessId])

    const addCrew = async (crew: CrewInsert) => {
        try {
            const data = await createCrew(crew)
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
            const data = await updateCrew(id, crew)
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
            await deleteCrewById(id)
            setCrews((prev) => prev.filter((c) => c.id !== id))
            return { error: null }
        } catch (err) {
            return { error: err instanceof Error ? err : new Error(String(err)) }
        }
    }

    const searchCrewsByQuery = async (query: string) => {
        try {
            const data = await searchCrews(query)
            return { data, error: null }
        } catch (err) {
            return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
        }
    }

    return {
        crews,
        loading,
        addCrew,
        updateCrew: updateCrewData,
        removeCrew,
        searchCrews: searchCrewsByQuery,
    }
}

export function useCrew(id: string, businessId: string) {
    const [crew, setCrew] = useState<Crew | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchCrew() {
            try {
                setLoading(true)
                const data = await getCrewById(id)
                setCrew(data)
            } catch (err) {
                console.error("Error fetching crew:", err)
                setCrew(null)
            } finally {
                setLoading(false)
            }
        }

        fetchCrew()
    }, [id, businessId])

    const updateCrewData = async (crew: CrewUpdate) => {
        try {
            const data = await updateCrew(id, crew)
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
        updateCrew: updateCrewData,
    }
}
