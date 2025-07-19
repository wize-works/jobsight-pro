import { useCallback, useState } from 'react';
import { clientsApi, ClientDetailResponse, ClientSearchResponse } from '@/lib/api/clients';
import { Client, ClientInsert, ClientUpdate, ClientWithStats } from '@/types/clients';
import { ClientContact, ClientContactInsert, ClientContactUpdate } from '@/types/client-contacts';
import { ClientInteraction, ClientInteractionInsert, ClientInteractionUpdate } from '@/types/client-interactions';

// Main client hooks
export function useClients() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getClients = useCallback(async (params?: {
        withStats?: boolean;
        query?: string;
        limit?: number;
        offset?: number;
    }) => {
        setLoading(true);
        setError(null);

        try {
            const result = await clientsApi.getClients(params);
            if (!result.success) {
                setError(result.error || 'Failed to fetch clients');
                return null;
            }
            return result.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch clients';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const getClientById = useCallback(async (id: string, params?: {
        includeContacts?: boolean;
        includeInteractions?: boolean;
        includeProjects?: boolean;
        includeStats?: boolean;
    }) => {
        setLoading(true);
        setError(null);

        try {
            const result = await clientsApi.getClientById(id, params);
            if (!result.success) {
                setError(result.error || 'Failed to fetch client');
                return null;
            }
            return result.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch client';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const searchClients = useCallback(async (query: string, params?: {
        includeContacts?: boolean;
        includeInteractions?: boolean;
        limit?: number;
    }) => {
        setLoading(true);
        setError(null);

        try {
            const result = await clientsApi.searchClients(query, params);
            if (!result.success) {
                setError(result.error || 'Failed to search clients');
                return null;
            }
            return result.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to search clients';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createClient = useCallback(async (clientData: ClientInsert) => {
        setLoading(true);
        setError(null);

        try {
            const result = await clientsApi.createClient(clientData);
            if (!result.success) {
                setError(result.error || 'Failed to create client');
                return null;
            }
            return result.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create client';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateClient = useCallback(async (id: string, clientData: ClientUpdate) => {
        setLoading(true);
        setError(null);

        try {
            const result = await clientsApi.updateClient(id, clientData);
            if (!result.success) {
                setError(result.error || 'Failed to update client');
                return null;
            }
            return result.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update client';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteClient = useCallback(async (id: string, archive: boolean = true) => {
        setLoading(true);
        setError(null);

        try {
            const result = await clientsApi.deleteClient(id, archive);
            if (!result.success) {
                setError(result.error || 'Failed to delete client');
                return false;
            }
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete client';
            setError(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        getClients,
        getClientById,
        searchClients,
        createClient,
        updateClient,
        deleteClient,
    };
}

// Client contacts hooks
export function useClientContacts() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getClientContacts = useCallback(async (clientId: string) => {
        setLoading(true);
        setError(null);

        try {
            const result = await clientsApi.contacts.getClientContacts(clientId);
            if (!result.success) {
                setError(result.error || 'Failed to fetch client contacts');
                return null;
            }
            return result.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch client contacts';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const getClientContactById = useCallback(async (clientId: string, contactId: string) => {
        setLoading(true);
        setError(null);

        try {
            const result = await clientsApi.contacts.getClientContactById(clientId, contactId);
            if (!result.success) {
                setError(result.error || 'Failed to fetch client contact');
                return null;
            }
            return result.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch client contact';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createClientContact = useCallback(async (clientId: string, contactData: ClientContactInsert) => {
        setLoading(true);
        setError(null);

        try {
            const result = await clientsApi.contacts.createClientContact(clientId, contactData);
            if (!result.success) {
                setError(result.error || 'Failed to create client contact');
                return null;
            }
            return result.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create client contact';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateClientContact = useCallback(async (clientId: string, contactId: string, contactData: ClientContactUpdate) => {
        setLoading(true);
        setError(null);

        try {
            const result = await clientsApi.contacts.updateClientContact(clientId, contactId, contactData);
            if (!result.success) {
                setError(result.error || 'Failed to update client contact');
                return null;
            }
            return result.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update client contact';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteClientContact = useCallback(async (clientId: string, contactId: string) => {
        setLoading(true);
        setError(null);

        try {
            const result = await clientsApi.contacts.deleteClientContact(clientId, contactId);
            if (!result.success) {
                setError(result.error || 'Failed to delete client contact');
                return false;
            }
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete client contact';
            setError(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        getClientContacts,
        getClientContactById,
        createClientContact,
        updateClientContact,
        deleteClientContact,
    };
}

// Client interactions hooks
export function useClientInteractions() {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const getClientInteractions = useCallback(async (clientId: string, params?: {
        limit?: number;
        offset?: number;
        type?: string;
    }) => {
        setLoading(true);
        setError(null);

        try {
            const result = await clientsApi.interactions.getClientInteractions(clientId, params);
            if (!result.success) {
                setError(result.error || 'Failed to fetch client interactions');
                return null;
            }
            return result.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch client interactions';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const getClientInteractionById = useCallback(async (clientId: string, interactionId: string) => {
        setLoading(true);
        setError(null);

        try {
            const result = await clientsApi.interactions.getClientInteractionById(clientId, interactionId);
            if (!result.success) {
                setError(result.error || 'Failed to fetch client interaction');
                return null;
            }
            return result.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch client interaction';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createClientInteraction = useCallback(async (clientId: string, interactionData: ClientInteractionInsert) => {
        setLoading(true);
        setError(null);

        try {
            const result = await clientsApi.interactions.createClientInteraction(clientId, interactionData);
            if (!result.success) {
                setError(result.error || 'Failed to create client interaction');
                return null;
            }
            return result.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to create client interaction';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const updateClientInteraction = useCallback(async (clientId: string, interactionId: string, interactionData: ClientInteractionUpdate) => {
        setLoading(true);
        setError(null);

        try {
            const result = await clientsApi.interactions.updateClientInteraction(clientId, interactionId, interactionData);
            if (!result.success) {
                setError(result.error || 'Failed to update client interaction');
                return null;
            }
            return result.data;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to update client interaction';
            setError(errorMessage);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const deleteClientInteraction = useCallback(async (clientId: string, interactionId: string) => {
        setLoading(true);
        setError(null);

        try {
            const result = await clientsApi.interactions.deleteClientInteraction(clientId, interactionId);
            if (!result.success) {
                setError(result.error || 'Failed to delete client interaction');
                return false;
            }
            return true;
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to delete client interaction';
            setError(errorMessage);
            return false;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        loading,
        error,
        getClientInteractions,
        getClientInteractionById,
        createClientInteraction,
        updateClientInteraction,
        deleteClientInteraction,
    };
}
