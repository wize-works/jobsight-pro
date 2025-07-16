import { Client, ClientInsert, ClientUpdate, ClientWithStats } from '@/types/clients';
import { ClientContact, ClientContactInsert, ClientContactUpdate } from '@/types/client-contacts';
import { ClientInteraction, ClientInteractionInsert, ClientInteractionUpdate } from '@/types/client-interactions';

export interface ClientApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
}

export interface ClientDetailResponse {
    client: Client;
    contacts?: ClientContact[];
    interactions?: ClientInteraction[];
    projects?: any[];
    stats?: {
        totalProjects: number;
        activeProjects: number;
        totalBudget: number;
        totalContacts: number;
        totalInteractions: number;
        recentInteractions: number;
    };
}

export interface ClientSearchResponse {
    clients: Client[];
    contacts?: ClientContact[];
    interactions?: ClientInteraction[];
}

export const clientsApi = {
    // Get all clients
    async getClients(params?: {
        withStats?: boolean;
        query?: string;
        limit?: number;
        offset?: number;
    }): Promise<ClientApiResponse<Client[] | ClientWithStats[]>> {
        try {
            const searchParams = new URLSearchParams();
            if (params?.withStats) searchParams.append('withStats', 'true');
            if (params?.query) searchParams.append('q', params.query);
            if (params?.limit) searchParams.append('limit', params.limit.toString());
            if (params?.offset) searchParams.append('offset', params.offset.toString());

            const response = await fetch(`/api/clients?${searchParams}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            return await response.json();
        } catch (error) {
            console.error('Error fetching clients:', error);
            return { success: false, error: 'Failed to fetch clients' };
        }
    },

    // Get client by ID
    async getClientById(id: string, params?: {
        includeContacts?: boolean;
        includeInteractions?: boolean;
        includeProjects?: boolean;
        includeStats?: boolean;
    }): Promise<ClientApiResponse<ClientDetailResponse>> {
        try {
            const searchParams = new URLSearchParams();
            if (params?.includeContacts) searchParams.append('includeContacts', 'true');
            if (params?.includeInteractions) searchParams.append('includeInteractions', 'true');
            if (params?.includeProjects) searchParams.append('includeProjects', 'true');
            if (params?.includeStats) searchParams.append('includeStats', 'true');

            const response = await fetch(`/api/clients/${id}?${searchParams}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            return await response.json();
        } catch (error) {
            console.error('Error fetching client:', error);
            return { success: false, error: 'Failed to fetch client' };
        }
    },

    // Create client
    async createClient(clientData: ClientInsert): Promise<ClientApiResponse<Client>> {
        try {
            const response = await fetch('/api/clients', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData),
            });

            return await response.json();
        } catch (error) {
            console.error('Error creating client:', error);
            return { success: false, error: 'Failed to create client' };
        }
    },

    // Update client
    async updateClient(id: string, clientData: ClientUpdate): Promise<ClientApiResponse<Client>> {
        try {
            const response = await fetch(`/api/clients/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(clientData),
            });

            return await response.json();
        } catch (error) {
            console.error('Error updating client:', error);
            return { success: false, error: 'Failed to update client' };
        }
    },

    // Delete/Archive client
    async deleteClient(id: string, archive: boolean = true): Promise<ClientApiResponse> {
        try {
            const searchParams = new URLSearchParams();
            if (archive) searchParams.append('archive', 'true');

            const response = await fetch(`/api/clients/${id}?${searchParams}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
            });

            return await response.json();
        } catch (error) {
            console.error('Error deleting client:', error);
            return { success: false, error: 'Failed to delete client' };
        }
    },

    // Search clients
    async searchClients(query: string, params?: {
        includeContacts?: boolean;
        includeInteractions?: boolean;
        limit?: number;
    }): Promise<ClientApiResponse<ClientSearchResponse>> {
        try {
            const searchParams = new URLSearchParams();
            searchParams.append('q', query);
            if (params?.includeContacts) searchParams.append('includeContacts', 'true');
            if (params?.includeInteractions) searchParams.append('includeInteractions', 'true');
            if (params?.limit) searchParams.append('limit', params.limit.toString());

            const response = await fetch(`/api/clients/search?${searchParams}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' },
            });

            return await response.json();
        } catch (error) {
            console.error('Error searching clients:', error);
            return { success: false, error: 'Failed to search clients' };
        }
    },

    // Client Contacts
    contacts: {
        // Get client contacts
        async getClientContacts(clientId: string): Promise<ClientApiResponse<ClientContact[]>> {
            try {
                const response = await fetch(`/api/clients/${clientId}/contacts`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                return await response.json();
            } catch (error) {
                console.error('Error fetching client contacts:', error);
                return { success: false, error: 'Failed to fetch contacts' };
            }
        },

        // Create client contact
        async createClientContact(clientId: string, contactData: ClientContactInsert): Promise<ClientApiResponse<ClientContact>> {
            try {
                const response = await fetch(`/api/clients/${clientId}/contacts`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(contactData),
                });

                return await response.json();
            } catch (error) {
                console.error('Error creating client contact:', error);
                return { success: false, error: 'Failed to create contact' };
            }
        },

        // Get client contact by ID
        async getClientContactById(clientId: string, contactId: string): Promise<ClientApiResponse<ClientContact>> {
            try {
                const response = await fetch(`/api/clients/${clientId}/contacts/${contactId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                return await response.json();
            } catch (error) {
                console.error('Error fetching client contact:', error);
                return { success: false, error: 'Failed to fetch contact' };
            }
        },

        // Update client contact
        async updateClientContact(clientId: string, contactId: string, contactData: ClientContactUpdate): Promise<ClientApiResponse<ClientContact>> {
            try {
                const response = await fetch(`/api/clients/${clientId}/contacts/${contactId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(contactData),
                });

                return await response.json();
            } catch (error) {
                console.error('Error updating client contact:', error);
                return { success: false, error: 'Failed to update contact' };
            }
        },

        // Delete client contact
        async deleteClientContact(clientId: string, contactId: string): Promise<ClientApiResponse> {
            try {
                const response = await fetch(`/api/clients/${clientId}/contacts/${contactId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });

                return await response.json();
            } catch (error) {
                console.error('Error deleting client contact:', error);
                return { success: false, error: 'Failed to delete contact' };
            }
        },
    },

    // Client Interactions
    interactions: {
        // Get client interactions
        async getClientInteractions(clientId: string, params?: {
            limit?: number;
            offset?: number;
            type?: string;
        }): Promise<ClientApiResponse<ClientInteraction[]>> {
            try {
                const searchParams = new URLSearchParams();
                if (params?.limit) searchParams.append('limit', params.limit.toString());
                if (params?.offset) searchParams.append('offset', params.offset.toString());
                if (params?.type) searchParams.append('type', params.type);

                const response = await fetch(`/api/clients/${clientId}/interactions?${searchParams}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                return await response.json();
            } catch (error) {
                console.error('Error fetching client interactions:', error);
                return { success: false, error: 'Failed to fetch interactions' };
            }
        },

        // Create client interaction
        async createClientInteraction(clientId: string, interactionData: ClientInteractionInsert): Promise<ClientApiResponse<ClientInteraction>> {
            try {
                const response = await fetch(`/api/clients/${clientId}/interactions`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(interactionData),
                });

                return await response.json();
            } catch (error) {
                console.error('Error creating client interaction:', error);
                return { success: false, error: 'Failed to create interaction' };
            }
        },

        // Get client interaction by ID
        async getClientInteractionById(clientId: string, interactionId: string): Promise<ClientApiResponse<ClientInteraction>> {
            try {
                const response = await fetch(`/api/clients/${clientId}/interactions/${interactionId}`, {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                return await response.json();
            } catch (error) {
                console.error('Error fetching client interaction:', error);
                return { success: false, error: 'Failed to fetch interaction' };
            }
        },

        // Update client interaction
        async updateClientInteraction(clientId: string, interactionId: string, interactionData: ClientInteractionUpdate): Promise<ClientApiResponse<ClientInteraction>> {
            try {
                const response = await fetch(`/api/clients/${clientId}/interactions/${interactionId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(interactionData),
                });

                return await response.json();
            } catch (error) {
                console.error('Error updating client interaction:', error);
                return { success: false, error: 'Failed to update interaction' };
            }
        },

        // Delete client interaction
        async deleteClientInteraction(clientId: string, interactionId: string): Promise<ClientApiResponse> {
            try {
                const response = await fetch(`/api/clients/${clientId}/interactions/${interactionId}`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                });

                return await response.json();
            } catch (error) {
                console.error('Error deleting client interaction:', error);
                return { success: false, error: 'Failed to delete interaction' };
            }
        },
    },
};
