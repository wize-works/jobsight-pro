"use client";

import React, { useState, useRef, useCallback } from "react";
import { MediaType } from "@/types/media";
import { toast } from "@/hooks/use-toast";
import { useCamera } from "@/hooks/useCamera";
import CameraPreview from "@/components/camera-preview";

interface MediaFile {
    file: File;
    id: string;
    progress: number;
    status: "pending" | "uploading" | "completed" | "error";
    preview?: string;
    error?: string;
}

export interface UniversalMediaUploaderProps {
    // Core functionality
    onUpload: (file: File, metadata: { name: string; description: string; type: MediaType }) => Promise<boolean>;
    onComplete?: (results: { success: MediaFile[], failed: MediaFile[] }) => void;

    // Configuration
    multiple?: boolean;
    maxFiles?: number;
    maxFileSize?: number; // in bytes
    acceptedTypes?: string[];
    allowedMediaTypes?: MediaType[];

    // UI Configuration
    title?: string;
    description?: string;
    showPreview?: boolean;
    compact?: boolean;
    disabled?: boolean;

    // Initial state
    existingFiles?: MediaFile[];

    // Camera configuration
    enableCamera?: boolean;
    enableVideoRecording?: boolean;
    cameraQuality?: number; // 0-1 for JPEG quality
}

