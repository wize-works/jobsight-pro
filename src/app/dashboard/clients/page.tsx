"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { ClientStatus, clientStatusOptions, ClientType, clientTypeOptions, type Client, type ClientInsert, type ClientWithStats } from "@/types/clients"
import { toast } from "@/hooks/use-toast"
import { ClientCard } from "./components/card"
import ClientModal from "./components/modal-client"
import { v4 as uuidv4 } from "uuid"
import { useClients } from "@/hooks/use-clients"
import ClientsListLoading from "./loading"
import { useBusiness } from "@/lib/business-context"
import ErrorBoundary from "@/components/error-boundary"

export default function ClientsPage() {
    const { businessId } = useBusiness();
    const { loading, error, getClients, createClient } = useClients();

    const [clients, setClients] = useState<ClientWithStats[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [typeFilter, setTypeFilter] = useState("all"); const [statusFilter, setStatusFilter] = useState("all"); const [showAddClientModal, setShowAddClientModal] = useState(false);
    const [viewType, setViewType] = useState<"grid" | "list">(
        typeof window !== "undefined" && localStorage.getItem("clientsViewType") === "list" ? "list" : "grid"
    );

    useEffect(() => {
        if (!businessId) {
            return;
        }
        const fetchClients = async () => {
            try {
                const data = await getClients({ withStats: true });
                if (data) {
                    setClients(data as ClientWithStats[]);
                } else if (error) {
                    toast({
                        title: "Error",
                        description: error,
                    });
                }
            } catch (error) {
                console.error("Error fetching clients:", error);
                toast({
                    title: "Error",
                    description: "Failed to load clients. Please try again.",
                });
            }
        };
        fetchClients();
    }, [businessId, getClients, error]);

    const updateViewType = (type: "grid" | "list") => {
        setViewType(type);
        if (typeof window !== "undefined") {
            localStorage.setItem("clientsViewType", type);
        }
    };

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
    const clientTypes = ["all", ...new Set(clients.map((client) => client.type?.split(" ")[0] || "Other"))]; const handleAddClient = async (formData: any) => {
        const clientData = {
            id: uuidv4(),
            ...formData,
            business_id: businessId,
        };

        try {
            const data = await createClient(clientData as ClientInsert);
            if (data) {
                setClients((prev) => [
                    ...prev,
                    {
                        ...data,
                        total_projects: 0,
                        active_projects: 0,
                        total_budget: 0,
                    },
                ]);
                setShowAddClientModal(false);
                toast({
                    title: "Success",
                    description: "Client created successfully!",
                });
            }
        } catch (error) {
            console.error("Error creating client:", error);
            toast({
                title: "Error",
                description: "Failed to create client. Please try again.",
            });
        }
    }

    if (loading) {
        return (
            <ClientsListLoading viewType={viewType} />
        );
    }

    return (
        <>
            <div className="flex justify-between mb-4">
                <h1 className="text-2xl font-semibold">Client Management</h1>
                <button className="btn btn-primary" onClick={() => setShowAddClientModal(true)}>
                    <i className="far fa-plus mr-2"></i> Add Client
                </button>            </div>

            {/* Client Statistics */}
            <ErrorBoundary fallback={(error) => (
                <div className="alert alert-error mb-6">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3 className="font-bold">Failed to load client statistics</h3>
                        <div className="text-xs">Client stats are temporarily unavailable.</div>
                    </div>
                </div>
            )}>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                    <div className="stat bg-base-100 shadow-lg">
                        <div className="stat-title text-lg">Total Clients</div>
                        <div className="flex items-center justify-between">
                            <div className="stat-value text-primary">{clients.length}</div>
                            <div className="stat-icon text-primary bg-primary/20 rounded-full h-12 w-12 flex items-center justify-center">
                                <i className="far fa-users fa-lg"></i>
                            </div>
                        </div>
                        <div className="stat-desc">Total number of clients</div>
                    </div>

                    <div className="stat bg-base-100 shadow-lg">
                        <div className="stat-title text-lg">Active Clients</div>
                        <div className="flex items-center justify-between">
                            <div className="stat-value text-success">{clients.filter(c => c.status === "active").length}</div>
                            <div className="stat-icon text-success bg-success/20 rounded-full h-12 w-12 flex items-center justify-center">
                                <i className="far fa-user-check fa-lg"></i>
                            </div>
                        </div>
                        <div className="stat-desc">Clients currently engaged</div>
                    </div>

                    <div className="stat bg-base-100 shadow-lg">
                        <div className="stat-title text-lg">Prospects</div>
                        <div className="flex items-center justify-between">
                            <div className="stat-value text-warning">{clients.filter(c => c.status === "prospect").length}</div>
                            <div className="stat-icon text-warning bg-warning/20 rounded-full h-12 w-12 flex items-center justify-center">
                                <i className="far fa-user-clock fa-lg"></i>
                            </div>
                        </div>
                        <div className="stat-desc">Potential clients in pipeline</div>
                    </div>

                    <div className="stat bg-base-100 shadow-lg">
                        <div className="stat-title text-lg">Inactive Clients</div>
                        <div className="flex items-center justify-between">
                            <div className="stat-value text-error">{clients.filter(c => c.status === "inactive").length}</div>
                            <div className="stat-icon text-error bg-error/20 rounded-full h-12 w-12 flex items-center justify-center">
                                <i className="far fa-user-times fa-lg"></i>
                            </div>
                        </div>
                        <div className="stat-desc">Clients not currently active</div>
                    </div>
                </div>
            </ErrorBoundary>



            {/* Client Filters */}
            <ErrorBoundary fallback={(error) => (
                <div className="alert alert-error mb-6">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3 className="font-bold">Failed to load client filters</h3>
                        <div className="text-xs">Filter controls are temporarily unavailable.</div>
                    </div>
                </div>
            )}>
                <div className="card bg-base-100 shadow-lg mb-6 rounded-lg">
                    <div className="card-body p-2">
                        <div className="flex flex-col md:flex-row gap-6">
                            <div className="w-full">
                                <label className="input input-bordered input-secondary flex items-center gap-2 w-full">
                                    <i className="far fa-search"></i>
                                    <input
                                        type="text"
                                        placeholder="Search clients..."
                                        className="grow w-full"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </label>
                            </div>
                            {clientTypeOptions.select(
                                typeFilter as ClientType | "all",
                                (value) => setTypeFilter(value as string | "all"),
                                "select-secondary w-full"
                            )}
                            {clientStatusOptions.select(
                                statusFilter as ClientStatus,
                                (value) => setStatusFilter(value as ClientStatus | "all"),
                                "select-secondary w-full"
                            )}
                            <div role="tablist" className="tabs tabs-box tabs-sm flex-nowrap">
                                <button role="tab" className={`tab tab-secondary ${viewType === "grid" ? "tab-active text-secondary" : ""}`} onClick={() => updateViewType("grid")}> <i className="far fa-grid-2"></i> </button>
                                <button role="tab" className={`tab ${viewType === "list" ? "tab-active" : ""}`} onClick={() => updateViewType("list")}> <i className="far fa-table-rows"></i> </button>
                            </div>
                        </div>
                    </div>
                </div>
            </ErrorBoundary>

            {/* Client List */}
            <ErrorBoundary fallback={(error) => (
                <div className="alert alert-error">
                    <i className="fas fa-exclamation-triangle"></i>
                    <div>
                        <h3 className="font-bold">Failed to load clients</h3>
                        <div className="text-xs">Client list is temporarily unavailable. Please refresh the page.</div>
                    </div>
                </div>
            )}>
                {viewType === "grid" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {filteredClients.map((client) => (
                            <ClientCard
                                key={client.id}
                                client={client}
                            />
                        ))}
                    </div>
                ) : null}

                {/* List View */}
                {viewType === "list" && (
                    <div className="overflow-x-auto card bg-base-100 shadow-lg mb-6">
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
                                                        {client.logo_url && client.logo_url !== "" ? (
                                                            <img src={client.logo_url || "/placeholder.svg"} alt={`${client.name} logo`} className="cover" />
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
                                            {clientStatusOptions.badge(client.status as ClientStatus)}
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                <Link href={`/dashboard/clients/${client.id}`} className="btn btn-sm btn-outline">
                                                    <i className="far fa-eye mr-2"></i>
                                                    Details
                                                </Link>
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
                    <div className="card bg-base-100 shadow-lg mb-6">
                        <div className="card-body text-center">
                            <i className="far fa-users text-4xl text-base-content/30 mb-4"></i>
                            <h3 className="text-lg font-semibold">No clients found</h3>
                            <p className="text-base-content/70">Try adjusting your search or filters</p>
                            <div className="flex m-auto justify-center mt-4">
                                <button className="btn btn-primary" onClick={() => setShowAddClientModal(true)}>
                                    <i className="far fa-plus mr-2"></i> Add Your First Client
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </ErrorBoundary>

            {/* Client Modal */}
            <ClientModal
                isOpen={showAddClientModal}
                onClose={() => setShowAddClientModal(false)}
                onSubmit={handleAddClient}
            />
        </>
    )
}
