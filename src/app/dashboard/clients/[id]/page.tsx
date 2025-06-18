"use client";
import ClientDetailComponent from "../components/detail";
import { getClientById } from "@/app/actions/clients";
import { getClientContactsByClientId } from "@/app/actions/client-contacts";
import { getClientInteractionsByClientId } from "@/app/actions/client-interactions";
import { getProjectsByClientId } from "@/app/actions/projects";
import { getKindeServerSession } from "@kinde-oss/kinde-auth-nextjs/server";
import { useBusiness } from "@/lib/business-context";
import { useEffect, useState } from "react";
import { ClientInteraction } from "@/types/client-interactions";
import { ClientContact } from "@/types/client-contacts";
import { Project } from "@/types/projects";
import { Client } from "@/types/clients";

export default function ClientPage({ params }: { params: Promise<{ id: string }> }) {
    const { businessId } = useBusiness();
    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState<Client>({} as Client);
    const [projects, setProjects] = useState<Project[]>([]);
    const [contacts, setContacts] = useState<ClientContact[]>([]);
    const [interactions, setInteractions] = useState<ClientInteraction[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            if (!businessId) {
                return;
            }
            setLoading(true);
            const { id } = await params;
            try {
                const [clientData, projectsData, contactsData, interactionsData] = await Promise.all([
                    getClientById(businessId, id),
                    getProjectsByClientId(businessId, id),
                    getClientContactsByClientId(businessId, id),
                    getClientInteractionsByClientId(businessId, id)
                ]);
                setClient(clientData);
                setProjects(projectsData);
                setContacts(contactsData);
                setInteractions(interactionsData);
            } catch (error) {
                console.error("Error fetching client data:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [params, businessId]);

    if (!client) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <h2 className="text-xl mb-4">Client not found</h2>
                <p>The requested client does not exist or you don't have permission to view it.</p>
            </div>
        )
    } return (
        <ClientDetailComponent
            client={client}
            projects={projects || []}
            contacts={contacts || []}
            interactions={interactions || []}
        />
    )
}
