"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { create } from "domain"

import { createClientInteraction, createClientContact, updateClientInteraction, updateClientContact } from "@/app/actions/clients";
import { date } from "zod"

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
        followUpDate: "",
        followUpTask: "",
    })
    const [editContact, setEditContact] = useState<any | null>(null);
    const [showEditContactModal, setShowEditContactModal] = useState(false);
    const [editInteraction, setEditInteraction] = useState<any | null>(null);
    const [showEditInteractionModal, setShowEditInteractionModal] = useState(false);

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
            is_primary: newContact.isPrimary
        };

        try {
            await createClientContact(client.id, contactData, businessId);
            router.refresh(); // Refresh the page to show the new contact
        } catch (error) {
            console.error("Error creating contact:", error);
        } finally {
            setShowAddContactModal(false);
        }
    }

    const handleAddInteraction = async () => {
        const interactionData = {
            type: newInteraction.type,
            date: new Date().toISOString(),
            summary: newInteraction.summary,
            staff: newInteraction.staff,
            follow_up_date: newInteraction.followUpDate || null,
            follow_up_task: newInteraction.followUpTask || null
        };
        try {
            await createClientInteraction(client.id, interactionData, businessId);
            router.refresh(); // Refresh the page to show the new interaction
        } catch (error) {
            console.error("Error creating interaction:", error);
        }
        finally {
            setShowAddInteractionModal(false);
        }
    }

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
        };
        try {
            await updateClientContact(editContact.id, updatedContact, businessId);
            router.refresh();
        } catch (error) {
            console.error("Error updating contact:", error);
        } finally {
            setShowEditContactModal(false);
            setEditContact(null);
        }
    };

    const handleEditInteractionOpen = (interaction: any) => {
        setEditInteraction({
            ...interaction,
            followUpDate: interaction.follow_up_date || "",
            followUpTask: interaction.follow_up_task || ""
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
            follow_up_task: editInteraction.followUpTask || null
        };
        try {
            await updateClientInteraction(editInteraction.id, updatedInteraction, businessId);
            router.refresh();
        } catch (error) {
            console.error("Error updating interaction:", error);
        } finally {
            setShowEditInteractionModal(false);
            setEditInteraction(null);
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <Link href="/dashboard/clients" className="btn btn-ghost btn-sm">
                            <i className="fas fa-arrow-left"></i>
                        </Link>
                        <h1 className="text-2xl font-bold">{client.name}</h1>
                        <div className={`badge ${statusOptions[client.status as keyof typeof statusOptions]?.color || "badge-neutral"}`}>
                            {statusOptions[client.status as keyof typeof statusOptions]?.label || client.status}
                        </div>
                    </div>
                    <p className="text-base-content/70 mt-1">{client.type}</p>
                </div>
                <div className="flex gap-2">
                    <Link href={`/dashboard/clients/edit/${client.id}`} className="btn btn-outline btn-sm">
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
                                <Link href={`/dashboard/projects/create?client=${client.id}`}>
                                    <i className="fas fa-plus mr-2"></i>
                                    New Project
                                </Link>
                            </li>
                            <li><a><i className="fas fa-file-pdf mr-2"></i> Export as PDF</a></li>
                            <li><a><i className="fas fa-trash mr-2"></i> Delete Client</a></li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="tabs tabs-boxed mb-6">
                <a
                    className={`tab ${activeTab === "overview" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("overview")}
                >
                    Overview
                </a>
                <a
                    className={`tab ${activeTab === "projects" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("projects")}
                >
                    Projects ({projects.length})
                </a>
                <a
                    className={`tab ${activeTab === "contacts" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("contacts")}
                >
                    Contacts ({contacts.length})
                </a>
                <a
                    className={`tab ${activeTab === "interactions" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("interactions")}
                >
                    Interactions ({interactions.length})
                </a>
                <a
                    className={`tab ${activeTab === "documents" ? "tab-active" : ""}`}
                    onClick={() => setActiveTab("documents")}
                >
                    Documents
                </a>
                <a
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
                                        <p>{client.email || "No email provided"}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-base-content/70">Phone</h4>
                                        <p>{client.phone || "No phone provided"}</p>
                                    </div>
                                    <div>
                                        <h4 className="text-sm font-medium text-base-content/70">Address</h4>
                                        <p>{client.address || "No address provided"}</p>
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
                                    <Link href={`/dashboard/projects/create?client=${client.id}`} className="btn btn-primary btn-sm">
                                        <i className="fas fa-plus mr-2"></i> New Project
                                    </Link>
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
                                        <Link href={`/dashboard/projects/create?client=${client.id}`} className="btn btn-primary">
                                            <i className="fas fa-plus mr-2"></i> Create Project
                                        </Link>
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
                                <h3 className="text-lg font-semibold mb-4">Notes</h3>
                                <textarea className="textarea textarea-bordered w-full h-32" placeholder="Add notes about this client..."></textarea>
                                <div className="mt-4 text-right">
                                    <button className="btn btn-sm btn-primary">Save Notes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === "projects" && (
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Projects</h3>
                            <Link href={`/dashboard/projects/create?client=${client.id}`} className="btn btn-primary btn-sm">
                                <i className="fas fa-plus mr-2"></i> New Project
                            </Link>
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
            )}

            {activeTab === "contacts" && (
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
                                <h3 className="text-xl font-semibold mb-2">No contacts found</h3>
                                <p className="text-base-content/70 mb-4">Add contacts to manage relationships with this client</p>
                                <button className="btn btn-primary" onClick={() => setShowAddContactModal(true)}>
                                    <i className="fas fa-plus mr-2"></i> Add Contact
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeTab === "interactions" && (
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
            )}

            {activeTab === "documents" && (
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
            )}

            {activeTab === "invoices" && (
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
            )}

            {/* Add Contact Modal */}
            {showAddContactModal && (
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
            )}

            {/* Add Interaction Modal */}
            {showAddInteractionModal && (
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
            )}

            {/* Edit Contact Modal */}
            {showEditContactModal && editContact && (
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
                    </div>
                </div>
            )}
        </div>
    )
}
