"use client"

import { useState, useEffect } from "react"
import { getClients, getClientById, createClient, updateClient, deleteClient, searchClients } from "@/app/actions/clients"
import type { Client, ClientInsert, ClientUpdate } from "@/types/clients"

export function useClients(businessId: string) {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchClients() {
            try {
                setLoading(true)
                const data = await getClients()
                setClients(data || [])
            } catch (err) {
                console.error("Error fetching clients:", err)
                setClients([])
            } finally {
                setLoading(false)
            }
        }

        fetchClients()
    }, [businessId])

    const addClient = async (client: ClientInsert) => {
        try {
            const data = await createClient(client)
            if (data) {
                setClients((prev) => [...prev, data])
            }
            return { data, error: null }
        } catch (err) {
            return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
        }
    }

    const updateClientData = async (id: string, client: ClientUpdate) => {
        try {
            const data = await updateClient(id, client)
            if (data) {
                setClients((prev) => prev.map((c) => (c.id === id ? data : c)))
            }
            return { data, error: null }
        } catch (err) {
            return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
        }
    }

    const removeClient = async (id: string) => {
        try {
            await deleteClient(id)
            setClients((prev) => prev.filter((c) => c.id !== id))
            return { error: null }
        } catch (err) {
            return { error: err instanceof Error ? err : new Error(String(err)) }
        }
    }

    const searchClientsByQuery = async (query: string) => {
        try {
            const data = await searchClients(query)
            return { data, error: null }
        } catch (err) {
            return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
        }
    }

    return {
        clients,
        loading,
        addClient,
        updateClient: updateClientData,
        removeClient,
        searchClients: searchClientsByQuery,
    }
}

export function useClient(id: string, businessId: string) {
    const [client, setClient] = useState<Client | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchClient() {
            try {
                setLoading(true)
                const data = await getClientById(id)
                setClient(data)
            } catch (err) {
                console.error("Error fetching client:", err)
                setClient(null)
            } finally {
                setLoading(false)
            }
        }

        fetchClient()
    }, [id, businessId])

    const updateClientData = async (client: ClientUpdate) => {
        try {
            const data = await updateClient(id, client)
            if (data) {
                setClient(data)
            }
            return { data, error: null }
        } catch (err) {
            return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
        }
    }

    return {
        client,
        loading,
        updateClient: updateClientData,
    }
}
