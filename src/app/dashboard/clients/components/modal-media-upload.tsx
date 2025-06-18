import React, { useState, useRef } from "react";
import { MediaType, mediaTypeOptions } from "@/types/media";

interface MediaUploadData {
    file: File | null;
    type: MediaType;
    description: string;
    tags: string;
}

interface ModalMediaUploadProps {
    title: string;
    loading: boolean;
    onClose: () => void;
    onSubmit: (formData: MediaUploadData) => Promise<{ success: boolean }>;
    clientName?: string;
}

const ModalMediaUpload: React.FC<ModalMediaUploadProps> = ({
    title,
    loading,
    onClose,
    onSubmit,
    clientName
}) => {
    const [formData, setFormData] = useState<MediaUploadData>({
        file: null,
        type: "documents" as MediaType,
        description: "",
        tags: ""
    });

    const [errors, setErrors] = useState<{ [key: string]: string }>({});
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragOver, setDragOver] = useState(false);

    const validateForm = (): boolean => {
        const newErrors: { [key: string]: string } = {};

        if (!formData.file) {
            newErrors.file = "Please select a file to upload";
        }

        if (!formData.description.trim()) {
            newErrors.description = "Description is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof MediaUploadData, value: string | File | null | MediaType) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));

        // Clear error when user starts typing/selecting
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ""
            }));
        }
    };

    const handleFileSelect = (file: File) => {
        handleInputChange('file', file);

        // Auto-detect type based on file extension
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (extension) {
            if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
                handleInputChange('type', 'images');
            } else if (['mp4', 'avi', 'mov', 'wmv'].includes(extension)) {
                handleInputChange('type', 'videos');
            } else if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) {
                handleInputChange('type', 'audios');
            } else if (['pdf', 'doc', 'docx', 'txt'].includes(extension)) {
                handleInputChange('type', 'documents');
            } else {
                handleInputChange('type', 'files');
            }
        }
    };

    const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);

        const file = e.dataTransfer.files[0];
        if (file) {
            handleFileSelect(file);
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = () => {
        setDragOver(false);
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const result = await onSubmit(formData);
        if (result.success) {
            onClose();
        }
    };

    return (
        <div className="modal modal-open">
            <div className="modal-box max-w-2xl w-full">
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
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* File Upload Section */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-6">
                                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-upload text-primary"></i>
                                    File Upload
                                </h4>

                                <div
                                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragOver
                                            ? 'border-primary bg-primary/5'
                                            : formData.file
                                                ? 'border-success bg-success/5'
                                                : 'border-base-300 hover:border-base-400'
                                        }`}
                                    onDrop={handleDrop}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                >
                                    {formData.file ? (
                                        <div className="space-y-3">
                                            <div className="text-success">
                                                <i className="far fa-check-circle text-3xl"></i>
                                            </div>
                                            <div>
                                                <p className="font-medium">{formData.file.name}</p>
                                                <p className="text-sm text-base-content/60">
                                                    {formatFileSize(formData.file.size)}
                                                </p>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-outline btn-sm"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={loading}
                                            >
                                                Change File
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div className="text-base-content/60">
                                                <i className="far fa-cloud-upload text-3xl"></i>
                                            </div>
                                            <div>
                                                <p className="font-medium">Drag and drop a file here</p>
                                                <p className="text-sm text-base-content/60">or click to browse</p>
                                            </div>
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm"
                                                onClick={() => fileInputRef.current?.click()}
                                                disabled={loading}
                                            >
                                                Browse Files
                                            </button>
                                        </div>
                                    )}

                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileInputChange}
                                        disabled={loading}
                                        accept="*/*"
                                    />
                                </div>

                                {errors.file && (
                                    <div className="text-error text-sm mt-2">{errors.file}</div>
                                )}
                            </div>
                        </div>

                        {/* File Details Section */}
                        <div className="card bg-base-100 border border-base-300">
                            <div className="card-body p-6">
                                <h4 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                    <i className="far fa-info-circle text-primary"></i>
                                    File Details
                                </h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">File Type</span>
                                        </label>                                        <select
                                            className="select select-bordered select-secondary"
                                            value={formData.type}
                                            onChange={(e) => handleInputChange('type', e.target.value as MediaType)}
                                            disabled={loading}
                                        >
                                            <option value="documents">Document</option>
                                            <option value="images">Image</option>
                                            <option value="videos">Video</option>
                                            <option value="audios">Audio</option>
                                            <option value="files">File</option>
                                        </select>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text font-medium">Tags</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered input-secondary"
                                            value={formData.tags}
                                            onChange={(e) => handleInputChange('tags', e.target.value)}
                                            placeholder="e.g., contract, invoice, blueprint"
                                            disabled={loading}
                                        />
                                        <div className="label">
                                            <span className="label-text-alt text-base-content/60">
                                                Separate multiple tags with commas
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="form-control mt-4">
                                    <label className="label">
                                        <span className="label-text font-medium">Description *</span>
                                    </label>
                                    <textarea
                                        className={`textarea textarea-bordered textarea-secondary ${errors.description ? 'textarea-error' : ''}`}
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        placeholder="Describe what this file contains..."
                                        rows={3}
                                        disabled={loading}
                                        required
                                    />
                                    {errors.description && (
                                        <label className="label">
                                            <span className="label-text-alt text-error">{errors.description}</span>
                                        </label>
                                    )}
                                </div>
                            </div>
                        </div>
                    </form>
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
                            disabled={loading || !formData.file}
                        >
                            {loading && <span className="loading loading-spinner loading-sm"></span>}
                            {loading ? "Uploading..." : "Upload File"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ModalMediaUpload;
