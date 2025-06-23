import { Media } from "@/types/media";
import { Project } from "@/types/projects";
import { mediaTypeOptions, MediaType } from "@/types/media";
import Link from "next/link";

interface MediaCardProps {
    media: Media;
    projects: Project[];
    isSelected?: boolean;
    onSelect?: (mediaId: string) => void;
    onDelete?: (mediaId: string) => void;
}

export const MediaCard = ({
    media,
    projects,
    isSelected = false,
    onSelect,
    onDelete
}: MediaCardProps) => {
    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Unknown";
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    };

    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return "Unknown size";
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    const getProjectName = (projectId: string | null) => {
        if (!projectId) return "No Project";
        const project = projects.find(p => p.id === projectId);
        return project?.name || "Unknown Project";
    };

    const getFileIcon = (type: string | null) => {
        switch (type) {
            case "image":
                return "fas fa-image";
            case "video":
                return "fas fa-video";
            case "document":
                return "fas fa-file-alt";
            case "audio":
                return "fas fa-volume-up";
            default:
                return "fas fa-file";
        }
    };

    const getMediaInitials = () => {
        if (!media.name) return "??";
        return media.name
            .split(/[\s._-]+/)
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getTypeColor = (type: string | null) => {
        switch (type) {
            case "image": return "text-accent";
            case "video": return "text-primary";
            case "document": return "text-secondary";
            case "audio": return "text-info";
            default: return "text-base-content";
        }
    };

    const getUploadedByText = () => {
        if (!media.uploaded_by) return "Unknown uploader";
        // You might want to fetch user details here
        return `User ${media.uploaded_by.slice(0, 8)}...`;
    };

    return (
        <div
            className={`card bg-base-100 shadow-xl border border-base-200 hover:shadow-2xl transition-shadow duration-200`}
            onClick={() => onSelect?.(media.id)}
        >
            {/* Media Preview */}
            <figure className="relative h-40 bg-base-200">
                {media.type === "image" ? (
                    <img
                        src={media.url || "/placeholder.svg"}
                        alt={media.name ?? ""}
                        className="object-cover w-full h-full"
                        loading="lazy"
                    />
                ) : (
                    <div className="flex flex-col items-center justify-center w-full h-full gap-2">
                        <i className={`${getFileIcon(media.type)} text-4xl ${getTypeColor(media.type)}`} />
                        {media.type && (
                            <span className="text-xs text-base-content/60 uppercase font-medium">
                                {media.type}
                            </span>
                        )}
                    </div>
                )}

                {/* Selection Checkbox */}
                <div className="absolute top-2 right-2">
                    <input
                        type="checkbox"
                        className="checkbox checkbox-primary checkbox-sm"
                        checked={isSelected}
                        onChange={(e) => {
                            e.stopPropagation();
                            onSelect?.(media.id);
                        }}
                    />
                </div>

                {/* Type Badge */}
                {media.type && (
                    <div className="absolute top-2 left-2">
                        {mediaTypeOptions.badge(media.type as MediaType)}
                    </div>
                )}
            </figure>

            <div className="card-body p-4">
                {/* Header Section */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="avatar avatar-placeholder">
                            <div className="w-8 h-8 rounded bg-neutral/10 flex items-center justify-center">
                                <span className="text-xs font-bold text-neutral">
                                    {getMediaInitials()}
                                </span>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate" title={media.name || "Untitled"}>
                                {media.name || "Untitled"}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Media Information */}
                <div className="space-y-1 mb-3 text-xs text-base-content/70">
                    <div className="flex items-center gap-2">
                        <i className="fas fa-project-diagram w-3 text-base-content/60" />
                        {media.project_id ? (
                            <span className="font-medium">{getProjectName(media.project_id)}</span>
                        ) : (
                            <span className="italic">No project assigned</span>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        <i className="fas fa-calendar-alt w-3 text-base-content/60" />
                        <span>Uploaded {formatDate(media.uploaded_at || media.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <i className="fas fa-hdd w-3 text-base-content/60" />
                        <span>{formatFileSize(media.size)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <i className="fas fa-user w-3 text-base-content/60" />
                        <span>{getUploadedByText()}</span>
                    </div>

                    {media.description && (
                        <div className="flex items-start gap-2">
                            <i className="fas fa-info-circle w-3 text-base-content/60 mt-0.5" />
                            <p className="line-clamp-2" title={media.description}>
                                {media.description}
                            </p>
                        </div>
                    )}
                </div>

                {/* Statistics Section */}
                <div className="divider my-2"></div>

                <div className="stats stats-horizontal w-full mb-3">
                    <div className="stat px-1 py-2">
                        <div className="stat-value text-sm text-primary">
                            {media.type ? media.type.toUpperCase() : 'FILE'}
                        </div>
                        <div className="stat-title text-xs">Type</div>
                    </div>
                    <div className="stat px-1 py-2">
                        <div className="stat-value text-sm text-success">
                            {formatFileSize(media.size)}
                        </div>
                        <div className="stat-title text-xs">Size</div>
                    </div>
                </div>                {/* Action Buttons */}
                <div className="card-actions justify-between items-center pt-2">
                    <div className="flex gap-1">
                        <a
                            href={media.url}
                            download
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-ghost btn-sm btn-circle"
                            title="Download media"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <i className="fas fa-download text-sm" />
                        </a>
                        <button
                            className="btn btn-ghost btn-sm btn-circle"
                            title="Copy link"
                            onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(media.url);
                            }}
                        >
                            <i className="fas fa-link text-sm" />
                        </button>
                        <button
                            className="btn btn-ghost btn-sm btn-circle text-error"
                            title="Delete media"
                            onClick={(e) => {
                                e.stopPropagation();
                                onDelete?.(media.id);
                            }}
                        >
                            <i className="fas fa-trash text-sm" />
                        </button>
                    </div>

                    <Link
                        href={`/dashboard/media/${media.id}`}
                        className="btn btn-primary btn-sm"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <i className="fas fa-eye text-sm mr-1" />
                        Details
                    </Link>
                </div>
            </div>
        </div>
    );
};
