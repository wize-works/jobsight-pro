"use client";

import React, { useState } from "react";
import { Media, MediaType } from "@/types/media";
import UniversalMediaUploader, { UniversalMediaUploaderProps, MEDIA_CONFIGS } from "./universal-media-uploader";
import UniversalMediaLinker, { UniversalMediaLinkerProps } from "./universal-media-linker";
import { toast } from "@/hooks/use-toast";

export type MediaManagementMode = "upload" | "view" | "link" | "both";

export interface UniversalMediaManagerProps {
    // Core functionality
    mode: MediaManagementMode;
    entityType: keyof typeof MEDIA_CONFIGS | "custom";

    // Upload props (when mode includes upload)
    onUpload?: (file: File, metadata: { name: string; description: string; type: MediaType }) => Promise<boolean>;

    // Link props (when mode includes link)
    availableMedia?: Media[];
    linkedMedia?: Media[];
    onLink?: (mediaIds: string[]) => Promise<{ success: boolean; error?: string }>;
    onUnlink?: (mediaIds: string[]) => Promise<{ success: boolean; error?: string }>;

    // Configuration overrides
    uploadConfig?: Partial<UniversalMediaUploaderProps>;
    linkConfig?: Partial<UniversalMediaLinkerProps>;

    // Camera configuration
    enableCamera?: boolean;
    cameraQuality?: "low" | "medium" | "high" | number;

    // UI Configuration
    title?: string;
    description?: string;
    compact?: boolean;
    disabled?: boolean;

    // Events
    onComplete?: (results?: any) => void;
}

