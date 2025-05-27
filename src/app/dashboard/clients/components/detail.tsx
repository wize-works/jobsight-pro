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
import { ClientContactInsert, ClientContactUpdate } from "@/types/client-contacts";
import { ClientInteractionInsert, ClientInteractionUpdate } from "@/types/client-interactions";
import { updateClientNotes } from "@/app/actions/clients";

// Status options with colors and labels
const statusOptions = {
    active: { label: "Active", color: "badge-success" },
    inactive: { label: "Inactive", color: "badge-neutral" },
    prospect: { label: "Prospect", color: "badge-warning" },
}

// Project status options with colors and labels
const projectStatusOptions = {
    "in_progress": { label: "In Progress", color: "badge-primary" },
    completed: { label: "Completed", color: "badge-success" },
    "on_hold": { label: "On Hold", color: "badge-warning" },
    cancelled: { label: "Cancelled", color: "badge-error" },
}

interface ClientDetailProps {
    client: any;
    projects: any[];
    contacts: any[];
    interactions: any[];
    businessId: string;
}

export default function ClientDetailComponent({
    client,
    projects,
    contacts,
    interactions,
    businessId,
}: ClientDetailProps) {
    const { user } = useKindeAuth();
    const router = useRouter()
    const [activeTab, setActiveTab] = useState("overview")
    const [showAddContactModal, setShowAddContactModal] = useState(false)
    const [showAddInteractionModal, setShowAddInteractionModal] = useState(false)
    const [newContact, setNewContact] = useState({
        name: "",
        title: "",
        email: "",
        phone: "",
        isPrimary: false,
    })
    const [newInteraction, setNewInteraction] = useState({
        type: "Meeting",
        summary: "",
        staff: "",
        date: null,
        followUpDate: "",
        followUpTask: "",
    })
    const [editContact, setEditContact] = useState<any | null>(null);
    const [showEditContactModal, setShowEditContactModal] = useState(false);
    const [editInteraction, setEditInteraction] = useState<any | null>(null);
    const [showEditInteractionModal, setShowEditInteractionModal] = useState(false);
    const [clientNotes, setClientNotes] = useState(client.notes || "");
    const [showAddProjectModal, setShowAddProjectModal] = useState(false);
    const [newProject, setNewProject] = useState({
        name: "",
        type: "",
        status: "in_progress",
        start_date: "",
        end_date: "",
        budget: "",
        location: "",
        description: "",
    });
    const [isSubmittingProject, setIsSubmittingProject] = useState(false);

    if (!client) {
        return (
            <div className="flex items-center justify-center h-64">
                <span className="loading loading-spinner loading-lg text-primary"></span>
            </div>
        )
    }

    const handleAddContact = async () => {
        const contactData = {
            name: newContact.name,
            title: newContact.title,
            email: newContact.email,
            phone: newContact.phone,
            is_primary: newContact.isPrimary,
            client_id: client.id,
            created_by: user?.id,
            created_at: new Date().toISOString(),
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
        } as ClientContactInsert;

        try {
            await createClientContact(contactData);
            toast.success({
                title: "Contact created",
                description: "Your contact has been created successfully.",
                autoClose: true,
            });
            router.refresh(); // Refresh the page to show the new contact
        } catch (error) {
            console.error("Error creating contact:", error);
            toast.error({
                title: "Error creating contact",
                description: "There was an error creating the contact.",
            });
        } finally {
            setShowAddContactModal(false);
        }
    }

    const handleAddInteraction = async () => {

        const interactionData = {
            client_id: client.id,
            business_id: businessId,
            type: newInteraction.type,
            date: new Date().toISOString(),
            summary: newInteraction.summary,
            staff: newInteraction.staff,
            follow_up_date: newInteraction.followUpDate || null,
            follow_up_task: newInteraction.followUpTask || null,
            created_by: user?.id,
            created_at: new Date().toISOString(),
            updated_by: user?.id,
            updated_at: new Date().toISOString(),
        } as ClientInteractionInsert;
        try {
            await createClientInteraction(interactionData);
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
            setShowAddInteractionModal(false);
        }
    }

    const handleAddProject = async () => {
        setIsSubmittingProject(true);
        try {
            await createProject({
                id: "",
                name: newProject.name,
                type: newProject.type || null,
                status: newProject.status,
                start_date: newProject.start_date || null,
                end_date: newProject.end_date || null,
                budget: newProject.budget ? Number(newProject.budget) : null,
                location: newProject.location || null,
                description: newProject.description || null,
                client_id: client.id,
                business_id: businessId,
                manager_id: null,
                progress: null,
                created_by: null,
                created_at: null,
                updated_by: null,
                updated_at: null
            });
            setShowAddProjectModal(false);
            setNewProject({
                name: "",
                type: "",
                status: "in_progress",
                start_date: "",
                end_date: "",
                budget: "",
                location: "",
                description: "",
            });
            toast.success({
                title: "Project created",
                description: "Your project has been created successfully.",
                autoClose: true,
            });
            router.refresh();
        } catch (error) {
            toast.error({
                title: "Error creating project",
                description: "There was an error creating the project.",
            });
        } finally {
            setIsSubmittingProject(false);
        }
    };

    const handleEditContactOpen = (contact: any) => {
        setEditContact({
            ...contact,
            isPrimary: contact.is_primary // normalize for form
        });
        setShowEditContactModal(true);
    };

    const handleEditContactChange = (field: string, value: any) => {
        setEditContact((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleEditContactSubmit = async () => {
        if (!editContact) return;
        const updatedContact = {
            name: editContact.name,
            title: editContact.title,
            email: editContact.email,
            phone: editContact.phone,
            is_primary: editContact.isPrimary
        } as ClientContactUpdate;
        try {
            await updateClientContact(editContact.id, updatedContact);
            toast.success({
                title: "Contact updated",
                description: "Your contact has been updated successfully.",
                autoClose: true,
            });
            router.refresh();
        } catch (error) {
            console.error("Error updating contact:", error);
            toast.error({
                title: "Error updating contact",
                description: "There was an error updating the contact.",
            });
        } finally {
            setShowEditContactModal(false);
            setEditContact(null);
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
            await updateClientInteraction(editInteraction.id, updatedInteraction);
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

    const handleUpdateClientNotes = async (notes: string) => {
        try {
            await updateClientNotes(client.id, notes);
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

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href={`/dashboard/clients`} className="btn btn-ghost btn-sm mr-2">
                            <i className="fas fa-arrow-left"></i>
                        </Link>
                        <h1 className="text-2xl font-bold">{client.name}</h1>
                        <div className={`badge ${statusOptions[client.status as keyof typeof statusOptions]?.color || "badge-neutral"}`}>
                            {statusOptions[client.status as keyof typeof statusOptions]?.label || client.status}
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href={`/dashboard/clients/${client.id}/edit`} className="btn btn-outline btn-sm">
                        <i className="fas fa-edit mr-2"></i> Edit
                    </Link>
                    <button className="btn btn-primary btn-sm">
                        <i className="fas fa-file-invoice mr-2"></i> Create Invoice
                    </button>
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-ghost btn-sm">
                            <i className="fas fa-ellipsis-v"></i>
                        </div>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                            <li>
                                <button onClick={() => setShowAddProjectModal(true)}>
                                    <i className="fas fa-plus mr-2"></i>
                                    New Project
                                </button>
                            </li>
                            <li><a><i className="fas fa-file-pdf mr-2"></i> Export as PDF</a></li>
                            <li><a><i className="fas fa-trash mr-2"></i> Delete Client</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div role="tablist" className="tabs tabs-sm tabs-boxed mb-6 bg-base-100 p-1 rounded-lg">
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
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                                        <i className="fas fa-plus mr-2"></i> New Project
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
                                                            <div className={`badge ${projectStatusOptions[project.status as keyof typeof projectStatusOptions]?.color || "badge-neutral"}`}>
                                                                {projectStatusOptions[project.status as keyof typeof projectStatusOptions]?.label || project.status}
                                                            </div>
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
                                            <i className="fas fa-plus mr-2"></i> Create Project
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
                                                    <i className="fas fa-envelope text-base-content/50"></i>
                                                    <a href={`mailto:${contacts.find(c => c.is_primary)?.email}`} className="link link-hover">
                                                        {contacts.find(c => c.is_primary)?.email}
                                                    </a>
                                                </div>
                                            )}
                                            {contacts.find(c => c.is_primary)?.phone && (
                                                <div className="flex items-center gap-2">
                                                    <i className="fas fa-phone text-base-content/50"></i>
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
                                            <i className="fas fa-plus mr-2"></i> Add Contact
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
                                                    <span className="text-sm text-base-content/70">{new Date(interaction.date).toLocaleDateString()}</span>
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
                                        <button className="btn btn-sm btn-outline" onClick={() => setShowAddInteractionModal(true)}>
                                            <i className="fas fa-plus mr-2"></i> Log Interaction
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
                                    <i className="fas fa-plus mr-2"></i> New Project
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
                                                        <div className={`badge ${projectStatusOptions[project.status as keyof typeof projectStatusOptions]?.color || "badge-neutral"}`}>
                                                            {projectStatusOptions[project.status as keyof typeof projectStatusOptions]?.label || project.status}
                                                        </div>
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
                                        <i className="fas fa-plus mr-2"></i> Create Project
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
                                    <i className="fas fa-plus mr-2"></i> Add Contact
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
                                                            <i className="fas fa-edit fa-lg"></i>
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
                                        <i className="fas fa-plus mr-2"></i> Add Contact
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
                                <button className="btn btn-primary btn-sm" onClick={() => setShowAddInteractionModal(true)}>
                                    <i className="fas fa-plus mr-2"></i> Log Interaction
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
                                                    <td>{new Date(interaction.date).toLocaleDateString()}</td>
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
                                                            <i className="fas fa-edit"></i>
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
                                    <button className="btn btn-primary" onClick={() => setShowAddInteractionModal(true)}>
                                        <i className="fas fa-plus mr-2"></i> Log Interaction
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                )
            }

            {
                activeTab === "documents" && (
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Documents</h3>
                                <button className="btn btn-primary btn-sm">
                                    <i className="fas fa-upload mr-2"></i> Upload
                                </button>
                            </div>
                            <div className="text-center py-8">
                                <h3 className="text-xl font-semibold mb-2">No documents yet</h3>
                                <p className="text-base-content/70 mb-4">Upload documents related to this client</p>
                                <button className="btn btn-primary">
                                    <i className="fas fa-upload mr-2"></i> Upload Document
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {
                activeTab === "invoices" && (
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold">Invoices</h3>
                                <button className="btn btn-primary btn-sm">
                                    <i className="fas fa-file-invoice mr-2"></i> Create Invoice
                                </button>
                            </div>
                            <div className="text-center py-8">
                                <h3 className="text-xl font-semibold mb-2">No invoices found</h3>
                                <p className="text-base-content/70 mb-4">Create your first invoice for this client</p>
                                <button className="btn btn-primary">
                                    <i className="fas fa-file-invoice mr-2"></i> Create Invoice
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Add Contact Modal */}
            {
                showAddContactModal && (
                    <div className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg mb-4">Add New Contact</h3>
                            <form onSubmit={(e) => { e.preventDefault(); handleAddContact(); }}>
                                <div className="form-control mb-3">
                                    <label className="label">
                                        <span className="label-text">Name</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={newContact.name}
                                        onChange={(e) => setNewContact({ ...newContact, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="form-control mb-3">
                                    <label className="label">
                                        <span className="label-text">Title / Position</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={newContact.title}
                                        onChange={(e) => setNewContact({ ...newContact, title: e.target.value })}
                                    />
                                </div>
                                <div className="form-control mb-3">
                                    <label className="label">
                                        <span className="label-text">Email</span>
                                    </label>
                                    <input
                                        type="email"
                                        className="input input-bordered"
                                        value={newContact.email}
                                        onChange={(e) => setNewContact({ ...newContact, email: e.target.value })}
                                    />
                                </div>
                                <div className="form-control mb-3">
                                    <label className="label">
                                        <span className="label-text">Phone</span>
                                    </label>
                                    <input
                                        type="tel"
                                        className="input input-bordered"
                                        value={newContact.phone}
                                        onChange={(e) => setNewContact({ ...newContact, phone: e.target.value })}
                                    />
                                </div>
                                <div className="form-control mb-6">
                                    <label className="label cursor-pointer">
                                        <span className="label-text">Set as Primary Contact</span>
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary"
                                            checked={newContact.isPrimary}
                                            onChange={(e) => setNewContact({ ...newContact, isPrimary: e.target.checked })}
                                        />
                                    </label>
                                </div>
                                <div className="modal-action">
                                    <button type="button" className="btn" onClick={() => setShowAddContactModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Add Contact
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Add Interaction Modal */}
            {
                showAddInteractionModal && (
                    <div className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg mb-4">Log New Interaction</h3>
                            <form onSubmit={(e) => { e.preventDefault(); handleAddInteraction(); }}>
                                <div className="form-control mb-3">
                                    <label className="label">
                                        <span className="label-text">Type</span>
                                    </label>
                                    <select
                                        className="select select-bordered w-full"
                                        value={newInteraction.type}
                                        onChange={(e) => setNewInteraction({ ...newInteraction, type: e.target.value })}
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
                                        value={newInteraction.summary}
                                        onChange={(e) => setNewInteraction({ ...newInteraction, summary: e.target.value })}
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
                                        value={newInteraction.staff}
                                        onChange={(e) => setNewInteraction({ ...newInteraction, staff: e.target.value })}
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
                                        value={newInteraction.followUpDate}
                                        onChange={(e) => setNewInteraction({ ...newInteraction, followUpDate: e.target.value })}
                                    />
                                </div>
                                <div className="form-control mb-6">
                                    <label className="label">
                                        <span className="label-text">Follow-up Task (Optional)</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={newInteraction.followUpTask}
                                        onChange={(e) => setNewInteraction({ ...newInteraction, followUpTask: e.target.value })}
                                    />
                                </div>
                                <div className="modal-action">
                                    <button type="button" className="btn" onClick={() => setShowAddInteractionModal(false)}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Log Interaction
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Edit Contact Modal */}
            {
                showEditContactModal && editContact && (
                    <div className="modal modal-open">
                        <div className="modal-box">
                            <h3 className="font-bold text-lg mb-4">Edit Contact</h3>
                            <form onSubmit={e => { e.preventDefault(); handleEditContactSubmit(); }}>
                                <div className="form-control mb-3">
                                    <label className="label">
                                        <span className="label-text">Name</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={editContact.name}
                                        onChange={e => handleEditContactChange("name", e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="form-control mb-3">
                                    <label className="label">
                                        <span className="label-text">Title / Position</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered"
                                        value={editContact.title}
                                        onChange={e => handleEditContactChange("title", e.target.value)}
                                    />
                                </div>
                                <div className="form-control mb-3">
                                    <label className="label">
                                        <span className="label-text">Email</span>
                                    </label>
                                    <input
                                        type="email"
                                        className="input input-bordered"
                                        value={editContact.email}
                                        onChange={e => handleEditContactChange("email", e.target.value)}
                                    />
                                </div>
                                <div className="form-control mb-3">
                                    <label className="label">
                                        <span className="label-text">Phone</span>
                                    </label>
                                    <input
                                        type="tel"
                                        className="input input-bordered"
                                        value={editContact.phone}
                                        onChange={e => handleEditContactChange("phone", e.target.value)}
                                    />
                                </div>
                                <div className="form-control mb-6">
                                    <label className="label cursor-pointer">
                                        <span className="label-text">Set as Primary Contact</span>
                                        <input
                                            type="checkbox"
                                            className="toggle toggle-primary"
                                            checked={editContact.isPrimary}
                                            onChange={e => handleEditContactChange("isPrimary", e.target.checked)}
                                        />
                                    </label>
                                </div>
                                <div className="modal-action">
                                    <button type="button" className="btn" onClick={() => { setShowEditContactModal(false); setEditContact(null); }}>
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Save Changes
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

            {/* Edit Interaction Modal */}
            {
                showEditInteractionModal && editInteraction && (
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
                        </div>
                    </div>
                )
            }

            {/* Add Project Modal */}
            {showAddProjectModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg mb-4">Add New Project</h3>
                        <form
                            onSubmit={e => {
                                e.preventDefault();
                                handleAddProject();
                            }}
                        >
                            <div className="form-control mb-3">
                                <label className="label">
                                    <span className="label-text">Project Name</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={newProject.name}
                                    onChange={e => setNewProject({ ...newProject, name: e.target.value })}
                                    required
                                />
                            </div>
                            <div className="form-control mb-3">
                                <label className="label">
                                    <span className="label-text">Type</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={newProject.type}
                                    onChange={e => setNewProject({ ...newProject, type: e.target.value })}
                                />
                            </div>
                            <div className="form-control mb-3">
                                <label className="label">
                                    <span className="label-text">Status</span>
                                </label>
                                <select
                                    className="select select-bordered"
                                    value={newProject.status}
                                    onChange={e => setNewProject({ ...newProject, status: e.target.value })}
                                    required
                                >
                                    <option value="in_progress">In Progress</option>
                                    <option value="completed">Completed</option>
                                    <option value="on_hold">On Hold</option>
                                    <option value="cancelled">Cancelled</option>
                                </select>
                            </div>
                            <div className="form-control mb-3">
                                <label className="label">
                                    <span className="label-text">Budget</span>
                                </label>
                                <input
                                    type="number"
                                    className="input input-bordered"
                                    value={newProject.budget}
                                    onChange={e => setNewProject({ ...newProject, budget: e.target.value })}
                                    min="0"
                                />
                            </div>
                            <div className="form-control mb-3">
                                <label className="label">
                                    <span className="label-text">Start Date</span>
                                </label>
                                <input
                                    type="date"
                                    className="input input-bordered"
                                    value={newProject.start_date}
                                    onChange={e => setNewProject({ ...newProject, start_date: e.target.value })}
                                />
                            </div>
                            <div className="form-control mb-3">
                                <label className="label">
                                    <span className="label-text">End Date</span>
                                </label>
                                <input
                                    type="date"
                                    className="input input-bordered"
                                    value={newProject.end_date}
                                    onChange={e => setNewProject({ ...newProject, end_date: e.target.value })}
                                />
                            </div>
                            <div className="form-control mb-3">
                                <label className="label">
                                    <span className="label-text">Location</span>
                                </label>
                                <input
                                    type="text"
                                    className="input input-bordered"
                                    value={newProject.location}
                                    onChange={e => setNewProject({ ...newProject, location: e.target.value })}
                                />
                            </div>
                            <div className="form-control mb-6">
                                <label className="label">
                                    <span className="label-text">Description</span>
                                </label>
                                <textarea
                                    className="textarea textarea-bordered"
                                    value={newProject.description}
                                    onChange={e => setNewProject({ ...newProject, description: e.target.value })}
                                ></textarea>
                            </div>
                            <div className="modal-action">
                                <button
                                    type="button"
                                    className="btn"
                                    onClick={() => setShowAddProjectModal(false)}
                                    disabled={isSubmittingProject}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={isSubmittingProject}
                                >
                                    {isSubmittingProject ? "Adding..." : "Add Project"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div >
    )
}
