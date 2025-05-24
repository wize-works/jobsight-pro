"use client"

import { useState } from "react"
import Link from "next/link"
import { createClient } from "@/app/actions/clients"
import type { Client, ClientInsert, ClientWithStats } from "@/types/clients"
import { toast } from "@/hooks/use-toast"
import { ClientCard } from "./card"
import { v4 as uuidv4 } from "uuid"

// Status options with colors and labels
export const StatusOptions: {
    [key: string]: { label: string; color: string };
} = {
    active: { label: "Active", color: "badge-success" },
    inactive: { label: "Inactive", color: "badge-neutral" },
    prospect: { label: "Prospect", color: "badge-warning" },
}


interface ClientsListProps {
    initialClients: ClientWithStats[]
    businessId: string
}

export default function ClientsList({ initialClients, businessId }: ClientsListProps) {
    const [clients, setClients] = useState<ClientWithStats[]>(initialClients);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showAddClientModal, setShowAddClientModal] = useState(false);
    const [newClient, setNewClient] = useState<{
        id: string;
        name: string;
        type: string;
        contact_name: string;
        contact_email: string;
        contact_phone: string;
        address: string;
        status: "prospect" | "active" | "inactive";
        totalProjects?: number;
        activeProjects?: number;
        totalBudget?: number;
    }>({
        id: uuidv4(),
        name: "",
        type: "Commercial",
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        address: "",
        status: "prospect",
        totalProjects: 0,
        activeProjects: 0,
        totalBudget: 0,
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewType, setViewType] = useState("grid");

    // Filter clients based on search term, type, and status
    const filteredClients = clients.filter((client) => {
        const matchesSearch =
            client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (client.contact_name && client.contact_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (client.contact_email && client.contact_email.toLowerCase().includes(searchTerm.toLowerCase()));
        const matchesType = typeFilter === "all" || (client.type && client.type.includes(typeFilter));
        const matchesStatus = statusFilter === "all" || client.status === statusFilter;
        return matchesSearch && matchesType && matchesStatus;
    })

    // Get unique client types for filter dropdown
    const clientTypes = ["all", ...new Set(clients.map((client) => client.type?.split(" ")[0] || "Other"))];

    const handleAddClient = async () => {
        if (!businessId) return;

        setIsSubmitting(true);
        try {
            const { data, error } = await createClient(newClient, businessId);
            if (error) throw new Error(error.message);
            if (data) {
                setClients((prev) => [
                    ...prev,
                    {
                        ...data,
                        total_projects: data.total_projects ?? 0,
                        active_projects: 0,
                        total_budget: 0,
                    }
                ]);
                setNewClient({
                    id: uuidv4(),
                    name: "",
                    type: "Commercial",
                    contact_name: "",
                    contact_email: "",
                    contact_phone: "",
                    address: "",
                    status: "prospect",
                });
                setShowAddClientModal(false);
            }
        } catch (error) {
            toast.error("Error adding client. Please try again.");;
            console.error("Error adding client:", error);
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
            <div className="flex justify-between mb-4">
                <h1 className="text-2xl font-semibold">Client Management</h1>
                <button className="btn btn-primary" onClick={() => setShowAddClientModal(true)}>
                    <i className="fas fa-plus mr-2"></i> Add Client
                </button>
            </div>

            <div className="card bg-base-100 shadow-sm mb-6 rounded-lg">
                <div className="card-body p-2">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="flex-1">
                            <label className="input input-bordered input-secondary flex items-center gap-2">
                                <i className="fas fa-search"></i>
                                <input
                                    type="text"
                                    placeholder="Search clients..."
                                    className="grow"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </label>
                        </div>
                        <select
                            className="select select-bordered select-secondary"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="all">All Types</option>
                            {clientTypes
                                .filter((type) => type !== "all")
                                .map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                        </select>
                        <select
                            className="select select-bordered select-secondary"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="all">All Statuses</option>
                            {Object.entries(StatusOptions).map(([value, { label }]) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </select>
                        <div className="tabs tabs-boxed">
                            <button className={`tab tab-secondary ${viewType === "grid" ? "tab-active" : ""}`} onClick={() => setViewType("grid")}>
                                <i className="fas fa-grid-2"></i>
                            </button>
                            <button className={`tab ${viewType === "list" ? "tab-active" : ""}`} onClick={() => setViewType("list")}>
                                <i className="fas fa-th-list"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {viewType === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredClients.map((client) => (
                        <ClientCard
                            key={client.id}
                            client={client}
                            onClick={() => {
                                // Handle client card click
                                console.log("Client clicked:", client)
                            }} />
                    ))}
                </div>
            ) : null}

            {/* List View */}
            {viewType === "list" && (
                <div className="overflow-x-auto card bg-base-100 shadow-sm mb-6">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th>Client</th>
                                <th>Contact</th>
                                <th>Projects</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredClients.map((client) => (
                                <tr key={client.id}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="avatar flex">
                                                <div className="w-12 h-12 flex rounded-full bg-base-300 text-center content-center">
                                                    {client.image ? (
                                                        <img src={client.image || "/placeholder.svg"} alt={`${client.name} logo`} />
                                                    ) : (
                                                        <span className="text-xl font-bold">{client.name.charAt(0)}</span>
                                                    )}
                                                </div>
                                            </div>
                                            <div>
                                                <div className="font-bold">{client.name}</div>
                                                <div className="text-sm opacity-50">{client.type}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div>{client.contact_name}</div>
                                        <div className="text-sm opacity-50">{client.contact_email}</div>
                                        <div className="text-sm opacity-50">{client.contact_phone}</div>
                                    </td>
                                    <td>
                                        <div>
                                            <span className="font-semibold">{client.active_projects || 0}</span> Active /{" "}
                                            <span className="font-semibold">{client.total_projects || 0}</span> Total
                                        </div>
                                        <div className="text-sm opacity-50">${(client.total_budget || 0).toLocaleString()}</div>
                                    </td>
                                    <td>
                                        <div className={`badge ${StatusOptions[client.status || "prospect"]?.color || "badge-neutral"}`}>
                                            {StatusOptions[client.status || "prospect"]?.label || "Unknown"}
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex gap-2">
                                            <Link href={`/dashboard/clients/${client.id}`} className="btn btn-sm btn-outline">
                                                View
                                            </Link>
                                            <button className="btn btn-sm btn-ghost">
                                                <i className="fas fa-ellipsis-v"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* No clients found message */}

            {filteredClients.length === 0 && (
                <div className="text-center py-12">
                    <i className="fas fa-users text-4xl text-base-content/30 mb-4"></i>
                    <h3 className="text-xl font-semibold mb-2">No clients found</h3>
                    <p className="text-base-content/70">Try adjusting your search or filters</p>
                </div>
            )}

            {/* Add Client Modal */}
            {showAddClientModal && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-3xl">
                        <h3 className="font-bold text-lg mb-4">Add New Client</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Client Name</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter client name"
                                    className="input input-bordered"
                                    value={newClient.name}
                                    onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Client Type</span>
                                </label>
                                <select
                                    className="select select-bordered"
                                    value={newClient.type}
                                    onChange={(e) => setNewClient({ ...newClient, type: e.target.value })}
                                >
                                    <option>Commercial</option>
                                    <option>Residential</option>
                                    <option>Government</option>
                                    <option>Education</option>
                                    <option>Healthcare</option>
                                    <option>Hospitality</option>
                                    <option>Non-Profit</option>
                                    <option>Other</option>
                                </select>
                            </div>
                        </div>

                        <div className="divider">Contact Information</div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Contact Name</span>
                                </label>
                                <input
                                    type="text"
                                    placeholder="Enter primary contact name"
                                    className="input input-bordered"
                                    value={newClient.contact_name}
                                    onChange={(e) => setNewClient({ ...newClient, contact_name: e.target.value })}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Contact Email</span>
                                </label>
                                <input
                                    type="email"
                                    placeholder="Enter email address"
                                    className="input input-bordered"
                                    value={newClient.contact_email}
                                    onChange={(e) => setNewClient({ ...newClient, contact_email: e.target.value })}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Contact Phone</span>
                                </label>
                                <input
                                    type="tel"
                                    placeholder="Enter phone number"
                                    className="input input-bordered"
                                    value={newClient.contact_phone}
                                    onChange={(e) => setNewClient({ ...newClient, contact_phone: e.target.value })}
                                />
                            </div>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Status</span>
                                </label>
                                <select
                                    className="select select-bordered"
                                    value={newClient.status}
                                    onChange={(e) =>
                                        setNewClient({ ...newClient, status: e.target.value as "prospect" | "active" | "inactive" })
                                    }
                                >
                                    <option value="prospect">Prospect</option>
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                </select>
                            </div>
                        </div>

                        <div className="form-control mt-4">
                            <label className="label">
                                <span className="label-text">Address</span>
                            </label>
                            <textarea
                                className="textarea textarea-bordered"
                                placeholder="Enter client address"
                                value={newClient.address}
                                onChange={(e) => setNewClient({ ...newClient, address: e.target.value })}
                            ></textarea>
                        </div>

                        <div className="modal-action">
                            <button className="btn btn-ghost" onClick={() => setShowAddClientModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleAddClient} disabled={isSubmitting}>
                                {isSubmitting ? <span className="loading loading-spinner loading-sm"></span> : null}
                                Add Client
                            </button>
                        </div>
                    </div>
                    <div className="modal-backdrop" onClick={() => setShowAddClientModal(false)}></div>
                </div>
            )}
        </>
    )
}
