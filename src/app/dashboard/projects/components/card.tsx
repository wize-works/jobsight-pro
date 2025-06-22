import { ProjectWithDetails, ProjectStatus, projectStatusOptions } from "@/types/projects";
import { formatDate, formatCurrency } from "@/utils/date";
import { progressBar } from "@/utils/progress";
import Link from "next/link";

export const ProjectCard = ({ project }: {
    project: ProjectWithDetails
}) => {
    const getProjectInitials = (name: string) => {
        return name
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case "in_progress":
                return { color: "text-success", bgColor: "bg-success/10" };
            case "completed":
                return { color: "text-info", bgColor: "bg-info/10" };
            case "planning":
                return { color: "text-warning", bgColor: "bg-warning/10" };
            case "on_hold":
                return { color: "text-error", bgColor: "bg-error/10" };
            default:
                return { color: "text-primary", bgColor: "bg-primary/10" };
        }
    };

    const statusInfo = getStatusInfo(project.status || "planning");

    return (
        <Link
            href={`/dashboard/projects/${project.id}`}
            className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow duration-200 border"
        >
            <div className="card-body p-6">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="avatar avatar-placeholder">
                            <div className={`w-14 h-14 rounded-full ${statusInfo.bgColor} flex items-center justify-center`}>
                                <span className={`text-xl font-bold ${statusInfo.color}`}>
                                    {getProjectInitials(project.name)}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="card-title text-lg font-semibold truncate">{project.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-base-content/70">{project.client_name}</span>
                                {project.type && (
                                    <span className="badge badge-outline badge-sm">{project.type}</span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex-shrink-0">
                        {projectStatusOptions.badge(project.status as ProjectStatus)}
                    </div>
                </div>

                {/* Project Information */}
                <div className="space-y-2 mb-4">
                    {project.location && (
                        <div className="flex items-center gap-2 text-sm">
                            <i className="fas fa-map-marker-alt w-4 text-base-content/60" />
                            <span className="text-base-content/80 truncate">{project.location}</span>
                        </div>
                    )}

                    {(project.start_date || project.end_date) && (
                        <div className="flex items-center gap-2 text-sm">
                            <i className="fas fa-calendar-alt w-4 text-base-content/60" />
                            <span className="text-base-content/80">
                                {formatDate(project.start_date)} - {formatDate(project.end_date)}
                            </span>
                        </div>
                    )}                    {project.budget && (
                        <div className="flex items-center gap-2 text-sm">
                            <i className="fas fa-dollar-sign w-4 text-base-content/60" />
                            <span className="text-base-content/80 font-medium">{formatCurrency(project.budget)}</span>
                        </div>
                    )}
                </div>

                {/* Progress Section */}
                <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm font-medium">{project.progress || 0}%</span>
                    </div>
                    {progressBar(project.progress || 0, 100)}
                </div>

                {/* Statistics Section */}
                <div className="divider my-3"></div>
                <div className="stats stats-horizontal w-full mb-4">
                    <div className="stat px-2 py-3">
                        <div className="stat-value text-lg text-primary">{project.progress || 0}%</div>
                        <div className="stat-title text-xs">Progress</div>
                    </div>
                    <div className="stat px-2 py-3">
                        <div className="stat-value text-lg text-success">{formatCurrency(project.budget)}</div>
                        <div className="stat-title text-xs">Budget</div>
                    </div>
                    <div className="stat px-2 py-3">
                        <div className="stat-value text-lg text-warning">{project.type || "N/A"}</div>
                        <div className="stat-title text-xs">Type</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="card-actions justify-between items-center pt-2">
                    <div className="flex gap-1">
                        {project.client_id && (
                            <Link
                                href={`/dashboard/clients/${project.client_id}`}
                                className="btn btn-ghost btn-sm btn-circle"
                                title="View client"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <i className="fas fa-building text-sm" />
                            </Link>
                        )}
                        <button
                            className="btn btn-ghost btn-sm btn-circle"
                            title="View tasks"
                            onClick={(e) => {
                                e.stopPropagation();
                                e.preventDefault();
                                window.location.href = `/dashboard/projects/${project.id}#tasks`;
                            }}
                        >
                            <i className="fas fa-tasks text-sm" />
                        </button>
                        {project.status === "planning" && (
                            <button
                                className="btn btn-ghost btn-sm btn-circle"
                                title="Start project"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    // TODO: Open start project modal or action
                                }}
                            >
                                <i className="fas fa-play text-sm" />
                            </button>
                        )}
                    </div>
                    <div className="btn btn-primary btn-sm">
                        <i className="fas fa-eye mr-1" />
                        View Details
                    </div>
                </div>
            </div>
        </Link>
    );
}
