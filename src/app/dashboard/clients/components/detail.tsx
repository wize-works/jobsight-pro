"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useKindeAuth } from "@kinde-oss/kinde-auth-nextjs";
import { createClientContact, updateClientContact } from "@/app/actions/client-contacts";
import { createClientInteraction, updateClientInteraction } from "@/app/actions/client-interactions";
import { createProject } from "@/app/actions/projects";
import { date } from "zod";
import { toast } from "@/hooks/use-toast";
import { ClientContact, ClientContactInsert, ClientContactUpdate } from "@/types/client-contacts";
import { ClientInteraction, ClientInteractionInsert, ClientInteractionUpdate } from "@/types/client-interactions";
import { updateClientNotes, updateClient } from "@/app/actions/clients";
import { Project, ProjectStatus, projectStatusOptions } from "@/types/projects";
import { Client, ClientStatus, clientStatusOptions } from "@/types/clients";
import ClientEditForm from "../components/modal-edit";
import InteractionModal from "./modal-interaction";
import ModalProject from "./modal-project";
import ModalContact from "./modal-contact";
import ModalMediaUpload from "./modal-media-upload";
import ModalAttachMedia from "./modal-media-attach";
import { uploadClientMedia, getMediaByClientId, getAvailableMediaForClient, linkExistingMediaToClient, uploadClientLogo } from "@/app/actions/media";
import { MediaType, Media } from "@/types/media";
import { useBusiness } from "@/lib/business-context";
import { getProxiedMediaUrl } from "@/lib/media-utils";

interface ClientDetailProps {
    client: Client;
    projects: Project[];
    contacts: ClientContact[];
    interactions: ClientInteraction[];
}

