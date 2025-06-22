import { CrewWithDetails } from "@/types/crews";
import { crewStatusOptions, crewTypeOptions, CrewStatus } from "@/types/crews";
import Link from "next/link";

export const CrewCard = ({
    crew,
}: {
    crew: CrewWithDetails;
}) => {
    const getStatusInfo = (status: string) => {
        switch (status) {
            case "active":
                return { label: "Active", color: "badge-success", icon: "fas fa-circle-check" };
            case "inactive":
                return { label: "Inactive", color: "badge-secondary", icon: "fas fa-circle-pause" };
            case "on_hold":
                return { label: "On Hold", color: "badge-warning", icon: "fas fa-circle-exclamation" };
            case "archived":
                return { label: "Archived", color: "badge-error", icon: "fas fa-archive" };
            default:
                return { label: "Available", color: "badge-info", icon: "fas fa-circle" };
        }
    };

    const statusInfo = getStatusInfo(crew.status || "inactive");

    const formatHours = (hours: number) => {
        if (hours === 0) return "0 hrs";
        if (hours < 10) return `${hours.toFixed(1)} hrs`;
        return `${Math.round(hours)} hrs`;
    };

    const getCrewInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    return (
        <div key={crew.id} className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow duration-200 border">
            <div className="card-body p-6">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="avatar avatar-placeholder">
                            <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center">
                                <span className="text-xl font-bold text-accent">
                                    {getCrewInitials(crew.name)}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="card-title text-lg font-semibold truncate">{crew.name}</h2>
                            <div className="flex items-center gap-2 mt-1">
                                {crew.specialty && (
                                    <span className="badge badge-outline badge-sm">{crew.specialty}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        <div className={`badge ${statusInfo.color} gap-1`}>
                            <i className={`${statusInfo.icon} text-xs`} />
                            {statusInfo.label}
                        </div>
                    </div>
                </div>

                {/* Crew Information */}
                <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                        <i className="fas fa-user-tie w-4 text-base-content/60" />
                        <span className="font-medium">
                            {crew.leader && crew.leader !== "No Leader" ? crew.leader : "No Leader Assigned"}
                        </span>
                        {crew.leader && crew.leader !== "No Leader" && (
                            <span className="badge badge-primary badge-xs">Leader</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2 text-sm">
                        <i className="fas fa-users w-4 text-base-content/60" />
                        <span className="text-base-content/80">
                            {crew.member_count || 0} member{crew.member_count !== 1 ? 's' : ''}
                        </span>
                        {crew.member_count > 0 && (
                            <span className="badge badge-outline badge-xs">Team</span>
                        )}
                    </div>

                    {crew.current_project && (
                        <div className="flex items-center gap-2 text-sm">
                            <i className="fas fa-hammer w-4 text-base-content/60" />
                            {crew.current_project_id ? (
                                <Link
                                    href={`/dashboard/projects/${crew.current_project_id}`}
                                    className="link link-hover text-primary font-medium truncate"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    {crew.current_project}
                                </Link>
                            ) : (
                                <span className="text-base-content/80 truncate">{crew.current_project}</span>
                            )}
                            <span className="badge badge-primary badge-xs">Active</span>
                        </div>
                    )}

                    {!crew.current_project && crew.status === "active" && (
                        <div className="flex items-center gap-2 text-sm">
                            <i className="fas fa-circle-check w-4 text-success" />
                            <span className="text-success font-medium">Available for Assignment</span>
                        </div>
                    )}
                </div>                {/* Statistics Section */}
                <div className="divider my-3"></div>

                <div className="stats stats-horizontal w-full mb-4">
                    <div className="stat px-2 py-3">
                        <div className="stat-value text-lg text-primary">{crew.member_count || 0}</div>
                        <div className="stat-title text-xs">Team Size</div>
                    </div>
                    <div className="stat px-2 py-3">
                        <div className="stat-value text-lg text-success">{crew.active_projects || 0}</div>
                        <div className="stat-title text-xs">Active Projects</div>
                    </div>
                    <div className="stat px-2 py-3">
                        <div className="stat-value text-lg text-warning">{formatHours(crew.total_hours || 0)}</div>
                        <div className="stat-title text-xs">Total Hours</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="card-actions justify-between items-center pt-2">
                    <div className="flex gap-1">
                        {crew.current_project_id && (
                            <Link
                                href={`/dashboard/projects/${crew.current_project_id}`}
                                className="btn btn-ghost btn-sm btn-circle"
                                title="View current project"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <i className="fas fa-project-diagram text-sm" />
                            </Link>
                        )}
                        <button
                            className="btn btn-ghost btn-sm btn-circle"
                            title="Manage crew members"
                            onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Open crew members modal or navigate to members page
                            }}
                        >
                            <i className="fas fa-users-cog text-sm" />
                        </button>
                        {crew.status === "active" && !crew.current_project && (
                            <button
                                className="btn btn-ghost btn-sm btn-circle"
                                title="Assign to project"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Open project assignment modal
                                }}
                            >
                                <i className="fas fa-plus-circle text-sm" />
                            </button>
                        )}
                    </div>
                    <Link
                        href={`/dashboard/crews/${crew.id}`}
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