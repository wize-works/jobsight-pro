"use client"

import { useState, useEffect } from "react"
import { getClients, getClientById, createClient, updateClient, deleteClient, searchClients } from "@/lib/clients"
import type { Client, ClientInsert, ClientUpdate } from "@/lib/clients"

export function useClients(businessId: string) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchClients() {
      try {
        setLoading(true)
        const { data, error } = await getClients(businessId)
        if (error) throw error
        setClients(data || [])
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [businessId])

  const addClient = async (client: Omit<ClientInsert, "business_id">) => {
    try {
      const { data, error } = await createClient(client, businessId)
      if (error) throw error
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
      const { data, error } = await updateClient(id, client, businessId)
      if (error) throw error
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
      const { error } = await deleteClient(id, businessId)
      if (error) throw error
      setClients((prev) => prev.filter((c) => c.id !== id))
      return { error: null }
    } catch (err) {
      return { error: err instanceof Error ? err : new Error(String(err)) }
    }
  }

  const searchClientsByQuery = async (query: string) => {
    try {
      const { data, error } = await searchClients(query, businessId)
      if (error) throw error
      return { data, error: null }
    } catch (err) {
      return { data: null, error: err instanceof Error ? err : new Error(String(err)) }
    }
  }

  return {
    clients,
    loading,
    error,
    addClient,
    updateClient: updateClientData,
    removeClient,
    searchClients: searchClientsByQuery,
  }
}

export function useClient(id: string, businessId: string) {
  const [client, setClient] = useState<Client | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    async function fetchClient() {
      try {
        setLoading(true)
        const { data, error } = await getClientById(id, businessId)
        if (error) throw error
        setClient(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error(String(err)))
      } finally {
        setLoading(false)
      }
    }

    fetchClient()
  }, [id, businessId])

  const updateClientData = async (client: ClientUpdate) => {
    try {
      const { data, error } = await updateClient(id, client, businessId)
      if (error) throw error
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
    error,
    updateClient: updateClientData,
  }
}
