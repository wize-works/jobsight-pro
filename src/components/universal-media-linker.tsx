"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Media, MediaType } from "@/types/media";

export interface UniversalMediaLinkerProps {
    // Data
    availableMedia: Media[];
    linkedMedia?: Media[];
    onLink: (mediaIds: string[]) => Promise<{ success: boolean; error?: string }>;
    onUnlink?: (mediaIds: string[]) => Promise<{ success: boolean; error?: string }>;

    // Configuration
    multiple?: boolean;
    maxSelections?: number;
    allowedTypes?: MediaType[];

    // UI Configuration
    title?: string;
    description?: string;
    showSearch?: boolean;
    showFilters?: boolean;
    compact?: boolean;
    disabled?: boolean;

    // Events
    onSelectionChange?: (selectedIds: string[]) => void;
}

const UniversalMediaLinker: React.FC<UniversalMediaLinkerProps> = ({
    availableMedia,
    linkedMedia = [],
    onLink,
    onUnlink,
    multiple = true,
    maxSelections = 20,
    allowedTypes,
    title = "Link Media Files",
    description = "Select files to link",
    showSearch = true,
    showFilters = true,
    compact = false,
    disabled = false,
    onSelectionChange,
}) => {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [isLinking, setIsLinking] = useState(false);
    const [filteredMedia, setFilteredMedia] = useState<Media[]>([]);

    // Get linked media IDs
    const linkedMediaIds = linkedMedia.map(m => m.id);

    // Filter media based on search and filters
    useEffect(() => {
        let filtered = [...availableMedia];

        // Filter by type
        if (allowedTypes && allowedTypes.length > 0) {
            filtered = filtered.filter(media =>
                allowedTypes.includes(media.type as MediaType)
            );
        }

        if (filterType !== "all") {
            filtered = filtered.filter(media => {
                if (filterType === "image") return media.type === "image";
                if (filterType === "video") return media.type === "video";
                if (filterType === "audio") return media.type === "audio";
                if (filterType === "document") return media.type === "file" || media.type === "document";
                return true;
            });
        }

        // Filter by search term
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            filtered = filtered.filter(media =>
                (media.name || "").toLowerCase().includes(term) ||
                (media.description || "").toLowerCase().includes(term)
            );
        }

        setFilteredMedia(filtered);
    }, [availableMedia, searchTerm, filterType, allowedTypes]);

    // Handle media selection
    const handleMediaSelect = useCallback((mediaId: string) => {
        if (disabled) return;

        setSelectedIds(prev => {
            let newSelection: string[];

            if (prev.includes(mediaId)) {
                // Remove if already selected
                newSelection = prev.filter(id => id !== mediaId);
            } else {
                // Add if not selected
                if (!multiple) {
                    newSelection = [mediaId];
                } else if (prev.length >= maxSelections) {
                    // Don't add if at max
                    return prev;
                } else {
                    newSelection = [...prev, mediaId];
                }
            }

            if (onSelectionChange) {
                onSelectionChange(newSelection);
            }

            return newSelection;
        });
    }, [disabled, multiple, maxSelections, onSelectionChange]);

    // Select all filtered media
    const handleSelectAll = useCallback(() => {
        if (disabled) return;

        const selectableMedia = filteredMedia
            .filter(m => !linkedMediaIds.includes(m.id))
            .slice(0, maxSelections);

        const allIds = selectableMedia.map(m => m.id);

        if (selectedIds.length === allIds.length) {
            setSelectedIds([]);
            if (onSelectionChange) onSelectionChange([]);
        } else {
            setSelectedIds(allIds);
            if (onSelectionChange) onSelectionChange(allIds);
        }
    }, [disabled, filteredMedia, linkedMediaIds, maxSelections, selectedIds.length, onSelectionChange]);

    // Handle linking
    const handleLink = useCallback(async () => {
        if (selectedIds.length === 0 || isLinking) return;

        setIsLinking(true);
        try {
            const result = await onLink(selectedIds);
            if (result.success) {
                setSelectedIds([]);
                if (onSelectionChange) onSelectionChange([]);
            }
        } finally {
            setIsLinking(false);
        }
    }, [selectedIds, isLinking, onLink, onSelectionChange]);

    // Handle unlinking
    const handleUnlink = useCallback(async (mediaIds: string[]) => {
        if (!onUnlink || isLinking) return;

        setIsLinking(true);
        try {
            await onUnlink(mediaIds);
        } finally {
            setIsLinking(false);
        }
    }, [onUnlink, isLinking]);

    // Get media icon
    const getMediaIcon = useCallback((type: string): string => {
        switch (type) {
            case "image": return "far fa-image";
            case "video": return "far fa-video";
            case "audio": return "far fa-music";
            case "file":
            case "document":
            default: return "far fa-file";
        }
    }, []);

    // Format file size
    const formatFileSize = useCallback((bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }, []);

    // Format date
    const formatDate = useCallback((dateString: string): string => {
        return new Date(dateString).toLocaleDateString();
    }, []);

    return (
        <div className={`space-y-4 pt-6 ${compact ? 'text-sm' : ''}`}>
            {/* Header */}
            {!compact && (
                <div>
                    <h3 className="text-lg font-semibold">Link Media</h3>
                    <p className="text-base-content/70 text-sm">Link to existing images, videos, documents, and other files related to this.</p>
                </div>
            )}

            {/* Search and Filters */}
            {(showSearch || showFilters) && (
                <div className="flex flex-col sm:flex-row gap-4">
                    {showSearch && (
                        <div className="flex-1">
                            <input
                                type="text"
                                className="input input-bordered input-secondary w-full"
                                placeholder="Search files..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                disabled={disabled}
                            />
                        </div>
                    )}

                    {showFilters && (
                        <div className="flex gap-2">
                            <select
                                className="select select-bordered input-secondary"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value)}
                                disabled={disabled}
                            >
                                <option value="all">All Types</option>
                                <option value="image">Images</option>
                                <option value="video">Videos</option>
                                <option value="audio">Audio</option>
                                <option value="document">Documents</option>
                            </select>

                            {multiple && filteredMedia.length > 0 && (
                                <button
                                    type="button"
                                    className="btn btn-outline"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSelectAll();
                                    }}
                                    disabled={disabled || isLinking}
                                >
                                    {selectedIds.length === filteredMedia.filter(m => !linkedMediaIds.includes(m.id)).length
                                        ? "Deselect All" : "Select All"}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Selection Summary */}
            {selectedIds.length > 0 && (
                <div className="bg-primary/10 border border-primary/20 rounded-lg p-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                            {selectedIds.length} file{selectedIds.length !== 1 ? 's' : ''} selected
                        </span>
                        <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleLink();
                            }}
                            disabled={disabled || isLinking}
                        >
                            {isLinking ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Linking...
                                </>
                            ) : (
                                <>
                                    <i className="far fa-link"></i>
                                    Link Selected
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Currently Linked Media */}
            {linkedMedia.length > 0 && (
                <div className="border border-base-300 rounded-lg p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                        <i className="far fa-link text-primary"></i>
                        Currently Linked ({linkedMedia.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {linkedMedia.map((media) => (
                            <div key={media.id} className="flex items-center gap-3 p-2 bg-success/10 border border-success/20 rounded-lg">
                                <i className={`${getMediaIcon(media.type || "file")} text-lg text-success`}></i>
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{media.name || "Untitled"}</p>
                                    <p className="text-xs text-base-content/60">
                                        {formatFileSize(media.size || 0)}
                                    </p>
                                </div>
                                {onUnlink && (
                                    <button
                                        type="button"
                                        className="btn btn-ghost btn-xs btn-circle"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            handleUnlink([media.id]);
                                        }}
                                        disabled={disabled || isLinking}
                                        title="Unlink file"
                                    >
                                        <i className="far fa-unlink"></i>
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Available Media Grid */}
            <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                    <i className="far fa-folder text-primary"></i>
                    Available Media ({filteredMedia.length})
                </h4>

                {filteredMedia.length === 0 ? (
                    <div className="text-center py-8 border-2 border-dashed border-base-300 rounded-lg">
                        <i className="far fa-folder-open text-4xl text-base-content/30 mb-4"></i>
                        <h3 className="text-lg font-semibold mb-2">No Media Available</h3>
                        <p className="text-base-content/70">
                            {availableMedia.length === 0
                                ? "No media files found. Upload some files first."
                                : "No media matches your search criteria."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                        {filteredMedia.map((media) => {
                            const isLinked = linkedMediaIds.includes(media.id);
                            const isSelected = selectedIds.includes(media.id);

                            return (
                                <div
                                    key={media.id}
                                    className={`card bg-base-200 border-2 cursor-pointer transition-all ${isLinked
                                        ? "border-success bg-success/5 opacity-60"
                                        : isSelected
                                            ? "border-primary bg-primary/5"
                                            : "border-base-300 hover:border-base-400"
                                        } ${disabled ? 'cursor-not-allowed' : ''}`}
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (!isLinked) {
                                            handleMediaSelect(media.id);
                                        }
                                    }}
                                >
                                    <div className="card-body p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <i className={`${getMediaIcon(media.type || "file")} text-lg text-primary`}></i>
                                                <span className="badge badge-outline badge-sm">
                                                    {media.type}
                                                </span>
                                            </div>

                                            {isLinked ? (
                                                <span className="badge badge-success badge-sm">
                                                    <i className="far fa-check mr-1"></i>Linked
                                                </span>
                                            ) : (
                                                <input
                                                    type="checkbox"
                                                    className="checkbox checkbox-primary checkbox-sm"
                                                    checked={isSelected}
                                                    onChange={() => handleMediaSelect(media.id)}
                                                    disabled={disabled || isLinking}
                                                />
                                            )}
                                        </div>

                                        <h5 className="font-medium text-sm truncate" title={media.name || "Untitled"}>
                                            {media.name || "Untitled"}
                                        </h5>

                                        {media.description && (
                                            <p className="text-xs text-base-content/70 line-clamp-2 mt-1">
                                                {media.description}
                                            </p>
                                        )}

                                        <div className="flex justify-between items-center mt-3 text-xs text-base-content/60">
                                            <span>{formatFileSize(media.size || 0)}</span>
                                            <span>{formatDate(media.uploaded_at || media.created_at || new Date().toISOString())}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UniversalMediaLinker;