// Default configurations for different contexts
export const MEDIA_CONFIGS = {
    dailyLog: {
        multiple: true,
        maxFiles: 10,
        maxFileSize: 50 * 1024 * 1024, // 50MB
        acceptedTypes: ["image/*", "video/*", ".pdf", ".doc", ".docx"],
        allowedMediaTypes: ["images", "videos", "documents"] as MediaType[],
        title: "Upload Photos & Documents",
        description: "Add photos and documents to your daily log",
        enableCamera: true,
        enableVideoRecording: false,
        cameraQuality: 0.8,
    },
    project: {
        multiple: true,
        maxFiles: 20,
        maxFileSize: 50 * 1024 * 1024,
        acceptedTypes: ["image/*", "video/*", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx"],
        allowedMediaTypes: ["images", "videos", "documents"] as MediaType[],
        title: "Upload Project Media",
        description: "Add images, videos, and documents to your project",
        enableCamera: true,
        enableVideoRecording: true,
        cameraQuality: 0.9,
    },
    client: {
        multiple: true,
        maxFiles: 15,
        maxFileSize: 50 * 1024 * 1024,
        acceptedTypes: ["image/*", ".pdf", ".doc", ".docx"],
        allowedMediaTypes: ["images", "documents"] as MediaType[],
        title: "Upload Client Files",
        description: "Add documents and images for this client",
        enableCamera: true,
        enableVideoRecording: false,
        cameraQuality: 0.8,
    },
    equipment: {
        multiple: false,
        maxFiles: 1,
        maxFileSize: 10 * 1024 * 1024, // 10MB for single equipment image
        acceptedTypes: ["image/*"],
        allowedMediaTypes: ["images"] as MediaType[],
        title: "Upload Equipment Image",
        description: "Add a photo of this equipment",
        enableCamera: true,
        enableVideoRecording: false,
        cameraQuality: 0.9,
    }
};

const UniversalMediaUploader: React.FC<UniversalMediaUploaderProps> = ({
    onUpload,
    onComplete,
    multiple = true,
    maxFiles = 10,
    maxFileSize = 50 * 1024 * 1024,
    acceptedTypes = ["image/*", "video/*", ".pdf", ".doc", ".docx"],
    allowedMediaTypes = ["images", "videos", "documents"],
    title = "Upload Media",
    description = "Drag and drop files or click to browse",
    showPreview = true,
    compact = false,
    disabled = false,
    existingFiles = [],
    enableCamera = true,
    enableVideoRecording = false,
    cameraQuality = 0.8,
}) => {
    const [files, setFiles] = useState<MediaFile[]>(existingFiles);
    const [dragActive, setDragActive] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [cameraMode, setCameraMode] = useState<'photo' | 'video' | null>(null);
    const [showFullscreenCamera, setShowFullscreenCamera] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Camera hook
    const camera = useCamera();

    // File validation
    const validateFile = useCallback((file: File): string | null => {
        if (file.size > maxFileSize) {
            const sizeMB = (maxFileSize / 1024 / 1024).toFixed(1);
            return `File size must be less than ${sizeMB}MB`;
        }

        if (acceptedTypes.length > 0) {
            const isValidType = acceptedTypes.some(type => {
                if (type.startsWith('.')) {
                    return file.name.toLowerCase().endsWith(type.toLowerCase());
                }
                return file.type.match(type.replace('*', '.*'));
            });

            if (!isValidType) {
                return `File type not supported. Accepted: ${acceptedTypes.join(', ')}`;
            }
        }

        return null;
    }, [maxFileSize, acceptedTypes]);

    // Determine media type from file
    const getMediaTypeFromFile = useCallback((file: File): MediaType => {
        if (file.type.startsWith('image/')) return 'images';
        if (file.type.startsWith('video/')) return 'videos';
        if (file.type.startsWith('audio/')) return 'audios';
        return 'documents';
    }, []);

    // Generate file preview
    const generatePreview = useCallback((file: File): Promise<string | undefined> => {
        return new Promise((resolve) => {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target?.result as string);
                reader.onerror = () => resolve(undefined);
                reader.readAsDataURL(file);
            } else {
                resolve(undefined);
            }
        });
    }, []);

    // Add files to the queue
    const addFiles = useCallback(async (newFiles: FileList | File[]) => {
        const fileArray = Array.from(newFiles);

        if (!multiple && fileArray.length > 1) {
            toast.error({
                title: "Multiple files not allowed",
                description: "Please select only one file",
            });
            return;
        }

        if (files.length + fileArray.length > maxFiles) {
            toast.error({
                title: "Too many files",
                description: `Maximum ${maxFiles} files allowed`,
            });
            return;
        }

        const validatedFiles: MediaFile[] = [];

        for (const file of fileArray) {
            const error = validateFile(file);
            const preview = showPreview ? await generatePreview(file) : undefined;
            const mediaFile: MediaFile = {
                file,
                id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                progress: 0,
                status: error ? "error" : "pending",
                preview,
                error: error || undefined,
            };

            validatedFiles.push(mediaFile);
        }

        setFiles(prev => [...prev, ...validatedFiles]);

        // Show validation errors
        const errorFiles = validatedFiles.filter(f => f.error);
        if (errorFiles.length > 0) {
            toast.error({
                title: "Some files have errors",
                description: `${errorFiles.length} file(s) could not be added`,
            });
        }
    }, [files.length, maxFiles, multiple, validateFile, showPreview, generatePreview]);

    // Handle drag and drop
    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
        if (!disabled && e.dataTransfer.files.length > 0) {
            addFiles(e.dataTransfer.files);
        }
    }, [disabled, addFiles]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!disabled) setDragActive(true);
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragActive(false);
    }, []);

    // Handle file input change
    const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!disabled && e.target.files) {
            addFiles(e.target.files);
        }
        // Reset input
        if (e.target) e.target.value = '';
    }, [disabled, addFiles]);

    // Remove file from queue
    const removeFile = useCallback((id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id));
    }, []);

    // Camera capture functions
    const handleCameraCapture = useCallback(async (mode: 'photo' | 'video' = 'photo') => {
        if (!enableCamera) return;

        try {
            setCameraMode(mode);
            await camera.startCamera({
                facingMode: 'environment', // Default to back camera for documentation
                quality: cameraQuality
            });
        } catch (error) {
            console.error('Failed to start camera:', error);
            toast.error({
                title: "Camera Error",
                description: "Failed to start camera. Please check permissions.",
            });
            setCameraMode(null);
        }
    }, [enableCamera, camera, cameraQuality]);

    const handlePhotoCapture = useCallback(async (capturedFile: File) => {
        try {
            // Stop camera
            camera.stopCamera();
            setCameraMode(null);
            setShowFullscreenCamera(false);

            // Add captured photo to files
            await addFiles([capturedFile]);

            toast.success({
                title: "Photo captured",
                description: "Photo added to upload queue",
            });
        } catch (error) {
            console.error('Failed to handle captured photo:', error);
            toast.error({
                title: "Capture Error",
                description: "Failed to process captured photo",
            });
        }
    }, [camera, addFiles]);

    const handleCameraClose = useCallback(() => {
        camera.stopCamera();
        setCameraMode(null);
        setShowFullscreenCamera(false);
    }, [camera]);

    const toggleFullscreenCamera = useCallback(() => {
        setShowFullscreenCamera(prev => !prev);
    }, []);

    // Upload all pending files
    const uploadFiles = useCallback(async () => {
        const pendingFiles = files.filter(f => f.status === "pending");
        if (pendingFiles.length === 0) return;

        setIsUploading(true);
        const results = { success: [] as MediaFile[], failed: [] as MediaFile[] };

        for (const mediaFile of pendingFiles) {
            try {
                // Update status to uploading
                setFiles(prev => prev.map(f =>
                    f.id === mediaFile.id ? { ...f, status: "uploading" as const, progress: 0 } : f
                ));

                // Determine metadata
                const mediaType = getMediaTypeFromFile(mediaFile.file);
                const metadata = {
                    name: mediaFile.file.name,
                    description: `Uploaded ${mediaType.slice(0, -1)} file`,
                    type: mediaType,
                };

                // Simulate progress (you can enhance this with actual progress tracking)
                const progressInterval = setInterval(() => {
                    setFiles(prev => prev.map(f => {
                        if (f.id === mediaFile.id && f.progress < 90) {
                            return { ...f, progress: f.progress + 10 };
                        }
                        return f;
                    }));
                }, 100);

                // Call upload function
                const success = await onUpload(mediaFile.file, metadata);

                clearInterval(progressInterval);

                if (success) {
                    setFiles(prev => prev.map(f =>
                        f.id === mediaFile.id ? { ...f, status: "completed" as const, progress: 100 } : f
                    ));
                    results.success.push(mediaFile);
                } else {
                    throw new Error("Upload failed");
                }
            } catch (error) {
                setFiles(prev => prev.map(f =>
                    f.id === mediaFile.id ? {
                        ...f,
                        status: "error" as const,
                        error: error instanceof Error ? error.message : "Upload failed"
                    } : f
                ));
                results.failed.push(mediaFile);
            }
        }

        setIsUploading(false);

        // Show results
        if (results.success.length > 0) {
            toast.success({
                title: "Upload completed",
                description: `${results.success.length} file(s) uploaded successfully`,
            });
        }

        if (results.failed.length > 0) {
            toast.error({
                title: "Some uploads failed",
                description: `${results.failed.length} file(s) could not be uploaded`,
            });
        }

        // Call completion callback
        if (onComplete) {
            onComplete(results);
        }
    }, [files, onUpload, getMediaTypeFromFile, onComplete]);

    // Get file icon
    const getFileIcon = useCallback((file: File) => {
        const type = getMediaTypeFromFile(file);
        switch (type) {
            case "images": return "far fa-image text-primary";
            case "videos": return "far fa-video text-secondary";
            case "audios": return "far fa-music text-accent";
            default: return "far fa-file text-base-content";
        }
    }, [getMediaTypeFromFile]);

    // Format file size
    const formatFileSize = useCallback((bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }, []);

    return (
        <div className={`space-y-4 ${compact ? 'text-sm' : ''}`}>
            {/* Header */}
            {!compact && (
                <div>
                    <h3 className="text-lg font-semibold">{title}</h3>
                    <p className="text-base-content/70 text-sm">{description}</p>
                </div>
            )}

            {/* Camera Controls */}
            {enableCamera && !disabled && (
                <div className="flex flex-wrap gap-2 justify-center">
                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCameraCapture('photo');
                        }}
                        disabled={camera.isActive}
                    >
                        <i className="fas fa-camera mr-2"></i>
                        Take Photo
                    </button>
                    {enableVideoRecording && (
                        <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleCameraCapture('video');
                            }}
                            disabled={camera.isActive}
                        >
                            <i className="fas fa-video mr-2"></i>
                            Record Video
                        </button>
                    )}
                    <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            fileInputRef.current?.click();
                        }}
                    >
                        <i className="fas fa-upload mr-2"></i>
                        Upload Files
                    </button>
                </div>
            )}

            {/* Camera Preview */}
            {cameraMode && camera.isActive && !showFullscreenCamera && (
                <div className="relative">
                    <div className="bg-black rounded-lg overflow-hidden" style={{ aspectRatio: '16/9' }}>
                        <CameraPreview
                            camera={camera}
                            onCapture={handlePhotoCapture}
                            onClose={handleCameraClose}
                            captureOptions={{ quality: cameraQuality }}
                            className="w-full h-full"
                            showControls={true}
                        />
                    </div>
                    <button
                        type="button"
                        className="absolute top-2 right-2 btn btn-circle btn-sm btn-ghost text-white hover:bg-white/20"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            toggleFullscreenCamera();
                        }}
                        title="Fullscreen camera"
                    >
                        <i className="fas fa-expand"></i>
                    </button>
                </div>
            )}

            {/* Fullscreen Camera Modal */}
            {showFullscreenCamera && cameraMode && camera.isActive && (
                <div className="fixed inset-0 z-50">
                    <CameraPreview
                        camera={camera}
                        onCapture={handlePhotoCapture}
                        onClose={handleCameraClose}
                        captureOptions={{ quality: cameraQuality }}
                        fullscreen={true}
                        showControls={true}
                    />
                </div>
            )}

            {/* Upload Zone */}
            {(!cameraMode || !camera.isActive) && (
                <div
                    className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${dragActive
                        ? 'border-primary bg-primary/10'
                        : files.length > 0
                            ? 'border-success bg-success/5'
                            : 'border-base-300 hover:border-primary/50'
                        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${compact ? 'p-4' : ''} ${enableCamera ? 'opacity-75' : ''}`}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => !disabled && fileInputRef.current?.click()}
                >
                    <div className="flex flex-col items-center gap-2">
                        <i className={`far fa-cloud-upload text-3xl text-base-content/50 ${compact ? 'text-xl' : ''}`}></i>
                        <p className="font-medium">
                            {dragActive ? 'Drop files here' : enableCamera ? 'Or drag & drop files' : 'Drag & drop files or click to browse'}
                        </p>
                        <p className="text-xs text-base-content/60">
                            {acceptedTypes.join(', ')} • Max {(maxFileSize / 1024 / 1024).toFixed(0)}MB
                            {multiple && ` • Up to ${maxFiles} files`}
                        </p>
                    </div>

                    <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        multiple={multiple}
                        accept={acceptedTypes.join(',')}
                        onChange={handleFileInputChange}
                        disabled={disabled}
                    />
                </div>
            )}

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">
                            Files ({files.length})
                        </span>
                        {files.some(f => f.status === "pending") && (
                            <button
                                type="button"
                                className="btn btn-primary btn-sm"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    uploadFiles();
                                }}
                                disabled={isUploading || disabled}
                            >
                                {isUploading ? (
                                    <>
                                        <span className="loading loading-spinner loading-sm"></span>
                                        Uploading...
                                    </>
                                ) : (
                                    <>
                                        <i className="far fa-upload"></i>
                                        Upload All
                                    </>
                                )}
                            </button>
                        )}
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto">
                        {files.map((mediaFile) => (
                            <div key={mediaFile.id} className="flex items-center gap-3 p-3 bg-base-200 rounded-lg">
                                {/* File Icon/Preview */}
                                <div className="flex-shrink-0">
                                    {showPreview && mediaFile.preview ? (
                                        <img
                                            src={mediaFile.preview}
                                            alt="Preview"
                                            className="w-10 h-10 object-cover rounded"
                                        />
                                    ) : (
                                        <i className={`${getFileIcon(mediaFile.file)} text-2xl`}></i>
                                    )}
                                </div>

                                {/* File Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{mediaFile.file.name}</p>
                                    <p className="text-xs text-base-content/60">
                                        {formatFileSize(mediaFile.file.size)}
                                    </p>

                                    {/* Progress Bar */}
                                    {mediaFile.status === "uploading" && (
                                        <div className="w-full bg-base-300 rounded-full h-1.5 mt-1">
                                            <div
                                                className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                                style={{ width: `${mediaFile.progress}%` }}
                                            ></div>
                                        </div>
                                    )}

                                    {/* Error Message */}
                                    {mediaFile.error && (
                                        <p className="text-error text-xs mt-1">{mediaFile.error}</p>
                                    )}
                                </div>

                                {/* Status & Actions */}
                                <div className="flex items-center gap-2">
                                    {mediaFile.status === "pending" && (
                                        <span className="badge badge-ghost badge-sm">Pending</span>
                                    )}
                                    {mediaFile.status === "uploading" && (
                                        <span className="badge badge-primary badge-sm">
                                            {mediaFile.progress}%
                                        </span>
                                    )}
                                    {mediaFile.status === "completed" && (
                                        <span className="badge badge-success badge-sm">
                                            <i className="far fa-check mr-1"></i>Done
                                        </span>
                                    )}
                                    {mediaFile.status === "error" && (
                                        <span className="badge badge-error badge-sm">
                                            <i className="far fa-exclamation-triangle mr-1"></i>Error
                                        </span>
                                    )}

                                    {(mediaFile.status === "pending" || mediaFile.status === "error") && !isUploading && (
                                        <button
                                            type="button"
                                            className="btn btn-ghost btn-xs btn-circle"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                removeFile(mediaFile.id);
                                            }}
                                            disabled={disabled}
                                        >
                                            <i className="far fa-times"></i>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default UniversalMediaUploader;
