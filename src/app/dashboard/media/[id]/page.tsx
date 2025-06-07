"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { getMediaById, deleteMedia, updateMedia } from "@/app/actions/media"
import { getProjects } from "@/app/actions/projects"
import { Media } from "@/types/media"
import { Project } from "@/types/projects"
import { toast } from "@/hooks/use-toast"

export default function MediaDetail() {
    const params = useParams()
    const router = useRouter()
    const mediaId = params.id as string

    const [mediaItem, setMediaItem] = useState<Media | null>(null)
    const [projects, setProjects] = useState<Project[]>([])
    const [loading, setLoading] = useState(true)
    const [showShareModal, setShowShareModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editedItem, setEditedItem] = useState<Partial<Media>>({})

    useEffect(() => {
        loadData()
    }, [mediaId])

    const loadData = async () => {
        try {
            setLoading(true)
            const [media, projectsData] = await Promise.all([
                getMediaById(mediaId),
                getProjects()
            ])

            if (!media) {
                toast({
                    title: "Error",
                    description: "Media item not found",
                    variant: "destructive"
                })
                router.push("/dashboard/media")
                return
            }

            setMediaItem(media)
            setEditedItem(media)
            setProjects(projectsData)
        } catch (error) {
            console.error("Error loading media:", error)
            toast({
                title: "Error",
                description: "Failed to load media item",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!mediaItem) return

        try {
            const updated = await updateMedia(mediaItem.id, {
                name: editedItem.name || mediaItem.name,
                description: editedItem.description,
                project_id: editedItem.project_id
            })

            if (updated) {
                setMediaItem(updated)
                setIsEditing(false)
                toast({
                    title: "Success",
                    description: "Media item updated successfully"
                })
            }
        } catch (error) {
            console.error("Error updating media:", error)
            toast({
                title: "Error",
                description: "Failed to update media item",
                variant: "destructive"
            })
        }
    }

    const handleDelete = async () => {
        if (!mediaItem) return

        try {
            const success = await deleteMedia(mediaItem.id)
            if (success) {
                toast({
                    title: "Success",
                    description: "Media item deleted successfully"
                })
                router.push("/dashboard/media")
            }
        } catch (error) {
            console.error("Error deleting media:", error)
            toast({
                title: "Error",
                description: "Failed to delete media item",
                variant: "destructive"
            })
        }
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Unknown"
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

    const getProjectName = (projectId: string | null) => {
        if (!projectId) return "No Project"
        const project = projects.find(p => p.id === projectId)
        return project?.name || "Unknown Project"
    }

    const getFileIcon = (type: string) => {
        switch (type) {
            case "image":
                return <i className="fas fa-image text-accent"></i>
            case "video":
                return <i className="fas fa-video text-primary"></i>
            case "document":
                return <i className="fas fa-file-alt text-secondary"></i>
            case "audio":
                return <i className="fas fa-volume-up text-info"></i>
            default:
                return <i className="fas fa-file text-base-content"></i>
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        )
    }

    if (!mediaItem) {
        return (
            <div className="text-center py-12">
                <i className="fas fa-exclamation-triangle text-4xl text-warning mb-4"></i>
                <p className="text-lg">Media item not found</p>
                <Link href="/dashboard/media" className="btn btn-primary mt-4">
                    Back to Media Library
                </Link>
            </div>
        )
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/media" className="btn btn-ghost btn-circle">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                    <div className="flex items-center gap-3">
                        {getFileIcon(mediaItem.type)}
                        {isEditing ? (
                            <input
                                type="text"
                                value={editedItem.name || ""}
                                onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
                                className="input input-bordered text-2xl font-bold"
                            />
                        ) : (
                            <h1 className="text-2xl font-bold">{mediaItem.name}</h1>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    {isEditing ? (
                        <>
                            <button className="btn btn-ghost" onClick={() => {
                                setIsEditing(false)
                                setEditedItem(mediaItem)
                            }}>
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleSave}>
                                Save
                            </button>
                        </>
                    ) : (
                        <>
                            <button className="btn btn-ghost" onClick={() => setIsEditing(true)}>
                                <i className="fas fa-edit mr-2"></i> Edit
                            </button>
                            <a
                                href={mediaItem.url}
                                download
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn btn-ghost"
                            >
                                <i className="fas fa-download mr-2"></i> Download
                            </a>
                            <button className="btn btn-ghost" onClick={() => setShowShareModal(true)}>
                                <i className="fas fa-share mr-2"></i> Share
                            </button>
                            <button className="btn btn-error" onClick={() => setShowDeleteModal(true)}>
                                <i className="fas fa-trash mr-2"></i> Delete
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Media preview */}
                <div className="lg:col-span-2">
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="bg-base-200 rounded-lg flex items-center justify-center min-h-[400px]">
                                {mediaItem.type === "image" ? (
                                    <img
                                        src={mediaItem.url || "/placeholder.svg"}
                                        alt={mediaItem.name}
                                        className="max-w-full max-h-[600px] object-contain"
                                    />
                                ) : mediaItem.type === "video" ? (
                                    <div className="text-center">
                                        <i className="fas fa-play-circle text-6xl text-primary mb-4"></i>
                                        <p>Video preview not available</p>
                                        <a href={mediaItem.url} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-4">
                                            Open Video
                                        </a>
                                    </div>
                                ) : mediaItem.type === "document" ? (
                                    <div className="text-center">
                                        <i className="fas fa-file-alt text-6xl text-secondary mb-4"></i>
                                        <p>Document preview not available</p>
                                        <a href={mediaItem.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary mt-4">
                                            Open Document
                                        </a>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <i className="fas fa-volume-up text-6xl text-info mb-4"></i>
                                        <p>Audio preview not available</p>
                                        <a href={mediaItem.url} target="_blank" rel="noopener noreferrer" className="btn btn-info mt-4">
                                            Play Audio
                                        </a>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Media details */}
                <div>
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <h3 className="card-title text-lg mb-4">Details</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-base-content/70">Description</label>
                                    {isEditing ? (
                                        <textarea
                                            value={editedItem.description || ""}
                                            onChange={(e) => setEditedItem({ ...editedItem, description: e.target.value })}
                                            className="textarea textarea-bordered w-full mt-1"
                                            rows={3}
                                        />
                                    ) : (
                                        <p className="mt-1">{mediaItem.description || "No description"}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-base-content/70">Project</label>
                                    {isEditing ? (
                                        <select
                                            value={editedItem.project_id || ""}
                                            onChange={(e) => setEditedItem({ ...editedItem, project_id: e.target.value || null })}
                                            className="select select-bordered w-full mt-1"
                                        >
                                            <option value="">No Project</option>
                                            {projects.map((project) => (
                                                <option key={project.id} value={project.id}>
                                                    {project.name}
                                                </option>
                                            ))}
                                        </select>
                                    ) : (
                                        <p className="mt-1">{getProjectName(mediaItem.project_id)}</p>
                                    )}
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-base-content/70">Type</label>
                                    <p className="mt-1 capitalize">{mediaItem.type}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-base-content/70">Size</label>
                                    <p className="mt-1">{mediaItem.size || "Unknown"}</p>
                                </div>

                                <div>
                                    <label className="text-sm font-medium text-base-content/70">Uploaded</label>
                                    <p className="mt-1">{formatDate(mediaItem.created_at)}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Share Modal */}
            {showShareModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">Share Media</h3>
                        <div className="py-4">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">Share URL</span>
                                </label>
                                <div className="join">
                                    <input
                                        type="text"
                                        value={mediaItem.url}
                                        readOnly
                                        className="input input-bordered join-item flex-1"
                                    />
                                    <button
                                        className="btn btn-primary join-item"
                                        onClick={() => {
                                            navigator.clipboard.writeText(mediaItem.url || "")
                                            toast({
                                                title: "Copied",
                                                description: "URL copied to clipboard"
                                            })
                                        }}
                                    >
                                        Copy
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="modal-action">
                            <button className="btn" onClick={() => setShowShareModal(false)}>
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Modal */}
            {showDeleteModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">Delete Media</h3>
                        <p className="py-4">
                            Are you sure you want to delete "{mediaItem.name}"? This action cannot be undone.
                        </p>
                        <div className="modal-action">
                            <button className="btn" onClick={() => setShowDeleteModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-error" onClick={handleDelete}>
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}