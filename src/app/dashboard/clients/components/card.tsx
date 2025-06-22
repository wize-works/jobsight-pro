import { ClientWithStats } from "@/types/clients";
import { clientStatusOptions, clientTypeOptions, ClientStatus, ClientType } from "@/types/clients";
import Link from "next/link";

export const ClientCard = ({ client }: {
    client: ClientWithStats
}) => {
    const formatCurrency = (amount: number | undefined) => {
        if (!amount) return "$0";
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatLocation = () => {
        const parts = [client.city, client.state].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : null;
    };

    return (
        <div key={client.id} className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow duration-200 border">
            <div className="card-body p-6">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        {client.logo_url ? (

                            <div className="avatar">
                                <div className="w-14 h-14 rounded-full bg-primary/10">
                                    <img
                                        src={client.logo_url}
                                        alt={`${client.name} logo`}
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="avatar avatar-placeholder">
                                <div className="bg-primary/20 text-primary-content w-16 rounded-full">
                                    <span className="text-xl font-bold text-primary">
                                        {client.name.split(' ').slice(0, 2).map(word => word.charAt(0).toUpperCase()).join('')}
                                    </span>
                                </div>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h2 className="card-title text-lg font-semibold truncate">{client.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                {client.type && clientTypeOptions.badge(client.type as ClientType)}
                                {client.industry && (
                                    <span className="badge badge-outline badge-sm">{client.industry}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        {clientStatusOptions.badge(client.status as ClientStatus)}
                    </div>
                </div>
                {/* Contact Information */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                        <i className="fas fa-user w-4 text-base-content/60" />
                        {client.contact_name ? (
                            <span className="font-medium">{client.contact_name}</span>
                        ) : (
                            <span className="text-base-content/50 italic">Contact name not provided</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <i className="fas fa-envelope w-4 text-base-content/60" />
                        {client.contact_email ? (
                            <a
                                href={`mailto:${client.contact_email}`}
                                className="link link-hover truncate"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {client.contact_email}
                            </a>
                        ) : (
                            <span className="text-base-content/50 italic">Email not provided</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <i className="fas fa-phone w-4 text-base-content/60" />
                        {client.contact_phone ? (
                            <a
                                href={`tel:${client.contact_phone}`}
                                className="link link-hover"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {client.contact_phone}
                            </a>
                        ) : (
                            <span className="text-base-content/50 italic">Phone not provided</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <i className="fas fa-map-marker-alt w-4 text-base-content/60" />
                        {formatLocation() ? (
                            <span className="text-base-content/80">{formatLocation()}</span>
                        ) : (
                            <span className="text-base-content/50 italic">Location not provided</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <i className="fas fa-globe w-4 text-base-content/60" />
                        {client.website ? (
                            <a
                                href={client.website.startsWith('http') ? client.website : `https://${client.website}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="link link-hover truncate"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {client.website.replace(/^https?:\/\//, '')}
                            </a>
                        ) : (
                            <span className="text-base-content/50 italic">Website not provided</span>
                        )}
                    </div>
                </div>

                {/* Statistics Section */}
                <div className="divider my-3 mt-auto"></div>

                <div className="stats stats-horizontal w-full mb-4">
                    <div className="stat px-2 py-3">
                        <div className="stat-value text-lg text-primary">{client.total_projects || 0}</div>
                        <div className="stat-title text-xs">Total Projects</div>
                    </div>
                    <div className="stat px-2 py-3">
                        <div className="stat-value text-lg text-success">{client.active_projects || 0}</div>
                        <div className="stat-title text-xs">Active</div>
                    </div>
                    <div className="stat px-2 py-3">
                        <div className="stat-value text-lg text-warning">{formatCurrency(client.total_budget)}</div>
                        <div className="stat-title text-xs">Total Value</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="card-actions justify-between items-center pt-2">
                    <div className="flex gap-1">
                        {client.contact_phone && (
                            <button
                                className="btn btn-ghost btn-sm btn-circle"
                                title="Call client"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`tel:${client.contact_phone}`);
                                }}
                            >
                                <i className="fas fa-phone text-sm" />
                            </button>
                        )}
                        {client.contact_email && (
                            <button
                                className="btn btn-ghost btn-sm btn-circle"
                                title="Email client"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(`mailto:${client.contact_email}`);
                                }}
                            >
                                <i className="fas fa-envelope text-sm" />
                            </button>
                        )}
                        {client.website && (
                            <button
                                className="btn btn-ghost btn-sm btn-circle"
                                title="Visit website"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    window.open(client.website?.startsWith('http') ? client.website : `https://${client.website}`, '_blank');
                                }}
                            >
                                <i className="fas fa-external-link-alt text-sm" />
                            </button>
                        )}
                    </div>
                    <Link
                        href={`/dashboard/clients/${client.id}`}
                        className="btn btn-primary btn-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <i className="fas fa-eye mr-1" />
                        View Details
                    </Link>
                </div>
            </div>
        </div>
    );
}