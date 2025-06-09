
"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { generateUploadUrl, createMedia } from "@/app/actions/media"
import { getProjects } from "@/app/actions/projects"
import { Project } from "@/types/projects"
import { MediaInsert, MediaType } from "@/types/media"
import { toast } from "@/hooks/use-toast"

interface FileUpload {
    file: File
    id: string
    progress: number
    status: "pending" | "uploading" | "completed" | "error"
    url?: string
    uploadUrl?: string
    fileName?: string
}

export default function MediaUpload() {
    const router = useRouter()
    const [files, setFiles] = useState<FileUpload[]>([])
    const [projects, setProjects] = useState<Project[]>([])
    const [selectedProject, setSelectedProject] = useState("")
    const [uploading, setUploading] = useState(false)
    const [dragActive, setDragActive] = useState(false)

    useEffect(() => {
        loadProjects()
    }, [])

    const loadProjects = async () => {
        try {
            const projectsData = await getProjects()
            setProjects(projectsData)
        } catch (error) {
            console.error("Error loading projects:", error)
        }
    }

    // Determine media type from file
    const getMediaTypeFromFile = (file: File): MediaType => {
        const mimeType = file.type
        if (mimeType.startsWith("images/")) return "images"
        if (mimeType.startsWith("videos/")) return "videos"
        if (mimeType.startsWith("audios/")) return "audios"
        return "documents"
    }

    // Format file size
    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return "0 Bytes"
        const k = 1024
        const sizes = ["Bytes", "KB", "MB", "GB"]
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
    }

    // Handle file selection
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files).map(file => ({
                file,
                id: Math.random().toString(36).substr(2, 9),
                progress: 0,
                status: "pending" as const
            }))
            setFiles(prev => [...prev, ...newFiles])
        }
    }

    // Handle file drop
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setDragActive(false)
        if (e.dataTransfer.files) {
            const newFiles = Array.from(e.dataTransfer.files).map(file => ({
                file,
                id: Math.random().toString(36).substr(2, 9),
                progress: 0,
                status: "pending" as const
            }))
            setFiles(prev => [...prev, ...newFiles])
        }
    }

    // Handle drag events
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setDragActive(true)
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setDragActive(false)
    }

    // Remove a file from the list
    const removeFile = (id: string) => {
        setFiles(prev => prev.filter(f => f.id !== id))
    }

    // Upload a single file
    const uploadSingleFile = async (fileUpload: FileUpload): Promise<boolean> => {
        try {
            const mediaType = getMediaTypeFromFile(fileUpload.file)

            // Generate upload URL
            const uploadData = await generateUploadUrl(mediaType, fileUpload.file.name)
            if (!uploadData) {
                throw new Error("Failed to generate upload URL")
            }

            // Update file with upload URL
            setFiles(prev => prev.map(f =>
                f.id === fileUpload.id
                    ? { ...f, uploadUrl: uploadData.uploadUrl, url: uploadData.fileUrl, fileName: uploadData.fileName, status: "uploading" }
                    : f
            ))

            // Upload to Azure Blob Storage
            const xhr = new XMLHttpRequest()

            return new Promise((resolve, reject) => {
                xhr.upload.addEventListener("progress", (e) => {
                    if (e.lengthComputable) {
                        const progress = Math.round((e.loaded / e.total) * 100)
                        setFiles(prev => prev.map(f =>
                            f.id === fileUpload.id ? { ...f, progress } : f
                        ))
                    }
                })

                xhr.addEventListener("load", async () => {
                    if (xhr.status === 201) {
                        // File uploaded successfully, now create media record
                        try {
                            const mediaRecord = await createMedia({
                                name: fileUpload.file.name,
                                type: mediaType,
                                size: fileUpload.file.size,
                                url: uploadData.fileUrl,
                                project_id: selectedProject || null,
                            } as MediaInsert)

                            if (mediaRecord) {
                                setFiles(prev => prev.map(f =>
                                    f.id === fileUpload.id ? { ...f, status: "completed", progress: 100 } : f
                                ))
                                resolve(true)
                            } else {
                                throw new Error("Failed to create media record")
                            }
                        } catch (error) {
                            console.error("Error creating media record:", error)
                            setFiles(prev => prev.map(f =>
                                f.id === fileUpload.id ? { ...f, status: "error" } : f
                            ))
                            reject(error)
                        }
                    } else {
                        setFiles(prev => prev.map(f =>
                            f.id === fileUpload.id ? { ...f, status: "error" } : f
                        ))
                        reject(new Error(`Upload failed with status ${xhr.status}`))
                    }
                })

                xhr.addEventListener("error", () => {
                    setFiles(prev => prev.map(f =>
                        f.id === fileUpload.id ? { ...f, status: "error" } : f
                    ))
                    reject(new Error("Upload failed"))
                })

                xhr.open("PUT", uploadData.uploadUrl)
                xhr.setRequestHeader("x-ms-blob-type", "BlockBlob")
                xhr.send(fileUpload.file)
            })
        } catch (error) {
            console.error("Error uploading file:", error)
            setFiles(prev => prev.map(f =>
                f.id === fileUpload.id ? { ...f, status: "error" } : f
            ))
            return false
        }
    }

    // Upload all files
    const handleUpload = async () => {
        if (files.length === 0) return

        setUploading(true)

        try {
            const pendingFiles = files.filter(f => f.status === "pending")

            // Upload files sequentially to avoid overwhelming the server
            for (const file of pendingFiles) {
                await uploadSingleFile(file)
            }

            const completedCount = files.filter(f => f.status === "completed").length
            const errorCount = files.filter(f => f.status === "error").length

            if (completedCount > 0) {
                toast.success({
                    title: "Upload Complete",
                    description: `${completedCount} file(s) uploaded successfully${errorCount > 0 ? `, ${errorCount} failed` : ""}`
                })

                // Redirect to media library after successful upload
                router.push("/dashboard/media")
            } else {
                toast.error({
                    title: "Upload Failed",
                    description: "No files were uploaded successfully",
                });
            }
        } catch (error) {
            console.error("Error during upload:", error)
            toast.error({
                title: "Upload Error",
                description: "An error occurred during upload",
            })
        } finally {
            setUploading(false)
        }
    }

    // Get icon for file type
    const getFileIcon = (file: File) => {
        const type = getMediaTypeFromFile(file)
        switch (type) {
            case "images":
                return <i className="fas fa-image text-accent"></i>
            case "videos":
                return <i className="fas fa-video text-primary"></i>
            case "documents":
                return <i className="fas fa-file-alt text-secondary"></i>
            case "audios":
                return <i className="fas fa-volume-up text-info"></i>
            default:
                return <i className="fas fa-file text-base-content"></i>
        }
    }

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold">Upload Media</h1>
                <button
                    className="btn btn-ghost"
                    onClick={() => router.push("/dashboard/media")}
                >
                    <i className="fas fa-arrow-left mr-2"></i> Back to Library
                </button>
            </div>

            <div className="space-y-6">
                {/* Upload Area */}
                <div className="card bg-base-100 shadow-sm">
                    <div className="card-body">
                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${dragActive
                                ? "border-primary bg-primary/5"
                                : "border-base-300 hover:border-base-400"
                                }`}
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                        >
                            <i className="fas fa-cloud-upload-alt text-4xl text-base-content/50 mb-4"></i>
                            <p className="mb-2 text-lg">Drag and drop files here, or click to browse</p>
                            <p className="text-sm text-base-content/70 mb-4">
                                Supports images, videos, documents, and audio files
                            </p>
                            <input
                                type="file"
                                className="file-input file-input-bordered w-full max-w-xs"
                                multiple
                                onChange={handleFileChange}
                            />
                        </div>
                    </div>
                </div>

                {/* Project Selection */}
                {files.length > 0 && (
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h3 className="card-title">Upload Settings</h3>
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Project (Optional)</span>
                                </label>
                                <select
                                    className="select select-bordered w-full"
                                    value={selectedProject}
                                    onChange={(e) => setSelectedProject(e.target.value)}
                                >
                                    <option value="">No Project</option>
                                    {projects.map((project) => (
                                        <option key={project.id} value={project.id}>
                                            {project.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* File List */}
                {files.length > 0 && (
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="card-title">Files to Upload ({files.length})</h3>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleUpload}
                                    disabled={uploading || files.every(f => f.status === "completed")}
                                >
                                    {uploading ? (
                                        <>
                                            <span className="loading loading-spinner loading-sm mr-2"></span>
                                            Uploading...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-upload mr-2"></i>
                                            Upload All
                                        </>
                                    )}
                                </button>
                            </div>

                            <div className="space-y-3">
                                {files.map((fileUpload) => (
                                    <div key={fileUpload.id} className="flex items-center gap-4 p-3 border rounded-lg">
                                        <div className="flex-shrink-0">
                                            {getFileIcon(fileUpload.file)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium truncate">{fileUpload.file.name}</p>
                                            <p className="text-sm text-base-content/70">
                                                {formatFileSize(fileUpload.file.size)} • {getMediaTypeFromFile(fileUpload.file)}
                                            </p>
                                            {fileUpload.status === "uploading" && (
                                                <div className="w-full bg-base-300 rounded-full h-2 mt-2">
                                                    <div
                                                        className="bg-primary h-2 rounded-full transition-all duration-300"
                                                        style={{ width: `${fileUpload.progress}%` }}
                                                    ></div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-shrink-0 flex items-center gap-2">
                                            {fileUpload.status === "pending" && (
                                                <span className="badge badge-ghost">Pending</span>
                                            )}
                                            {fileUpload.status === "uploading" && (
                                                <span className="badge badge-primary">Uploading {fileUpload.progress}%</span>
                                            )}
                                            {fileUpload.status === "completed" && (
                                                <span className="badge badge-success">
                                                    <i className="fas fa-check mr-1"></i> Complete
                                                </span>
                                            )}
                                            {fileUpload.status === "error" && (
                                                <span className="badge badge-error">
                                                    <i className="fas fa-exclamation-triangle mr-1"></i> Error
                                                </span>
                                            )}
                                            {fileUpload.status === "pending" && (
                                                <button
                                                    className="btn btn-sm btn-ghost btn-circle"
                                                    onClick={() => removeFile(fileUpload.id)}
                                                    disabled={uploading}
                                                >
                                                    <i className="fas fa-times"></i>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
