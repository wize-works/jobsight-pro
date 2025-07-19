"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { useClients, useClientContacts, useClientInteractions } from "@/hooks/use-clients";
import { useProjects, useProjectMutations } from "@/hooks/useProjects";
import { useInvoices, useCreateInvoice } from "@/hooks/use-invoices";
import { useClientLogo } from "@/hooks/use-media";
import { mediaApi } from "@/lib/api/media";
import { invoicesApi } from "@/lib/api/invoices";
import { toast } from "@/hooks/use-toast";
import { ClientContact, ClientContactInsert, ClientContactUpdate } from "@/types/client-contacts";
import { ClientInteraction, ClientInteractionInsert, ClientInteractionUpdate } from "@/types/client-interactions";
import { Project, ProjectInsert, ProjectStatus, projectStatusOptions } from "@/types/projects";
import { Client, ClientStatus, clientStatusOptions } from "@/types/clients";
import { MediaType, Media } from "@/types/media";
import { CreateInvoiceData } from "@/lib/api/invoices";
import { useBusiness } from "@/lib/business-context";
import { getProxiedMediaUrl } from "@/lib/media-utils";
import ClientModal from "../components/modal-client";
import InteractionModal from "../components/modal-interaction";
import ModalProject from "../components/modal-project";
import ModalContact from "../components/modal-contact";
import ModalInvoice from "../components/modal-invoice";
import ClientDetailLoading from "./loading";
import ErrorBoundary from "@/components/error-boundary";
import UniversalMediaManager from "@/components/universal-media-manager";

