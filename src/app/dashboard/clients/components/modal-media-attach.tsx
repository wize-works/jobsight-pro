import React, { useState, useEffect } from "react";
import { Media, mediaTypeOptions } from "@/types/media";

interface ModalAttachMediaProps {
    title: string;
    loading: boolean;
    onClose: () => void;
    onSubmit: (mediaIds: string[]) => Promise<{ success: boolean }>;
    availableMedia: Media[];
    clientName?: string;
}

const ModalAttachMedia: React.FC<ModalAttachMediaProps> = ({
    title,
    loading,
    onClose,
    onSubmit,
    availableMedia,
    clientName
}) => {
    const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [filteredMedia, setFilteredMedia] = useState<Media[]>(availableMedia);

    // Filter media based on search term and type filter
    useEffect(() => {
        let filtered = availableMedia;

        // Filter by type
        if (filterType !== "all") {
            filtered = filtered.filter(media => {
                if (filterType === "image") return media.type === "image";
                if (filterType === "video") return media.type === "video";
                if (filterType === "audio") return media.type === "audio";
                if (filterType === "file") return media.type === "file" || media.type === "document";
                return true;
            });
        }        // Filter by search term
        if (searchTerm.trim()) {
            filtered = filtered.filter(media =>
                (media.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                (media.description && media.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        setFilteredMedia(filtered);
    }, [availableMedia, searchTerm, filterType]);

    const handleMediaSelect = (mediaId: string) => {
        setSelectedMediaIds(prev => {
            if (prev.includes(mediaId)) {
                return prev.filter(id => id !== mediaId);
            } else {
                return [...prev, mediaId];
            }
        });
    };

    const handleSelectAll = () => {
        if (selectedMediaIds.length === filteredMedia.length) {
            setSelectedMediaIds([]);
        } else {
            setSelectedMediaIds(filteredMedia.map(media => media.id));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (selectedMediaIds.length === 0) {
            return;
        }

        const result = await onSubmit(selectedMediaIds);
        if (result.success) {
            onClose();
        }
    };

    const getMediaIcon = (type: string): string => {
        switch (type) {
            case "image": return "far fa-image";
            case "video": return "far fa-video";
            case "audio": return "far fa-music";
            case "file":
            case "document":
            default: return "far fa-file";
        }
    };

    const getFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString: string): string => {
        return new Date(dateString).toLocaleDateString();
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-4xl w-full">
                {/* Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg -m-6 mb-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-semibold">{title}</h3>
                        <button
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            onClick={onClose}
                            disabled={loading}
                        >
                            <i className="far fa-times"></i>
                        </button>
                    </div>
                    {clientName && (
                        <p className="text-primary-content/80 mt-2">
                            for {clientName}
                        </p>
                    )}
                </div>

                {/* Body */}
                <div className="space-y-6 overflow-y-auto max-h-[75vh]">
                    {/* Filters and Search */}
                    <div className="card bg-base-100 border border-base-300">
                        <div className="card-body p-6">
                            <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                <i className="far fa-search text-primary"></i>
                                Search & Filter
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Search Files</span>
                                    </label>
                                    <input
                                        type="text"
                                        className="input input-bordered input-secondary"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        placeholder="Search by name or description..."
                                        disabled={loading}
                                    />
                                </div>

                                <div className="form-control">
                                    <label className="label">
                                        <span className="label-text font-medium">Filter by Type</span>
                                    </label>
                                    <select
                                        className="select select-bordered select-secondary"
                                        value={filterType}
                                        onChange={(e) => setFilterType(e.target.value)}
                                        disabled={loading}
                                    >
                                        <option value="all">All Types</option>
                                        <option value="image">Images</option>
                                        <option value="video">Videos</option>
                                        <option value="audio">Audio</option>
                                        <option value="file">Documents & Files</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Media Selection */}
                    <div className="card bg-base-100 border border-base-300">
                        <div className="card-body p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h4 className="font-semibold text-lg flex items-center gap-2">
                                    <i className="far fa-images text-primary"></i>
                                    Available Media ({filteredMedia.length})
                                </h4>
                                {filteredMedia.length > 0 && (
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-base-content/60">
                                            {selectedMediaIds.length} selected
                                        </span>
                                        <button
                                            type="button"
                                            className="btn btn-outline btn-sm"
                                            onClick={handleSelectAll}
                                            disabled={loading}
                                        >
                                            {selectedMediaIds.length === filteredMedia.length ? "Deselect All" : "Select All"}
                                        </button>
                                    </div>
                                )}
                            </div>

                            {filteredMedia.length === 0 ? (
                                <div className="text-center py-8">
                                    <div className="text-base-content/60 mb-4">
                                        <i className="far fa-folder-open text-4xl"></i>
                                    </div>
                                    <h3 className="text-lg font-semibold mb-2">No Media Available</h3>
                                    <p className="text-base-content/70">
                                        {availableMedia.length === 0 
                                            ? "No media files found. Upload some files first."
                                            : "No media matches your search criteria."}
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {filteredMedia.map((media) => (
                                        <div
                                            key={media.id}
                                            className={`card bg-base-200 border-2 cursor-pointer transition-all ${
                                                selectedMediaIds.includes(media.id)
                                                    ? "border-primary bg-primary/5"
                                                    : "border-base-300 hover:border-base-400"
                                            }`}
                                            onClick={() => handleMediaSelect(media.id)}
                                        >
                                            <div className="card-body p-4">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div className="flex items-center gap-2">
                                                        <i className={`${getMediaIcon(media.type || "file")} text-lg text-primary`}></i>
                                                        <span className="badge badge-outline badge-sm">
                                                            {media.type}
                                                        </span>
                                                    </div>
                                                    <input
                                                        type="checkbox"
                                                        className="checkbox checkbox-primary checkbox-sm"
                                                        checked={selectedMediaIds.includes(media.id)}
                                                        onChange={() => handleMediaSelect(media.id)}
                                                        disabled={loading}
                                                    />
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
                                                    <span>{getFileSize(media.size || 0)}</span>
                                                    <span>{formatDate(media.uploaded_at || media.created_at || new Date().toISOString())}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="bg-base-200 p-6 rounded-b-lg -m-6 mt-6 border-t border-base-300">
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={onClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary gap-2"
                            onClick={handleSubmit}
                            disabled={loading || selectedMediaIds.length === 0}
                        >
                            {loading && <span className="loading loading-spinner loading-sm"></span>}
                            {loading ? "Attaching..." : `Attach ${selectedMediaIds.length} File${selectedMediaIds.length !== 1 ? 's' : ''}`}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalAttachMedia;