const UniversalMediaManager: React.FC<UniversalMediaManagerProps> = ({
    mode,
    entityType,
    onUpload,
    availableMedia = [],
    linkedMedia = [],
    onLink,
    onUnlink,
    uploadConfig = {},
    linkConfig = {},
    enableCamera = false,
    cameraQuality = "medium",
    title,
    description,
    compact = false,
    disabled = false,
    onComplete,
}) => {
    const [activeTab, setActiveTab] = useState<"view" | "upload" | "link">(() => {
        if (mode === "view" || mode === "upload" || mode === "both") return "view";
        if (mode === "link") return "link";
        // For "both" mode, default to "view" if there's linked media, otherwise "upload"
        return linkedMedia.length > 0 ? "view" : "link";
    });

    // Utility function for formatting file sizes
    const formatFileSize = (bytes: number | null) => {
        if (!bytes) return "Unknown size";
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        if (bytes === 0) return '0 Bytes';
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    };

    // Get base configuration for entity type
    const baseConfig = entityType === "custom" ? {} : MEDIA_CONFIGS[entityType];

    // Convert cameraQuality to number if it's a string
    const numericCameraQuality = typeof cameraQuality === "string"
        ? (cameraQuality === "low" ? 0.6 : cameraQuality === "medium" ? 0.8 : 0.9)
        : cameraQuality;

    // Merge configurations
    const finalUploadConfig: UniversalMediaUploaderProps = {
        onUpload: onUpload!,
        ...baseConfig,
        ...uploadConfig,
        enableCamera,
        cameraQuality: numericCameraQuality,
        title: title || (baseConfig as any)?.title || "Upload Media",
        description: description || (baseConfig as any)?.description || "Upload files",
        compact,
        disabled,
        onComplete: (results) => {
            if (results.success.length > 0) {
                toast.success({
                    title: "Upload successful",
                    description: `${results.success.length} file(s) uploaded successfully`,
                });
            }
            if (onComplete) onComplete(results);
        },
    };

    const finalLinkConfig: UniversalMediaLinkerProps = {
        availableMedia,
        linkedMedia,
        onLink: onLink!,
        onUnlink,
        ...linkConfig,
        title: title || "Link Media Files",
        description: description || "Select existing files to link",
        compact,
        disabled,
        onSelectionChange: (selectedIds) => {
            // Handle selection change if needed
        },
    };

    if (mode === "upload") {
        return (
            <div className="space-y-6">
                <UniversalMediaUploader {...finalUploadConfig} />
            </div>
        );
    }

    if (mode === "link") {
        return (
            <div className="space-y-6">
                <UniversalMediaLinker {...finalLinkConfig} />
            </div>
        );
    }    // Both mode - show tabs
    return (
        <div className="space-y-6">
            {/* Tab Navigation */}
            <div className="tabs tabs-box">
                <button
                    type="button"
                    className={`tab ${activeTab === "view" ? "tab-active" : ""}`}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveTab("view");
                    }}
                    disabled={disabled}
                >
                    <i className="far fa-eye mr-2"></i>
                    View Media ({linkedMedia.length})
                </button>
                <button
                    type="button"
                    className={`tab ${activeTab === "link" ? "tab-active" : ""}`}
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveTab("link");
                    }}
                    disabled={disabled}
                >
                    <i className="far fa-link mr-2"></i>
                    Upload or Link to Existing
                </button>
            </div>

            {/* Tab Content */}
            <div className="min-h-96">
                {activeTab === "view" && (
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-lg">Linked Media Files</h3>
                            {linkedMedia.length > 0 && onUnlink && (
                                <button
                                    type="button"
                                    className="btn btn-outline btn-sm"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (confirm(`Remove all ${linkedMedia.length} linked media files?`)) {
                                            onUnlink(linkedMedia.map(m => m.id));
                                        }
                                    }}
                                    disabled={disabled}
                                >
                                    <i className="far fa-unlink mr-1"></i>
                                    Unlink All
                                </button>
                            )}
                        </div>

                        {linkedMedia.length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <i className="far fa-images text-4xl mb-4"></i>
                                <p>No media files linked to this {entityType}.</p>
                                <p className="text-sm mt-2">Use the Upload or Link tabs to add media files.</p>
                            </div>) : (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {linkedMedia.map((media) => (
                                    <div
                                        key={media.id}
                                        className="bg-base-100 rounded-lg border border-base-200 hover:border-base-300 hover:shadow-lg transition-all duration-200 overflow-hidden"
                                    >
                                        {/* Media Preview */}
                                        <figure className="relative h-48 bg-base-200">
                                            {media.type === "image" ? (
                                                <img
                                                    src={media.url}
                                                    alt={media.name || 'Media file'}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : media.type === "video" ? (
                                                <div className="relative w-full h-full">
                                                    <video
                                                        src={media.url}
                                                        className="w-full h-full object-cover"
                                                        muted
                                                        preload="metadata"
                                                    />
                                                    <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                                                        <i className="fas fa-play-circle text-white text-4xl"></i>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                                                    <i className={`text-4xl ${media.type === "document" ? "fas fa-file-alt text-secondary" :
                                                        media.type === "audio" ? "fas fa-file-audio text-info" :
                                                            "fas fa-file text-base-content/60"
                                                        }`}></i>
                                                    <span className="text-xs text-base-content/60 uppercase font-medium">
                                                        {media.type === "document" ? "Document" :
                                                            media.type === "audio" ? "Audio" : "File"}
                                                    </span>
                                                </div>
                                            )}

                                            {/* Type Badge */}
                                            {media.type && (
                                                <div className="absolute top-2 left-2">
                                                    <span className={`badge badge-sm ${media.type === "image" ? "badge-accent" :
                                                        media.type === "video" ? "badge-primary" :
                                                            media.type === "document" ? "badge-secondary" :
                                                                media.type === "audio" ? "badge-info" : "badge-outline"
                                                        }`}>
                                                        {media.type.toUpperCase()}
                                                    </span>
                                                </div>
                                            )}
                                        </figure>
                                        <div className="p-4">
                                            {/* Header Section */}
                                            <div className="flex items-start justify-between mb-3">
                                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                                    <div className="avatar avatar-placeholder">
                                                        <div className="w-8 h-8 rounded bg-neutral/10 flex items-center justify-center">
                                                            <span className="text-xs font-bold text-neutral">
                                                                {(media.name || 'File').split(' ').map(w => w.charAt(0)).join('').slice(0, 2).toUpperCase()}
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

                                            {/* Description */}
                                            {media.description && (
                                                <div className="mb-3">
                                                    <p className="text-xs text-base-content/70 line-clamp-2" title={media.description}>
                                                        {media.description}
                                                    </p>
                                                </div>
                                            )}

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
                                                        {media.size ? formatFileSize(media.size) : 'Unknown'}
                                                    </div>
                                                    <div className="stat-title text-xs">Size</div>
                                                </div>
                                            </div>
                                            {/* Action Buttons */}
                                            <div className="flex gap-1 pt-2">
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
                                                <a
                                                    href={media.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="btn btn-ghost btn-sm btn-circle"
                                                    title="View media"
                                                    onClick={(e) => e.stopPropagation()}
                                                >
                                                    <i className="fas fa-external-link-alt text-sm" />
                                                </a>
                                                {onUnlink && (
                                                    <button
                                                        className="btn btn-ghost btn-sm btn-circle text-error"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            onUnlink([media.id]);
                                                        }}
                                                        disabled={disabled}
                                                        title="Unlink media"
                                                    >
                                                        <i className="fas fa-unlink text-sm" />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
                {activeTab === "link" && (
                    <>
                        <UniversalMediaUploader {...finalUploadConfig} />
                        <UniversalMediaLinker {...finalLinkConfig} />
                    </>
                )}
            </div>
        </div>
    );
};

export default UniversalMediaManager;