export default function ClientPage({ params }: { params: Promise<{ id: string }> }) {
    const { businessId, business } = useBusiness();
    const { user } = useUser();
    const router = useRouter();

    // Initialize hooks
    const { getClientById, updateClient, deleteClient } = useClients();
    const { getClientContacts, createClientContact, updateClientContact } = useClientContacts();
    const { getClientInteractions, createClientInteraction, updateClientInteraction } = useClientInteractions();
    const { createProject } = useProjectMutations();
    const { createInvoice } = useCreateInvoice();

    // Data loading states
    const [loading, setLoading] = useState(true);
    const [client, setClient] = useState<Client>({} as Client);
    const [projects, setProjects] = useState<Project[]>([]);
    const [contacts, setContacts] = useState<ClientContact[]>([]);
    const [interactions, setInteractions] = useState<ClientInteraction[]>([]);
    const [linkedMedia, setLinkedMedia] = useState<Media[]>([]);
    const [availableMedia, setAvailableMedia] = useState<Media[]>([]);

    // Logo management state
    const [clientLogo, setClientLogo] = useState<any>(null);
    const [logoLoading, setLogoLoading] = useState(false);
    const [logoError, setLogoError] = useState<string | null>(null);

    // UI states
    const [activeTab, setActiveTab] = useState("overview");
    const [showAddContactModal, setShowAddContactModal] = useState(false);
    const [contactLoading, setContactLoading] = useState(false);
    const [showEditContactModal, setShowEditContactModal] = useState(false);
    const [editContactLoading, setEditContactLoading] = useState(false);
    const [showInteractionModal, setShowInteractionModal] = useState(false);
    const [showEditClientModal, setShowEditClientModal] = useState(false);
    const [interaction, setInteraction] = useState<Partial<ClientInteractionInsert> | null>(null);
    const [editContact, setEditContact] = useState<any | null>(null);
    const [showEditInteractionModal, setShowEditInteractionModal] = useState(false);
    const [editInteraction, setEditInteraction] = useState<ClientInteraction | null>(null);
    const [clientNotes, setClientNotes] = useState("");
    const [showAddProjectModal, setShowAddProjectModal] = useState(false);
    const [mediaLoading, setMediaLoading] = useState(false);
    const [logoUploadLoading, setLogoUploadLoading] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [invoiceLoading, setInvoiceLoading] = useState(false);
    const [archiveLoading, setArchiveLoading] = useState(false);
    const [archiveInfo, setArchiveInfo] = useState<{
        relatedData: {
            projectCount: number;
            contactCount: number;
            interactionCount: number;
            invoiceCount: number;
        };
    } | null>(null);
    const [downloadingPdf, setDownloadingPdf] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            if (!businessId) {
                return;
            }
            setLoading(true);
            const { id } = await params;
            try {
                const clientDetails = await getClientById(id, {
                    includeContacts: true,
                    includeInteractions: true,
                    includeProjects: true,
                    includeStats: true
                });
                if (clientDetails) {
                    const { client, contacts, interactions, projects, stats } = clientDetails;
                    setClient(client);
                    setProjects(projects || []);
                    setContacts(contacts || []);
                    setInteractions(interactions || []);
                    setClientNotes(client.notes || "");
                    // Can also use stats for dashboard metrics
                }

                // Get archive info for the client to show related data counts
                try {
                    // Count related data manually since we have the data loaded
                    const relatedData = {
                        projectCount: projects?.length || 0,
                        contactCount: contacts?.length || 0,
                        interactionCount: interactions?.length || 0,
                        invoiceCount: 0 // Will be loaded separately as invoices aren't preloaded
                    };
                    setArchiveInfo({ relatedData });

                    // Asynchronously load invoice count for more accurate archive info
                    loadInvoiceCount();
                } catch (error) {
                    console.error("Error setting archive info:", error);
                }
            } catch (error) {
                console.error("Error fetching client data:", error);
            } finally {
                setLoading(false);
            }
        }; fetchData();
    }, [params, businessId]);

    // Load invoice count for archive info
    const loadInvoiceCount = async () => {
        if (!client?.id || !businessId) return;

        try {
            const response = await invoicesApi.getInvoicesByClient(client.id);
            const invoiceCount = response.data?.length || 0;

            // Update archive info with actual invoice count
            setArchiveInfo(prev => ({
                relatedData: {
                    projectCount: prev?.relatedData?.projectCount || 0,
                    contactCount: prev?.relatedData?.contactCount || 0,
                    interactionCount: prev?.relatedData?.interactionCount || 0,
                    invoiceCount
                }
            }));
        } catch (error) {
            console.error("Error loading invoice count:", error);
        }
    };

    // PDF download function - now saves to media storage
    const downloadClientPdf = async () => {
        if (!client || !businessId) return;

        setDownloadingPdf(true);
        try {
            // Generate PDF using API
            const response = await fetch('/api/pdf-generation', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'client',
                    clientId: client.id,
                    fileName: client.name
                })
            });

            if (!response.ok) {
                throw new Error('Failed to generate PDF');
            }

            const result = await response.json();

            if (!result.success) {
                throw new Error(result.error || 'Failed to generate PDF');
            }

            // PDF is now saved to media storage and linked to client
            toast({
                title: "PDF generated and saved",
                description: "Client PDF has been saved to your documents and linked to this client.",
                variant: "success"
            });

            // Refresh media data to show the new PDF
            await loadMediaData();

            // If user wants to download directly, provide download link
            if (result.fileUrl) {
                const link = document.createElement('a');
                link.href = result.fileUrl;
                link.download = result.filename || `Client-${client.name}.pdf`;
                link.target = '_blank';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

        } catch (error) {
            console.error('Error generating client PDF:', error);
            toast({
                title: "Failed to generate PDF",
                description: "There was an error generating the client PDF. Please try again.",
                variant: "error"
            });
        } finally {
            setDownloadingPdf(false);
        }
    };

    const handleAddContact = async (formData: any): Promise<{ success: boolean }> => {
        setContactLoading(true);

        const contactData = {
            name: formData.name,
            title: formData.title,
            email: formData.email,
            phone: formData.phone,
            is_primary: formData.is_primary,
            client_id: client.id,
            created_by: user?.id,
            created_at: new Date().toISOString(),
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
        } as ClientContactInsert;

        try {
            await createClientContact(businessId, contactData);
            toast({
                title: "Contact created",
                description: "Your contact has been created successfully.",
                variant: "success"
            });
            router.refresh();
            return { success: true };
        } catch (error) {
            console.error("Error creating contact:", error);
            toast({
                title: "Error creating contact",
                description: "There was an error creating the contact.",
                variant: "error"
            });
            return { success: false };
        } finally {
            setContactLoading(false);
        }
    }

    const handleAddInteraction = async () => {
        if (!interaction) {
            toast.error({
                title: "Error",
                description: "Interaction data is missing.",
            });
            return;
        }

        const interactionData = {
            client_id: client.id,
            type: interaction.type,
            date: new Date().toISOString(),
            summary: interaction.summary,
            staff: interaction.staff,
            follow_up_date: interaction.follow_up_date || null,
            follow_up_task: interaction.follow_up_task || null,
            created_by: user?.id,
            created_at: new Date().toISOString(),
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
        } as ClientInteractionInsert;
        try {
            await createClientInteraction(businessId, interactionData);
            toast.success({
                title: "Interaction created",
                description: "Your interaction has been logged successfully.",
                autoClose: true,
            });
            router.refresh();
        } catch (error) {
            console.error("Error creating interaction:", error);
            toast.error({
                title: "Error creating interaction",
                description: "There was an error logging the interaction.",
            });
        }
        finally {
            setShowInteractionModal(false);
        }
    };

    const handleAddProject = async (formData: any) => {
        try {
            const projectData: ProjectInsert = {
                id: crypto.randomUUID(),
                business_id: businessId,
                name: formData.name,
                type: formData.type || null,
                status: formData.status,
                start_date: formData.start_date || null,
                end_date: formData.end_date || null,
                budget: formData.budget ? Number(formData.budget) : null,
                location: formData.location || null,
                description: formData.description || null,
                client_id: client.id,
                manager_id: null,
                progress: null,
                created_by: user?.id || null,
                created_at: new Date().toISOString(),
                updated_by: user?.id || null,
                updated_at: new Date().toISOString(),
            };

            await createProject(projectData);

            toast({
                title: "Project created",
                description: "Your project has been created successfully.",
                variant: "success"
            });

            router.refresh();
            return { success: true };
        } catch (error) {
            toast({
                title: "Error creating project",
                description: "There was an error creating the project.",
                variant: "error"
            });
            throw error;
        }
    };

    const handleEditContactOpen = (contact: any) => {
        setEditContact(contact);
        setShowEditContactModal(true);
    };

    const handleEditContactClose = () => {
        setShowEditContactModal(false);
        setEditContact(null);
    };

    const handleEditContactSubmit = async (formData: any): Promise<{ success: boolean }> => {
        setEditContactLoading(true);

        const updatedContact = {
            name: formData.name,
            title: formData.title,
            email: formData.email,
            phone: formData.phone,
            is_primary: formData.is_primary
        } as ClientContactUpdate;

        try {
            await updateClientContact(businessId, editContact.id, updatedContact);
            toast.success({
                title: "Contact updated",
                description: "Your contact has been updated successfully.",
                autoClose: true,
            });
            router.refresh();
            return { success: true };
        } catch (error) {
            console.error("Error updating contact:", error);
            toast.error({
                title: "Error updating contact",
                description: "There was an error updating the contact.",
            });
            return { success: false };
        } finally {
            setEditContactLoading(false);
        }
    };

    const handleEditInteractionOpen = (interaction: ClientInteraction) => {
        setEditInteraction(interaction);
        setShowEditInteractionModal(true);
    };

    const handleEditInteractionSubmit = async (formData: any) => {
        if (!editInteraction) return;

        const updatedInteraction = {
            type: formData.type,
            summary: formData.summary,
            staff: formData.staff,
            date: formData.date,
            follow_up_date: formData.follow_up_date || null,
            follow_up_task: formData.follow_up_task || null,
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
        } as ClientInteractionUpdate;

        await updateClientInteraction(businessId, editInteraction.id, updatedInteraction);
        setShowEditInteractionModal(false);
        setEditInteraction(null);
        router.refresh();
    };

    // Load media data for UniversalMediaManager
    const loadMediaData = async () => {
        if (!client.id) return;

        try {
            setMediaLoading(true);

            // Get client-linked media
            const linkedMediaResponse = await mediaApi.getMedia({
                client_id: client.id,
                limit: 100
            });

            setLinkedMedia(linkedMediaResponse.data || []);

            // Get all business media for linking (excluding already linked)
            const allMediaResponse = await mediaApi.getMedia({
                limit: 500 // Get more for available selection
            });

            // Filter out already linked media
            const linkedMediaIds = (linkedMediaResponse.data || []).map(media => media.id);
            const availableMediaForLinking = (allMediaResponse.data || []).filter(
                media => !linkedMediaIds.includes(media.id)
            );

            setAvailableMedia(availableMediaForLinking);
        } catch (error) {
            console.error("Error loading client media:", error);
            toast.error("Failed to load media data");
        } finally {
            setMediaLoading(false);
        }
    };

    // UniversalMediaManager handlers
    const handleMediaUpload = async (
        file: File,
        metadata: { name: string; description: string; type: MediaType }
    ): Promise<boolean> => {
        try {
            // Get upload URL
            const uploadUrlResponse = await fetch('/api/media/upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: metadata.type,
                    filename: file.name
                }),
            });

            if (!uploadUrlResponse.ok) {
                throw new Error('Failed to get upload URL');
            }

            const { uploadUrl, fileUrl, fileName } = await uploadUrlResponse.json();

            // Upload file to storage
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'x-ms-blob-type': 'BlockBlob',
                    'Content-Type': file.type,
                },
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload file');
            }

            // Create media record
            const mediaResponse = await fetch('/api/media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: fileUrl,
                    name: metadata.name || file.name,
                    description: metadata.description,
                    type: metadata.type,
                    size: file.size,
                    uploaded_at: new Date().toISOString(),
                }),
            });

            if (!mediaResponse.ok) {
                throw new Error('Failed to create media record');
            }

            const media = await mediaResponse.json();

            // Link media to client
            await fetch('/api/media-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    media_id: media.data.id,
                    linked_id: client.id,
                    linked_type: 'client'
                }),
            });

            toast.success({
                title: "Upload successful",
                description: `${file.name} has been uploaded and linked to ${client.name}`,
                autoClose: true,
            });

            await loadMediaData(); // Refresh data
            return true;
        } catch (error) {
            console.error("Error uploading media:", error);
            toast.error({
                title: "Upload failed",
                description: error instanceof Error ? error.message : "Failed to upload media",
            });
            return false;
        }
    };

    const handleMediaLink = async (mediaIds: string[]): Promise<{ success: boolean; error?: string }> => {
        try {
            // Link each selected media item to the client
            for (const mediaId of mediaIds) {
                await fetch('/api/media-links', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        media_id: mediaId,
                        linked_id: client.id,
                        linked_type: 'client'
                    }),
                });
            }

            toast.success({
                title: "Media linked successfully",
                description: `${mediaIds.length} file(s) have been linked to ${client.name}`,
                autoClose: true,
            });

            await loadMediaData(); // Refresh data
            return { success: true };
        } catch (error) {
            console.error("Error linking media:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to link media";
            toast.error({
                title: "Link failed",
                description: errorMessage,
            });
            return { success: false, error: errorMessage };
        }
    };

    const handleMediaUnlink = async (mediaIds: string[]): Promise<{ success: boolean; error?: string }> => {
        try {
            // Unlink each selected media item from the client
            for (const mediaId of mediaIds) {
                const deleteResponse = await fetch(`/api/media-links?media_id=${mediaId}&linked_id=${client.id}&linked_type=client`, {
                    method: 'DELETE',
                });

                if (!deleteResponse.ok) {
                    const errorData = await deleteResponse.json();
                    throw new Error(errorData.error || `Failed to unlink media ${mediaId}`);
                }
            }

            toast.success({
                title: "Media unlinked successfully",
                description: `${mediaIds.length} file(s) have been unlinked from ${client.name}`,
                autoClose: true,
            });

            await loadMediaData(); // Refresh data
            return { success: true };
        } catch (error) {
            console.error("Error unlinking media:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to unlink media";
            toast.error({
                title: "Unlink failed",
                description: errorMessage,
            });
            return { success: false, error: errorMessage };
        }
    };

    // Load media data when client changes
    useEffect(() => {
        loadMediaData();
        fetchClientLogo();
    }, [client.id]);

    // Fetch client logo
    const fetchClientLogo = async () => {
        if (!client.id) return;

        try {
            const response = await fetch(`/api/media?client_id=${client.id}&search=logo&type=images`);
            if (response.ok) {
                const data = await response.json();
                const logo = data.data.find((media: any) =>
                    media.name?.toLowerCase().includes('logo') ||
                    media.description?.toLowerCase().includes('logo')
                );
                setClientLogo(logo || null);
            }
        } catch (error) {
            console.error('Error fetching client logo:', error);
            setLogoError('Failed to load logo');
        }
    };

    // Upload client logo using media API
    const uploadClientLogo = async (file: File): Promise<{ success: boolean; logoUrl?: string }> => {
        setLogoLoading(true);
        setLogoError(null);

        try {
            // Get upload URL
            const uploadUrlResponse = await fetch('/api/media/upload-url', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'images',
                    filename: file.name
                }),
            });

            if (!uploadUrlResponse.ok) {
                throw new Error('Failed to get upload URL');
            }

            const { uploadUrl, fileUrl, fileName } = await uploadUrlResponse.json();

            // Upload file to storage
            const uploadResponse = await fetch(uploadUrl, {
                method: 'PUT',
                body: file,
                headers: {
                    'x-ms-blob-type': 'BlockBlob',
                    'Content-Type': file.type,
                },
            });

            if (!uploadResponse.ok) {
                throw new Error('Failed to upload file');
            }

            // Create media record
            const mediaResponse = await fetch('/api/media', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    url: fileUrl,
                    name: `${fileName}-client-logo`,
                    description: `Logo for client`,
                    type: 'images',
                    size: file.size,
                    uploaded_at: new Date().toISOString(),
                }),
            });

            if (!mediaResponse.ok) {
                throw new Error('Failed to create media record');
            }

            const media = await mediaResponse.json();

            // Link media to client
            await fetch('/api/media-links', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    media_id: media.data.id,
                    linked_id: client.id,
                    linked_type: 'client'
                }),
            });

            // Update client logo_url field for backward compatibility
            const updatedClient = await updateClient(client.id, {
                logo_url: fileUrl,
            } as any);

            if (updatedClient) {
                setClient(updatedClient);
                setClientLogo(media.data);
            }

            return { success: true, logoUrl: fileUrl };
        } catch (error) {
            console.error('Error uploading client logo:', error);
            setLogoError(error instanceof Error ? error.message : 'Failed to upload logo');
            return { success: false };
        } finally {
            setLogoLoading(false);
        }
    };

    const handleUpdateClientNotes = async (notes: string) => {
        try {
            const updatedClient = await updateClient(client.id, { notes } as any);
            if (updatedClient) {
                setClient(updatedClient);
                toast({
                    title: "Notes updated",
                    description: "Client notes have been updated successfully.",
                });
            }
        } catch (error) {
            toast({
                title: "Error updating notes",
                description: "There was an error updating the client notes.",
            });
        }
    }

    const handleUpdateClient = async (formData: any): Promise<void> => {
        try {
            const clientData = {
                ...client,
                name: formData.name,
                type: formData.type,
                industry: formData.industry,
                contact_name: formData.contact_name,
                contact_email: formData.contact_email,
                contact_phone: formData.contact_phone,
                website: formData.website,
                address: formData.address,
                city: formData.city,
                state: formData.state,
                zip: formData.zip,
                country: formData.country,
                tax_id: formData.tax_id,
                notes: formData.notes,
                logo_url: formData.logo_url,
                status: formData.status,
                updated_at: new Date().toISOString(),
                updated_by: user?.id || null
            };

            const updatedClient = await updateClient(client.id, clientData);
            if (updatedClient) {
                setClient(updatedClient);
                toast({
                    title: "Success",
                    description: "Client updated successfully",
                });
                router.refresh();
            }
        } catch (error) {
            console.error("Error updating client:", error);
            toast.error("Failed to update client");
            throw error;
        }
    };

    const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error({
                title: "Invalid file type",
                description: "Please select an image file.",
            });
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error({
                title: "File too large",
                description: "Please select an image smaller than 5MB.",
            });
            return;
        }

        setLogoUploadLoading(true);
        try {
            const result = await uploadClientLogo(file);
            if (result.success) {
                toast({
                    title: "Logo uploaded",
                    description: "Client logo has been updated successfully.",
                    variant: "success"
                });
                router.refresh();
            } else {
                throw new Error("Upload failed");
            }
        } catch (error) {
            console.error("Error uploading logo:", error);
            toast({
                title: "Upload failed",
                description: "There was an error uploading the logo.",
                variant: "error"
            });
        } finally {
            setLogoUploadLoading(false);
            // Reset the input
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    const handleCreateInvoice = async (formData: any): Promise<{ success: boolean }> => {
        setInvoiceLoading(true);

        try {
            const invoiceData: CreateInvoiceData = {
                client_id: client.id,
                project_id: formData.project_id || undefined,
                invoice_number: formData.invoice_number,
                issue_date: formData.issue_date,
                due_date: formData.due_date,
                amount: formData.amount,
                total_amount: formData.amount * (1 + formData.tax_rate / 100),
                tax_amount: formData.amount * (formData.tax_rate / 100),
                status: formData.status,
                notes: formData.notes,
            };

            const invoice = await createInvoice(invoiceData);
            if (invoice) {
                toast.success({
                    title: "Invoice created",
                    description: "Your invoice has been created successfully.",
                    autoClose: true,
                });
                router.refresh();
                return { success: true };
            } else {
                throw new Error("Invoice creation failed");
            }
        } catch (error) {
            console.error("Error creating invoice:", error);
            toast.error({
                title: "Error creating invoice",
                description: "There was an error creating the invoice.",
            });
            return { success: false };
        } finally {
            setInvoiceLoading(false);
        }
    }; const handleArchiveClient = async () => {
        // Get archive info if not already loaded
        if (!archiveInfo) {
            setArchiveLoading(true);
            try {
                // Implement client archive info API
                const response = await fetch(`/api/clients/${client.id}/archive-info?business_id=${businessId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setArchiveInfo({
                        relatedData: data.relatedData || {
                            projectCount: projects.length,
                            contactCount: contacts.length,
                            interactionCount: interactions.length,
                            invoiceCount: 0
                        }
                    });
                } else {
                    // Fallback to local data if API not available
                    setArchiveInfo({
                        relatedData: {
                            projectCount: projects.length,
                            contactCount: contacts.length,
                            interactionCount: interactions.length,
                            invoiceCount: 0
                        }
                    });
                }
                setArchiveLoading(false);
            } catch (error) {
                setArchiveLoading(false);
                // Use local data as fallback
                setArchiveInfo({
                    relatedData: {
                        projectCount: projects.length,
                        contactCount: contacts.length,
                        interactionCount: interactions.length,
                        invoiceCount: 0
                    }
                });
                console.warn("Archive info API not available, using local data:", error);
            }
        }

        // Create confirmation message based on what will be preserved
        let confirmMessage = `Archive "${client.name}"?`;

        if (archiveInfo && (archiveInfo.relatedData.projectCount > 0 || archiveInfo.relatedData.contactCount > 0 || archiveInfo.relatedData.interactionCount > 0 || archiveInfo.relatedData.invoiceCount > 0)) {
            confirmMessage += `\n\nThis will mark the client as inactive but preserve all data including:`;
            if (archiveInfo.relatedData.projectCount > 0) {
                confirmMessage += `\n• ${archiveInfo.relatedData.projectCount} project(s)`;
            }
            if (archiveInfo.relatedData.contactCount > 0) {
                confirmMessage += `\n• ${archiveInfo.relatedData.contactCount} contact(s)`;
            }
            if (archiveInfo.relatedData.interactionCount > 0) {
                confirmMessage += `\n• ${archiveInfo.relatedData.interactionCount} interaction(s)`;
            }
            if (archiveInfo.relatedData.invoiceCount > 0) {
                confirmMessage += `\n• ${archiveInfo.relatedData.invoiceCount} invoice(s)`;
            }
            confirmMessage += `\n\nAll data will remain accessible for tax and compliance purposes.`;
        } else {
            confirmMessage += `\n\nThe client will be marked as inactive but all data will be preserved.`;
        }

        if (!window.confirm(confirmMessage)) {
            return;
        }

        setArchiveLoading(true);

        try {
            const success = await deleteClient(client.id, true); // Archive

            if (success) {
                toast({
                    title: "Client archived successfully",
                    description: `"${client.name}" has been archived. All data has been preserved.`,
                    variant: "success"
                });
                router.refresh();
            } else {
                throw new Error("Archive operation failed");
            }
        } catch (error) {
            console.error("Error archiving client:", error);

            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

            toast({
                title: "Error archiving client",
                description: errorMessage,
                variant: "error"
            });
        } finally {
            setArchiveLoading(false);
        }
    };

    const handleUnarchiveClient = async () => {
        if (!window.confirm(`Unarchive "${client.name}"? This will mark the client as active again.`)) {
            return;
        }

        setArchiveLoading(true);

        try {
            // Use the updateClient function to change status to active
            const updatedClient = await updateClient(client.id, { status: 'active' } as any);

            if (updatedClient) {
                setClient(updatedClient);
                toast({
                    title: "Client unarchived successfully",
                    description: `"${client.name}" has been restored to active status.`,
                    variant: "success"
                });
                router.refresh();
            } else {
                throw new Error("Unarchive operation failed");
            }
        } catch (error) {
            console.error("Error unarchiving client:", error);

            const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

            toast({
                title: "Error unarchiving client",
                description: errorMessage,
                variant: "error"
            });
        } finally {
            setArchiveLoading(false);
        }
    };

    if (loading) {
        return <ClientDetailLoading />
    }

    if (!client || !client.id) {
        return (
            <div className="flex flex-col items-center justify-center h-64">
                <h2 className="text-xl mb-4">Client not found</h2>
                <p>The requested client does not exist or you don't have permission to view it.</p>
            </div>
        )
    }

    return (
        <div>
            {/* Client Header */}
            <ErrorBoundary fallback={(error) => (
                <div className="alert alert-error mb-6">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3 className="font-bold">Failed to load client header</h3>
                        <div className="text-xs">Client navigation is temporarily unavailable.</div>
                    </div>
                </div>
            )}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                    <div className="flex items-center gap-2">
                        <Link href={`/dashboard/clients`} className="btn btn-outline mr-2">
                            <i className="far fa-arrow-left"></i>Back to Clients
                        </Link>
                    </div>                <div className="flex gap-2">
                        <button onClick={() => setShowEditClientModal(true)} className="btn btn-outline" >
                            <i className="far fa-edit mr-2"></i> Edit
                        </button>
                        <button
                            className="btn btn-primary"
                            onClick={() => setShowInvoiceModal(true)}
                        >
                            <i className="far fa-file-invoice mr-2"></i> Create Invoice
                        </button>
                        <div className="dropdown dropdown-end">
                            <div tabIndex={0} role="button" className="btn btn-ghost">
                                <i className="far fa-ellipsis-v"></i>
                            </div>
                            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                                <li>
                                    <button onClick={() => setShowAddProjectModal(true)}>
                                        <i className="far fa-plus mr-2"></i>
                                        New Project
                                    </button>
                                </li>                                <li><button onClick={downloadClientPdf} disabled={downloadingPdf}>
                                    {downloadingPdf ? (
                                        <>
                                            <span className="loading loading-spinner loading-xs mr-2"></span>
                                            Generating...
                                        </>
                                    ) : (
                                        <>
                                            <i className="far fa-file-pdf mr-2"></i> Generate & Save PDF
                                        </>
                                    )}
                                </button></li>
                                {client.status === 'archived' ? (
                                    <li>
                                        <button
                                            onClick={handleUnarchiveClient}
                                            disabled={archiveLoading}
                                            className="text-success"
                                            title="Restore this client to active status"
                                        >
                                            {archiveLoading ? (
                                                <>
                                                    <span className="loading loading-spinner loading-sm mr-2"></span>
                                                    Unarchiving...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="far fa-undo mr-2"></i>
                                                    Unarchive Client
                                                </>
                                            )}
                                        </button>
                                    </li>
                                ) : (
                                    <li>
                                        <button
                                            onClick={handleArchiveClient}
                                            disabled={archiveLoading}
                                            className="text-warning"
                                            title="Archive this client - all data will be preserved for compliance"
                                        >
                                            {archiveLoading ? (
                                                <>
                                                    <span className="loading loading-spinner loading-sm mr-2"></span>
                                                    Archiving...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="far fa-archive mr-2"></i>
                                                    Archive Client
                                                </>
                                            )}
                                        </button>
                                    </li>
                                )}
                            </ul>                    </div>
                    </div>
                </div>
            </ErrorBoundary>

            {/* Client Tabs and Content */}
            <ErrorBoundary fallback={(error) => (
                <div className="alert alert-error">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3 className="font-bold">Failed to load client details</h3>
                        <div className="text-xs">Client information is temporarily unavailable. Please refresh the page.</div>
                    </div>
                </div>
            )}>
                <div role="tablist" className="tabs tabs-box mb-6">
                    <a
                        role="tab"
                        className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
                        onClick={() => setActiveTab("overview")}
                    >
                        Overview
                    </a>
                    <a
                        role="tab"
                        className={`tab ${activeTab === "projects" ? "tab-active" : ""}`}
                        onClick={() => setActiveTab("projects")}
                    >
                        Projects ({projects.length})
                    </a>
                    <a
                        role="tab"
                        className={`tab ${activeTab === "contacts" ? "tab-active" : ""}`}
                        onClick={() => setActiveTab("contacts")}
                    >
                        Contacts ({contacts.length})
                    </a>
                    <a
                        role="tab"
                        className={`tab ${activeTab === "interactions" ? "tab-active" : ""}`}
                        onClick={() => setActiveTab("interactions")}
                    >
                        Interactions ({interactions.length})
                    </a>
                    <a
                        role="tab"
                        className={`tab ${activeTab === "documents" ? "tab-active" : ""}`}
                        onClick={() => setActiveTab("documents")}
                    >
                        Documents
                    </a>
                    <a
                        role="tab"
                        className={`tab ${activeTab === "invoices" ? "tab-active" : ""}`}
                        onClick={() => setActiveTab("invoices")}
                    >
                        Invoices
                    </a>
                </div>
                {activeTab === "overview" && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-2">
                            <div className="card bg-base-100 shadow-lg mb-6">
                                <div className="card-body">
                                    <h1 className="text-2xl font-bold">{client.name}</h1>
                                    {clientStatusOptions.badge(client.status as ClientStatus)}
                                    <h3 className="text-lg font-semibold mb-4">Client Information</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <h4 className="text-sm font-medium text-base-content/70">Type</h4>
                                            <p>{client.type}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-base-content/70">Industry</h4>
                                            <p>{client.industry}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-base-content/70">Email</h4>
                                            <p>{client.contact_email || "No email provided"}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-base-content/70">Phone</h4>
                                            <p>{client.contact_phone || "No phone provided"}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-base-content/70">Address</h4>
                                            <p>{client.address || "No address provided"}</p>
                                            <p>{client.city}, {client.state} {client.zip}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-base-content/70">Website</h4>
                                            <p>{client.website ? (
                                                <a href={client.website} target="_blank" rel="noopener noreferrer" className="link link-primary">
                                                    {client.website.replace(/^https?:\/\//, '')}
                                                </a>
                                            ) : "No website provided"}</p>
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-base-content/70 mb-2">Logo</h4>
                                            <div className="flex items-center gap-4">
                                                <div className="avatar">
                                                    <div className="w-16 h-16 rounded-lg bg-base-200 flex items-center justify-center">
                                                        {client.logo_url ? (
                                                            <img
                                                                src={getProxiedMediaUrl(client.logo_url) || ''}
                                                                alt={`${client.name} logo`}
                                                                className="w-full h-full object-cover rounded-lg"
                                                            />
                                                        ) : (
                                                            <i className="far fa-building text-2xl text-base-content/30"></i>
                                                        )}
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="btn btn-outline btn-sm relative">
                                                        {logoUploadLoading ? (
                                                            <>
                                                                <span className="loading loading-spinner loading-xs mr-2"></span>
                                                                Uploading...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <i className="far fa-upload mr-2"></i>
                                                                {client.logo_url ? 'Change Logo' : 'Upload Logo'}
                                                            </>
                                                        )}
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={handleLogoUpload}
                                                            disabled={logoUploadLoading}
                                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                                        />
                                                    </label>
                                                    <p className="text-xs text-base-content/60 mt-1">
                                                        PNG, JPG up to 5MB
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-lg font-semibold">Recent Projects</h3>
                                        <button
                                            className="btn btn-primary btn-sm"
                                            onClick={() => setShowAddProjectModal(true)}
                                        >
                                            <i className="far fa-plus mr-2"></i> New Project
                                        </button>
                                    </div>
                                    {projects.length > 0 ? (
                                        <div className="overflow-x-auto">
                                            <table className="table table-zebra w-full">
                                                <thead>
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Status</th>
                                                        <th>Budget</th>
                                                        <th>Start Date</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {projects.slice(0, 3).map((project) => (
                                                        <tr key={project.id}>
                                                            <td>
                                                                <Link href={`/dashboard/projects/${project.id}`} className="link link-hover font-medium">
                                                                    {project.name}
                                                                </Link>
                                                            </td>
                                                            <td>
                                                                {projectStatusOptions.badge(project.status as ProjectStatus)}
                                                            </td>
                                                            <td>${project.budget?.toLocaleString() || 0}</td>
                                                            <td>{project.start_date ? new Date(project.start_date).toLocaleDateString() : "Not set"}</td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-8">
                                            <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                                            <p className="text-base-content/70 mb-4">Create your first project with this client</p>
                                            <button onClick={() => setShowAddProjectModal(true)} className="btn btn-primary">
                                                <i className="far fa-plus mr-2"></i> Create Project
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="card bg-base-100 shadow-lg mb-6">
                                <div className="card-body">
                                    <h3 className="text-lg font-semibold mb-4">Primary Contact</h3>
                                    {contacts.find(c => c.is_primary) ? (
                                        <div>
                                            <div className="font-medium text-lg">{contacts.find(c => c.is_primary)?.name}</div>
                                            <div className="text-base-content/70">{contacts.find(c => c.is_primary)?.title}</div>
                                            <div className="mt-2">
                                                {contacts.find(c => c.is_primary)?.email && (
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <i className="far fa-envelope text-base-content/50"></i>
                                                        <a href={`mailto:${contacts.find(c => c.is_primary)?.email}`} className="link link-hover">
                                                            {contacts.find(c => c.is_primary)?.email}
                                                        </a>
                                                    </div>
                                                )}
                                                {contacts.find(c => c.is_primary)?.phone && (
                                                    <div className="flex items-center gap-2">
                                                        <i className="far fa-phone text-base-content/50"></i>
                                                        <a href={`tel:${contacts.find(c => c.is_primary)?.phone}`} className="link link-hover">
                                                            {contacts.find(c => c.is_primary)?.phone}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-base-content/70 mb-2">No primary contact set</p>
                                            <button className="btn btn-sm btn-outline" onClick={() => setShowAddContactModal(true)}>
                                                <i className="far fa-plus mr-2"></i> Add Contact
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="card bg-base-100 shadow-lg mb-6">
                                <div className="card-body">
                                    <h3 className="text-lg font-semibold mb-4">Recent Interactions</h3>
                                    {interactions.length > 0 ? (
                                        <div>
                                            {interactions.slice(0, 3).map((interaction) => (
                                                <div key={interaction.id} className="mb-4 pb-4 border-b border-base-200 last:mb-0 last:pb-0 last:border-0">
                                                    <div className="flex justify-between">
                                                        <span className="font-medium">{interaction.type}</span>
                                                        <span className="text-sm text-base-content/70">
                                                            {interaction.date ? new Date(interaction.date).toLocaleDateString() : "Not set"}
                                                        </span>
                                                    </div>
                                                    <p className="mt-1 text-sm">{interaction.summary}</p>
                                                    {interaction.follow_up_date && (
                                                        <div className="mt-2 text-sm bg-base-200 p-2 rounded">
                                                            <span className="font-medium">Follow-up:</span> {new Date(interaction.follow_up_date).toLocaleDateString()} - {interaction.follow_up_task}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            <div className="mt-4 text-center">
                                                <button className="btn btn-sm btn-ghost" onClick={() => setActiveTab("interactions")}>
                                                    View All
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4">
                                            <p className="text-base-content/70 mb-2">No interactions recorded</p>
                                            <button className="btn btn-sm btn-outline" onClick={() => setShowInteractionModal(true)}>
                                                <i className="far fa-plus mr-2"></i> Log Interaction
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="card bg-base-100 shadow-lg">
                                <div className="card-body">
                                    <textarea
                                        className="textarea textarea-bordered w-full h-32"
                                        placeholder="Add notes about this client..."
                                        value={clientNotes}
                                        onChange={(e) => setClientNotes(e.target.value)}
                                    ></textarea>
                                    <div className="mt-4 text-right">
                                        <button className="btn btn-sm btn-primary" onClick={() => handleUpdateClientNotes(clientNotes)}>Save Notes</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === "projects" && (
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Projects</h3>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setShowAddProjectModal(true)}
                                >
                                    <i className="far fa-plus mr-2"></i> New Project
                                </button>
                            </div>
                            {projects.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra w-full">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Status</th>
                                                <th>Budget</th>
                                                <th>Start Date</th>
                                                <th>End Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {projects.map((project) => (
                                                <tr key={project.id}>
                                                    <td>
                                                        <Link href={`/dashboard/projects/${project.id}`} className="link link-hover font-medium">
                                                            {project.name}
                                                        </Link>
                                                    </td>
                                                    <td>
                                                        {projectStatusOptions.badge(project.status as ProjectStatus)}
                                                    </td>
                                                    <td>${project.budget?.toLocaleString() || 0}</td>
                                                    <td>{project.start_date ? new Date(project.start_date).toLocaleDateString() : "Not set"}</td>
                                                    <td>{project.end_date ? new Date(project.end_date).toLocaleDateString() : "Not set"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <h3 className="text-xl font-semibold mb-2">No projects yet</h3>
                                    <p className="text-base-content/70 mb-4">Create your first project with this client</p>
                                    <Link href={`/dashboard/projects/create?client=${client.id}`} className="btn btn-primary">
                                        <i className="far fa-plus mr-2"></i> Create Project
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === "contacts" && (
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Contacts</h3>
                                <button className="btn btn-primary btn-sm" onClick={() => setShowAddContactModal(true)}>
                                    <i className="far fa-plus mr-2"></i> Add Contact
                                </button>
                            </div>
                            {contacts.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra w-full">
                                        <thead>
                                            <tr>
                                                <th>Name</th>
                                                <th>Title</th>
                                                <th>Email</th>
                                                <th>Phone</th>
                                                <th>Primary</th>
                                                <th></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {contacts.map((contact) => (
                                                <tr key={contact.id}>
                                                    <td>{contact.name}</td>
                                                    <td>{contact.title}</td>
                                                    <td>
                                                        {contact.email && (
                                                            <a href={`mailto:${contact.email}`} className="link link-hover">
                                                                {contact.email}
                                                            </a>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {contact.phone && (
                                                            <a href={`tel:${contact.phone}`} className="link link-hover">
                                                                {contact.phone}
                                                            </a>
                                                        )}
                                                    </td>
                                                    <td>
                                                        {contact.is_primary && (
                                                            <div className="badge badge-primary">Primary</div>
                                                        )}
                                                    </td>
                                                    <td className="text-right">
                                                        <button className="btn btn-ghost btn-xs" onClick={() => handleEditContactOpen(contact)}>
                                                            <i className="far fa-edit fa-lg"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <h3 className="text-xl font-semibold mb-2">No contacts found</h3>
                                    <p className="text-base-content/70 mb-4">Add contacts to manage relationships with this client</p>
                                    <button className="btn btn-primary" onClick={() => setShowAddContactModal(true)}>
                                        <i className="far fa-plus mr-2"></i> Add Contact
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )}
                {activeTab === "interactions" && (
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Interactions</h3>
                                <button className="btn btn-primary btn-sm" onClick={() => setShowInteractionModal(true)}>
                                    <i className="far fa-plus mr-2"></i> Log Interaction
                                </button>
                            </div>
                            {interactions.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="table table-zebra w-full">
                                        <thead>
                                            <tr>
                                                <th>Date</th>
                                                <th>Type</th>
                                                <th>Summary</th>
                                                <th>Staff</th>
                                                <th>Follow-up</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {interactions.map((interaction) => (
                                                <tr key={interaction.id}>
                                                    <td>{interaction.date ? new Date(interaction.date).toLocaleDateString() : "Not set"}</td>
                                                    <td>{interaction.type}</td>
                                                    <td>{interaction.summary}</td>
                                                    <td>{interaction.staff}</td>
                                                    <td>
                                                        {interaction.follow_up_date && (
                                                            <div>
                                                                <div className="font-medium">{new Date(interaction.follow_up_date).toLocaleDateString()}</div>
                                                                <div className="text-sm text-base-content/70">{interaction.follow_up_task}</div>
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="text-right">
                                                        <button className="btn btn-ghost btn-xs" onClick={() => handleEditInteractionOpen(interaction)}>
                                                            <i className="far fa-edit"></i>
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <h3 className="text-xl font-semibold mb-2">No interactions found</h3>
                                    <p className="text-base-content/70 mb-4">Log interactions to track your communication with this client</p>
                                    <button className="btn btn-primary" onClick={() => setShowInteractionModal(true)}>
                                        <i className="far fa-plus mr-2"></i> Log Interaction
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>)}
                {activeTab === "documents" && (
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <UniversalMediaManager
                                mode="both"
                                entityType="client"
                                onUpload={handleMediaUpload}
                                availableMedia={availableMedia}
                                linkedMedia={linkedMedia}
                                onLink={handleMediaLink}
                                onUnlink={handleMediaUnlink}
                                title="Client Documents & Media"
                                description="Upload and manage documents, images, and other files related to this client."
                            />
                        </div>
                    </div>
                )}
                {activeTab === "invoices" && (
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Invoices</h3>
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => setShowInvoiceModal(true)}
                                >
                                    <i className="far fa-file-invoice mr-2"></i> Create Invoice
                                </button>
                            </div>
                            <div className="text-center py-8">
                                <h3 className="text-xl font-semibold mb-2">No invoices found</h3>
                                <p className="text-base-content/70 mb-4">Create your first invoice for this client</p>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setShowInvoiceModal(true)}
                                >
                                    <i className="far fa-file-invoice mr-2"></i> Create Invoice
                                </button>
                            </div>                    </div>
                    </div>
                )}
            </ErrorBoundary>

            {/* Edit Client Modal */}
            <ClientModal
                isOpen={showEditClientModal}
                client={client}
                onClose={() => setShowEditClientModal(false)}
                onSubmit={handleUpdateClient}
            />

            {/* Add Contact Modal */}
            {showAddContactModal && (
                <ModalContact
                    title="Add New Contact"
                    loading={contactLoading}
                    onClose={() => setShowAddContactModal(false)}
                    onSubmit={handleAddContact}
                    clientName={client.name}
                />
            )}

            {showInteractionModal && (
                <InteractionModal
                    isOpen={showInteractionModal}
                    clientId={client.id}
                    interaction={interaction as ClientInteraction}
                    onClose={() => setShowInteractionModal(false)}
                    onSubmit={handleAddInteraction}
                />
            )}

            {/* Edit Contact Modal */}
            {showEditContactModal && editContact && (
                <ModalContact
                    title="Edit Contact"
                    loading={editContactLoading}
                    onClose={handleEditContactClose}
                    onSubmit={handleEditContactSubmit}
                    initialData={{
                        id: editContact.id,
                        name: editContact.name || "",
                        title: editContact.title || "",
                        email: editContact.email || "",
                        phone: editContact.phone || "",
                        is_primary: editContact.is_primary || false
                    }}
                    clientName={client.name}
                />
            )}

            {/* Edit Interaction Modal */}
            {showEditInteractionModal && editInteraction && (
                <InteractionModal
                    clientId={client.id}
                    interaction={editInteraction}
                    isOpen={showEditInteractionModal}
                    onClose={() => {
                        setShowEditInteractionModal(false);
                        setEditInteraction(null);
                    }}
                    onSubmit={handleEditInteractionSubmit}
                />
            )}

            {/* Add Project Modal */}
            {showAddProjectModal && (
                <ModalProject
                    title="Add New Project"
                    loading={false}
                    onClose={() => setShowAddProjectModal(false)}
                    onSubmit={handleAddProject}
                    clientName={client.name}
                />
            )}            {/* Invoice Modal */}
            {showInvoiceModal && (
                <ModalInvoice
                    title="Create Invoice"
                    loading={invoiceLoading}
                    onClose={() => setShowInvoiceModal(false)}
                    onSubmit={handleCreateInvoice}
                    clientName={client.name}
                    clientId={client.id}
                    projects={projects}
                />
            )}
        </div>
    )
}