export default function ClientDetailComponent({
    client,
    projects,
    contacts,
    interactions,
}: ClientDetailProps) {
    const { businessId } = useBusiness();
    const { user } = useKindeAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState("overview");
    const [showAddContactModal, setShowAddContactModal] = useState(false);
    const [contactLoading, setContactLoading] = useState(false);
    const [showEditContactModal, setShowEditContactModal] = useState(false);
    const [editContactLoading, setEditContactLoading] = useState(false);
    const [showInteractionModal, setShowInteractionModal] = useState(false);
    const [showEditClientModal, setShowEditClientModal] = useState(false);
    const [interaction, setInteraction] = useState<Partial<ClientInteractionInsert> | null>(null);
    const [editContact, setEditContact] = useState<any | null>(null); const [editInteraction, setEditInteraction] = useState<any | null>(null);
    const [showEditInteractionModal, setShowEditInteractionModal] = useState(false);
    const [clientNotes, setClientNotes] = useState(client.notes || ""); const [showAddProjectModal, setShowAddProjectModal] = useState(false);
    const [showMediaUploadModal, setShowMediaUploadModal] = useState(false);
    const [mediaUploadLoading, setMediaUploadLoading] = useState(false); const [showAttachMediaModal, setShowAttachMediaModal] = useState(false);
    const [attachMediaLoading, setAttachMediaLoading] = useState(false);
    const [availableMedia, setAvailableMedia] = useState<Media[]>([]);
    const [logoUploadLoading, setLogoUploadLoading] = useState(false);

    if (!client) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        )
    } const handleAddContact = async (formData: any): Promise<{ success: boolean }> => {
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
            toast.success({
                title: "Contact created",
                description: "Your contact has been created successfully.",
                autoClose: true,
            });
            router.refresh(); // Refresh the page to show the new contact
            return { success: true };
        } catch (error) {
            console.error("Error creating contact:", error);
            toast.error({
                title: "Error creating contact",
                description: "There was an error creating the contact.",
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
            router.refresh(); // Refresh the page to show the new interaction
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
            await createProject(businessId, {
                id: "",
                business_id: "",
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
                created_by: null,
                created_at: null,
                updated_by: null,
                updated_at: null
            });

            toast.success({
                title: "Project created",
                description: "Your project has been created successfully.",
                autoClose: true,
            });

            router.refresh();
            return { success: true };
        } catch (error) {
            toast.error({
                title: "Error creating project",
                description: "There was an error creating the project.",
            });
            throw error;
        }
    }; const handleEditContactOpen = (contact: any) => {
        setEditContact(contact);
        setShowEditContactModal(true);
    };

    const handleEditContactClose = () => {
        setShowEditContactModal(false);
        setEditContact(null);
    }; const handleEditContactSubmit = async (formData: any): Promise<{ success: boolean }> => {
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

    const handleEditInteractionOpen = (interaction: any) => {
        setEditInteraction({
            ...interaction,
            followUpDate: interaction.follow_up_date || null,
            followUpTask: interaction.follow_up_task || null
        });
        setShowEditInteractionModal(true);
    };

    const handleEditInteractionChange = (field: string, value: any) => {
        setEditInteraction((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleEditInteractionSubmit = async () => {
        if (!editInteraction) return;
        const updatedInteraction = {
            type: editInteraction.type,
            summary: editInteraction.summary,
            staff: editInteraction.staff,
            follow_up_date: editInteraction.followUpDate || null,
            follow_up_task: editInteraction.followUpTask || null,
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
        } as ClientInteractionUpdate;
        try {
            await updateClientInteraction(businessId, editInteraction.id, updatedInteraction);
            toast.success({
                title: "Interaction updated",
                description: "Your interaction has been updated successfully.",
                autoClose: true,
            });
            router.refresh();
        } catch (error) {
            console.error("Error updating interaction:", error);
            toast.error({
                title: "Error updating interaction",
                description: "There was an error updating the interaction.",
            });
        } finally {
            setShowEditInteractionModal(false);
            setEditInteraction(null);
        }
    };

    const handleMediaUpload = async (formData: any): Promise<{ success: boolean }> => {
        setMediaUploadLoading(true);

        try {
            const success = await uploadClientMedia(
                businessId,
                client.id,
                formData.file,
                formData.type as MediaType,
                formData.description,
                formData.tags
            );

            if (success) {
                toast.success({
                    title: "Media uploaded",
                    description: "Your file has been uploaded successfully.",
                    autoClose: true,
                });
                router.refresh();
                return { success: true };
            } else {
                toast.error({
                    title: "Upload failed",
                    description: "There was an error uploading the file.",
                });
                return { success: false };
            }
        } catch (error) {
            console.error("Error uploading media:", error);
            toast.error({
                title: "Upload failed",
                description: "There was an error uploading the file.",
            });
            return { success: false };
        } finally {
            setMediaUploadLoading(false);
        }
    };

    const handleAttachMediaOpen = async () => {
        setAttachMediaLoading(true);
        try {
            const media = await getAvailableMediaForClient(businessId, client.id);
            setAvailableMedia(media);
            setShowAttachMediaModal(true);
        } catch (error) {
            console.error("Error loading available media:", error);
            toast.error({
                title: "Error loading media",
                description: "There was an error loading available media.",
            });
        } finally {
            setAttachMediaLoading(false);
        }
    };

    const handleAttachMedia = async (mediaIds: string[]): Promise<{ success: boolean }> => {
        setAttachMediaLoading(true);

        try {
            const success = await linkExistingMediaToClient(businessId, mediaIds, client.id);

            if (success) {
                toast.success({
                    title: "Media attached",
                    description: `Successfully attached ${mediaIds.length} file${mediaIds.length !== 1 ? 's' : ''} to ${client.name}.`,
                    autoClose: true,
                });
                router.refresh();
                return { success: true };
            } else {
                toast.error({
                    title: "Attach failed",
                    description: "There was an error attaching the media files.",
                });
                return { success: false };
            }
        } catch (error) {
            console.error("Error attaching media:", error);
            toast.error({
                title: "Attach failed",
                description: "There was an error attaching the media files.",
            });
            return { success: false };
        } finally {
            setAttachMediaLoading(false);
        }
    };

    const handleUpdateClientNotes = async (notes: string) => {
        try {
            await updateClientNotes(businessId, client.id, notes);
            toast.success({
                title: "Notes updated",
                description: "Client notes have been updated successfully.",
                autoClose: true,
            });
            //router.refresh();
        } catch (error) {
            toast.error({
                title: "Error updating notes",
                description: "There was an error updating the client notes.",
            });
        }
    }

    const handleUpdateClient = async (formData: any) => {
        try {
            const clientData = {
                id: client.id,
                business_id: client.business_id,
                name: formData.name ?? client.name,
                type: formData.type ?? client.type,
                industry: formData.industry ?? client.industry,
                contact_name: formData.contact ?? client.contact_name,
                contact_email: formData.email ?? client.contact_email,
                contact_phone: formData.phone ?? client.contact_phone,
                website: formData.website ?? client.website,
                address: formData.address ?? client.address,
                city: formData.city ?? client.city,
                state: formData.state ?? client.state,
                zip: formData.zip ?? client.zip,
                country: formData.country ?? client.country,
                tax_id: formData.taxId ?? client.tax_id,
                notes: formData.notes ?? client.notes,
                logo_url: formData.logoUrl ?? client.logo_url,
                status: formData.status ?? client.status,
                created_at: client.created_at,
                created_by: client.created_by,
                updated_at: new Date().toISOString(),
                updated_by: user?.id || null
            };

            await updateClient(businessId, client.id, clientData);
            setShowEditClientModal(false);
            toast.success({
                title: "Client updated",
                description: "Client information has been updated successfully.",
                autoClose: true,
            });
            router.refresh();
        } catch (error) {
            console.error("Error updating client:", error);
            toast.error({
                title: "Error updating client",
                description: "There was an error updating the client information.",
            });
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
            const result = await uploadClientLogo(businessId, client.id, file);
            if (result.success) {
                toast.success({
                    title: "Logo uploaded",
                    description: "Client logo has been updated successfully.",
                    autoClose: true,
                });
                router.refresh();
            } else {
                throw new Error("Upload failed");
            }
        } catch (error) {
            console.error("Error uploading logo:", error);
            toast.error({
                title: "Upload failed",
                description: "There was an error uploading the logo.",
            });
        } finally {
            setLogoUploadLoading(false);
            // Reset the input
            if (event.target) {
                event.target.value = '';
            }
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href={`/dashboard/clients`} className="btn btn-ghost btn-sm mr-2">
                            <i className="far fa-arrow-left"></i>
                        </Link>
                        <h1 className="text-2xl font-bold">{client.name}</h1>
                        {clientStatusOptions.badge(client.status as ClientStatus)}
                    </div>
                </div>                <div className="flex gap-2">
                    <button
                        onClick={() => setShowEditClientModal(true)}
                        className="btn btn-outline btn-sm"
                    >
                        <i className="far fa-edit mr-2"></i> Edit
                    </button>
                    <button className="btn btn-primary btn-sm">
                        <i className="far fa-file-invoice mr-2"></i> Create Invoice
                    </button>
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                            <i className="far fa-ellipsis-v"></i>
                        </div>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                            <li>
                                <button onClick={() => setShowAddProjectModal(true)}>
                                    <i className="far fa-plus mr-2"></i>
                                    New Project
                                </button>
                            </li>
                            <li><a><i className="far fa-file-pdf mr-2"></i> Export as PDF</a></li>
                            <li><a><i className="far fa-trash mr-2"></i> Delete Client</a></li>
                        </ul>
                    </div>
                </div>
            </div>

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
                        <div className="card bg-base-100 shadow-sm mb-6">
                            <div className="card-body">
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
                                    </div>                                    <div>
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
                                                <div className="w-16 h-16 rounded-lg bg-base-200 flex items-center justify-center">                                                    {client.logo_url ? (
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

                        <div className="card bg-base-100 shadow-sm">
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
                        <div className="card bg-base-100 shadow-sm mb-6">
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

                        <div className="card bg-base-100 shadow-sm mb-6">
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

                        <div className="card bg-base-100 shadow-sm">
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

            {
                activeTab === "projects" && (
                    <div className="card bg-base-100 shadow-sm">
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
                )
            }

            {
                activeTab === "contacts" && (
                    <div className="card bg-base-100 shadow-sm">
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
                )
            }

            {
                activeTab === "interactions" && (
                    <div className="card bg-base-100 shadow-sm">
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
                    </div>
                )
            }            {
                activeTab === "documents" && (
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Media</h3>
                                <div className="flex gap-2">
                                    <button
                                        className="btn btn-outline btn-sm"
                                        onClick={handleAttachMediaOpen}
                                        disabled={attachMediaLoading}
                                    >
                                        {attachMediaLoading ? (
                                            <span className="loading loading-spinner loading-sm mr-2"></span>
                                        ) : (
                                            <i className="far fa-link mr-2"></i>
                                        )}
                                        Attach Existing
                                    </button>
                                    <button
                                        className="btn btn-primary btn-sm"
                                        onClick={() => setShowMediaUploadModal(true)}
                                    >
                                        <i className="far fa-upload mr-2"></i> Upload New
                                    </button>
                                </div>
                            </div>
                            <div className="text-center py-8">
                                <h3 className="text-xl font-semibold mb-2">No media or document yet</h3>
                                <p className="text-base-content/70 mb-4">Upload new media or attach existing ones to this client</p>
                                <div className="flex gap-3 justify-center">
                                    <button
                                        className="btn btn-outline"
                                        onClick={handleAttachMediaOpen}
                                        disabled={attachMediaLoading}
                                    >
                                        {attachMediaLoading ? (
                                            <span className="loading loading-spinner loading-sm mr-2"></span>
                                        ) : (
                                            <i className="far fa-link mr-2"></i>
                                        )}
                                        Attach Existing
                                    </button>
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => setShowMediaUploadModal(true)}
                                    >
                                        <i className="far fa-upload mr-2"></i> Upload New
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {activeTab === "invoices" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Invoices</h3>
                            <button className="btn btn-primary btn-sm">
                                <i className="far fa-file-invoice mr-2"></i> Create Invoice
                            </button>
                        </div>
                        <div className="text-center py-8">
                            <h3 className="text-xl font-semibold mb-2">No invoices found</h3>
                            <p className="text-base-content/70 mb-4">Create your first invoice for this client</p>
                            <button className="btn btn-primary">
                                <i className="far fa-file-invoice mr-2"></i> Create Invoice
                            </button>
                        </div>
                    </div>
                </div>
            )
            }        {/* Edit Client Modal */}
            {showEditClientModal && (
                <ClientEditForm isOpen={showEditClientModal} client={client} onClose={() => setShowEditClientModal(false)} onSubmit={handleUpdateClient} />)}

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
            )}            {/* Edit Contact Modal */}
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
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Edit Interaction</h3>
                        <form onSubmit={e => { e.preventDefault(); handleEditInteractionSubmit(); }}>
                            <div className="form-control mb-3">
                                <label className="label">
                                    <span className="label-text">Type</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={editInteraction.type}
                                    onChange={e => handleEditInteractionChange("type", e.target.value)}
                                    required
                                >
                                    <option value="Meeting">Meeting</option>
                                    <option value="Call">Call</option>
                                    <option value="Email">Email</option>
                                    <option value="Other">Other</option>
                                </select>
                            </div>
                            <div className="form-control mb-3">
                                <label className="label">
                                    <span className="label-text">Summary</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered h-24"
                                    value={editInteraction.summary}
                                    onChange={e => handleEditInteractionChange("summary", e.target.value)}
                                    required
                                ></textarea>
                            </div>
                            <div className="form-control mb-3">
                                <label className="label">
                                    <span className="label-text">Staff Member</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={editInteraction.staff}
                                    onChange={e => handleEditInteractionChange("staff", e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-control mb-3">
                                <label className="label">
                                    <span className="label-text">Follow-up Date (Optional)</span>
                                </label>
                                <input
                                    type="date"
                                    className="input input-bordered"
                                    value={editInteraction.followUpDate}
                                    onChange={e => handleEditInteractionChange("followUpDate", e.target.value)}
                                />
                            </div>
                            <div className="form-control mb-6">
                                <label className="label">
                                    <span className="label-text">Follow-up Task (Optional)</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={editInteraction.followUpTask}
                                    onChange={e => handleEditInteractionChange("followUpTask", e.target.value)}
                                />
                            </div>
                            <div className="modal-action">
                                <button type="button" className="btn" onClick={() => { setShowEditInteractionModal(false); setEditInteraction(null); }}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    </div>                </div>
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
            )}

            {/* Media Upload Modal */}
            {showMediaUploadModal && (
                <ModalMediaUpload
                    title="Upload Media"
                    loading={mediaUploadLoading}
                    onClose={() => setShowMediaUploadModal(false)}
                    onSubmit={handleMediaUpload}
                    clientName={client.name}
                />
            )}            {/* Attach Media Modal */}
            {showAttachMediaModal && (
                <ModalAttachMedia
                    title="Attach Existing Media"
                    loading={attachMediaLoading}
                    onClose={() => setShowAttachMediaModal(false)}
                    onSubmit={handleAttachMedia}
                    availableMedia={availableMedia}
                    clientName={client.name}
                />
            )}
        </div >
    )
}
