import { DailyLogWithDetails } from "@/types/daily-logs";
import { formatDate } from "@/utils/date";
import Link from "next/link";

export const DailyLogCard = ({
    log,
    isSelected = false,
    onSelect
}: {
    log: DailyLogWithDetails;
    isSelected?: boolean;
    onSelect?: (log: DailyLogWithDetails) => void;
}) => {
    const formatCurrency = (amount: number | undefined) => {
        if (!amount) return "$0";
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const getTotalMaterialCost = () => {
        return log.materials.reduce((total, material) => {
            return total + ((material.cost || 0) * (material.quantity || 0));
        }, 0);
    };

    const getTotalEquipmentHours = () => {
        return log.equipment.reduce((total, equip) => {
            return total + (equip.hours || 0);
        }, 0);
    };

    const getLogInitials = () => {
        const projectName = log.project?.name || "Unknown";
        return projectName
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getWeatherIcon = (weather: string | null) => {
        if (!weather) return "fas fa-question";
        const weatherLower = weather.toLowerCase();
        if (weatherLower.includes('rain')) return "fas fa-cloud-rain";
        if (weatherLower.includes('sun') || weatherLower.includes('clear')) return "fas fa-sun";
        if (weatherLower.includes('cloud')) return "fas fa-cloud";
        if (weatherLower.includes('snow')) return "fas fa-snowflake";
        return "fas fa-cloud-sun";
    };

    const hasIssues = () => {
        return (log.safety && log.safety !== "None reported") ||
            (log.delays && log.delays !== "No delays reported") ||
            (log.quality && log.quality.toLowerCase().includes('issue'));
    };

    return (
        <div
            className={`card bg-base-100 shadow-sm hover:shadow-md transition-shadow duration-200 border cursor-pointer ${isSelected ? "border-primary ring-2 ring-primary/20" : ""
                }`}
            onClick={() => onSelect?.(log)}
        >
            <div className="card-body p-6">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="avatar avatar-placeholder">
                            <div className="w-14 h-14 rounded-full bg-info/10 flex items-center justify-center">
                                <span className="text-xl font-bold text-info">
                                    {getLogInitials()}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h2 className="card-title text-lg font-semibold truncate">
                                {log.project?.name || "Unknown Project"}
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="badge badge-secondary badge-sm">
                                    {formatDate(log.date)}
                                </span>
                                {hasIssues() && (
                                    <span className="badge badge-warning badge-sm">
                                        <i className="fas fa-exclamation-triangle mr-1" />
                                        Issues
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        {log.weather && (
                            <div className="flex items-center gap-1 text-sm text-base-content/70">
                                <i className={`${getWeatherIcon(log.weather)} w-4`} />
                                <span>{log.weather}</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Project Information */}
                <div className="space-y-2 mb-4">
                    {log.crew && (
                        <div className="flex items-center gap-2 text-sm">
                            <i className="fas fa-users w-4 text-base-content/60" />
                            <span className="font-medium">Crew: {log.crew.name}</span>
                        </div>
                    )}

                    {log.client?.name && (
                        <div className="flex items-center gap-2 text-sm">
                            <i className="fas fa-building w-4 text-base-content/60" />
                            <span className="text-base-content/80">Client: {log.client.name}</span>
                        </div>
                    )}

                    {log.work_completed && (
                        <div className="flex items-start gap-2 text-sm">
                            <i className="fas fa-check-circle w-4 text-base-content/60 mt-0.5" />
                            <div className="flex-1 min-w-0">
                                <span className="text-base-content/60">Work Completed:</span>
                                <p className="text-base-content/80 text-xs mt-1 line-clamp-2">
                                    {log.work_completed}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Statistics Section */}
                <div className="divider my-3"></div>

                <div className="stats stats-horizontal w-full mb-auto">
                    <div className="stat px-2 py-3">
                        <div className="stat-value text-primary">{log.hours_worked || 0}</div>
                        <div className="stat-title">Hours Worked</div>
                    </div>
                    <div className="stat px-2 py-3">
                        <div className="stat-value text-success">{log.materials.length}</div>
                        <div className="stat-title">Materials</div>
                    </div>
                    <div className="stat px-2 py-3">
                        <div className="stat-value text-warning">{formatCurrency(getTotalMaterialCost())}</div>
                        <div className="stat-title">Material Cost</div>
                    </div>
                </div>                {/* Materials and Equipment Preview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                            <i className="fas fa-boxes text-xs text-base-content/60" />
                            Materials ({log.materials.length})
                        </h4>
                        <div className="space-y-1">
                            {log.materials.length > 0 ? (
                                <>
                                    {log.materials.slice(0, 2).map((material) => (
                                        <div key={material.id} className="text-xs text-base-content/70 flex justify-between">
                                            <span className="truncate">{material.name}</span>
                                            <span className="text-base-content/50">
                                                {material.quantity} × {formatCurrency(material.cost)}
                                            </span>
                                        </div>
                                    ))}
                                    {log.materials.length > 2 && (
                                        <div className="text-xs text-base-content/50">
                                            +{log.materials.length - 2} more...
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-xs text-base-content/50 italic">
                                    No materials recorded
                                </div>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium text-sm mb-2 flex items-center gap-1">
                            <i className="fas fa-tools text-xs text-base-content/60" />
                            Equipment ({log.equipment.length})
                        </h4>
                        <div className="space-y-1">
                            {log.equipment.length > 0 ? (
                                <>
                                    {log.equipment.slice(0, 2).map((equip) => (
                                        <div key={equip.id} className="text-xs text-base-content/70 flex justify-between">
                                            <span className="truncate">{equip.name}</span>
                                            <span className="text-base-content/50">{equip.hours}h</span>
                                        </div>
                                    ))}
                                    {log.equipment.length > 2 && (
                                        <div className="text-xs text-base-content/50">
                                            +{log.equipment.length - 2} more...
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="text-xs text-base-content/50 italic">
                                    No equipment recorded
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Issues and Alerts */}
                {hasIssues() && (
                    <div className="alert alert-warning py-2 mb-4">
                        <i className="fas fa-exclamation-triangle text-sm" />
                        <div className="text-sm">
                            <div className="font-medium">Attention Required</div>
                            <div className="text-xs text-base-content/70">
                                Safety concerns, delays, or quality issues reported
                            </div>
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                <div className="card-actions justify-between items-center pt-2">
                    <div className="flex gap-1">
                        {log.project?.id && (
                            <Link
                                href={`/dashboard/projects/${log.project.id}`}
                                className="btn btn-ghost btn-sm btn-circle"
                                title="View project"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <i className="fas fa-project-diagram text-sm" />
                            </Link>
                        )}
                        {log.crew?.id && (
                            <Link
                                href={`/dashboard/crews/${log.crew.id}`}
                                className="btn btn-ghost btn-sm btn-circle"
                                title="View crew"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <i className="fas fa-users text-sm" />
                            </Link>
                        )}
                        <button
                            className="btn btn-ghost btn-sm btn-circle"
                            title="Export log"
                            onClick={(e) => {
                                e.stopPropagation();
                                // TODO: Implement export functionality
                            }}
                        >
                            <i className="fas fa-download text-sm" />
                        </button>
                    </div>
                    <Link
                        href={`/dashboard/daily-logs/${log.id}`}
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
