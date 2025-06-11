"use client";

import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { MediaType } from "@/types/media";
import { uploadProjectMedia } from "@/app/actions/media";

interface MediaModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    onSuccess?: () => void;
}

export default function MediaModal({ isOpen, onClose, projectId, onSuccess }: MediaModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        type: "documents" as MediaType,
        file: null as File | null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [dragOver, setDragOver] = useState(false);

    const mediaTypeOptions = {
        documents: { label: "Document", icon: "fas fa-file-alt" },
        images: { label: "Image", icon: "fas fa-image" },
        videos: { label: "Video", icon: "fas fa-video" },
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                file,
                name: prev.name || file.name
            }));
        }
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);

        const file = e.dataTransfer.files?.[0];
        if (file) {
            setFormData(prev => ({
                ...prev,
                file,
                name: prev.name || file.name
            }));
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragOver(false);
    };

    const getFileTypeFromFile = (file: File): MediaType => {
        const type = file.type;
        if (type.startsWith('image/')) return 'images';
        if (type.startsWith('video/')) return 'videos';
        return 'documents';
    };

    const validateFile = (file: File): string | null => {
        const maxSize = 50 * 1024 * 1024; // 50MB

        if (file.size > maxSize) {
            return "File size must be less than 50MB";
        }

        const allowedTypes = [
            // Images
            'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp',
            // Videos
            'video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm',
            // Documents
            'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
            'text/plain', 'text/csv'
        ];

        if (!allowedTypes.includes(file.type)) {
            return "File type not supported";
        }

        return null;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        if (!formData.file) {
            setError("Please select a file to upload");
            setLoading(false);
            return;
        }

        if (!formData.name.trim()) {
            setError("Please enter a file name");
            setLoading(false);
            return;
        }

        // Validate file
        const fileError = validateFile(formData.file);
        if (fileError) {
            setError(fileError);
            setLoading(false);
            return;
        }

        try {
            // Auto-detect file type if not explicitly set
            const fileType = getFileTypeFromFile(formData.file);

            const success = await uploadProjectMedia(
                projectId,
                formData.file,
                formData.type || fileType,
                formData.description
            );

            if (success) {
                toast.success({
                    title: "Success",
                    description: "Media uploaded successfully"
                });

                // Reset form
                setFormData({
                    name: "",
                    description: "",
                    type: "documents" as MediaType,
                    file: null,
                });

                if (onSuccess) onSuccess();
                onClose();
            } else {
                throw new Error("Upload failed");
            }
        } catch (error) {
            console.error("Error uploading media:", error);
            const errorMessage = "Failed to upload media";
            setError(errorMessage);
            toast.error({
                title: "Error",
                description: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    const resetForm = () => {
        setFormData({
            name: "",
            description: "",
            type: "documents" as MediaType,
            file: null,
        });
        setError("");
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-4xl max-h-[90vh] p-0">
                {/* Modal Header */}
                <div className="bg-primary text-primary-content p-6 rounded-t-lg">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-bold">
                            Upload Media
                        </h2>
                        <button
                            className="btn btn-sm btn-circle btn-ghost text-primary-content hover:bg-primary-content hover:text-primary"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 overflow-y-auto max-h-[75vh]">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* File Upload */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-upload text-primary"></i>
                                    File Upload
                                </h3>

                                {/* File Drop Zone */}
                                <div
                                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragOver
                                        ? 'border-primary bg-primary/10'
                                        : formData.file
                                            ? 'border-success bg-success/10'
                                            : 'border-base-300 hover:border-primary/50'
                                        }`}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                >
                                    {formData.file ? (
                                        <div className="flex flex-col items-center gap-2">
                                            <i className="fas fa-check-circle text-success text-3xl"></i>
                                            <p className="font-medium">{formData.file.name}</p>
                                            <p className="text-sm text-base-content/70">
                                                {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                                            </p>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline"
                                                onClick={() => setFormData(prev => ({ ...prev, file: null }))}
                                                disabled={loading}
                                            >
                                                Remove File
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-2">
                                            <i className="fas fa-cloud-upload-alt text-4xl text-base-content/50"></i>
                                            <p className="text-lg font-medium">
                                                Drag & drop your file here
                                            </p>
                                            <p className="text-sm text-base-content/70">
                                                or click to browse
                                            </p>
                                            <input
                                                type="file"
                                                className="file-input file-input-bordered file-input-primary w-full max-w-xs"
                                                onChange={handleFileChange}
                                                disabled={loading}
                                                accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv"
                                            />
                                        </div>
                                    )}
                                </div>

                                <div className="text-xs text-base-content/50 mt-2">
                                    Supported formats: Images (JPEG, PNG, GIF, WebP), Videos (MP4, AVI, MOV, WMV, WebM),
                                    Documents (PDF, Word, Excel, PowerPoint, Text, CSV). Max size: 50MB.
                                </div>
                            </div>
                        </div>

                        {/* Media Details */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="fas fa-info-circle text-primary"></i>
                                    Media Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">File Name *</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="name"
                                            className="input input-bordered input-secondary"
                                            value={formData.name}
                                            onChange={handleInputChange}
                                            placeholder="Enter file name"
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Media Type</span>
                                        </label>
                                        <select
                                            name="type"
                                            className="select select-bordered select-secondary"
                                            value={formData.type}
                                            onChange={handleInputChange}
                                            disabled={loading}
                                        >
                                            {Object.entries(mediaTypeOptions).map(([key, { label, icon }]) => (
                                                <option key={key} value={key}>
                                                    {label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-control mt-4">
                                    <label className="label">
                                        <span className="label-text font-medium">Description</span>
                                    </label>
                                    <textarea
                                        name="description"
                                        className="textarea textarea-bordered textarea-secondary"
                                        value={formData.description}
                                        onChange={handleInputChange}
                                        placeholder="Enter a description for this media file..."
                                        rows={4}
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* File Preview */}
                        {formData.file && (
                            <div className="card bg-base-100 border border-base-300">
                                <div className="card-body p-4">
                                    <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                        <i className="fas fa-eye text-primary"></i>
                                        File Preview
                                    </h3>
                                    <div className="bg-base-50 rounded-lg p-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex-shrink-0">
                                                <i className={`${mediaTypeOptions[getFileTypeFromFile(formData.file) as keyof typeof mediaTypeOptions].icon} text-3xl text-primary`}></i>
                                            </div>
                                            <div className="flex-grow">
                                                <h4 className="font-medium">{formData.file.name}</h4>
                                                <p className="text-sm text-base-content/70">
                                                    Type: {formData.file.type} • Size: {(formData.file.size / 1024 / 1024).toFixed(2)} MB
                                                </p>
                                                <p className="text-sm text-base-content/70">
                                                    Category: {mediaTypeOptions[getFileTypeFromFile(formData.file) as keyof typeof mediaTypeOptions].label}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </form>
                </div>

                {/* Modal Footer */}
                <div className="bg-base-200 p-6 rounded-b-lg border-t border-base-300">
                    {error && (
                        <div className="alert alert-error mb-4">
                            <i className="fas fa-exclamation-triangle"></i>
                            <span>{error}</span>
                        </div>
                    )}
                    <div className="flex justify-end gap-3">
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={handleClose}
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary gap-2"
                            onClick={handleSubmit}
                            disabled={loading || !formData.file || !formData.name.trim()}
                        >
                            {loading ? (
                                <>
                                    <span className="loading loading-spinner loading-sm"></span>
                                    Uploading...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-upload"></i>
                                    Upload Media
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}