
"use client"

import { useState, useEffect } from "react"
import { getMediaByProjectId } from "@/app/actions/media"
import { Media } from "@/types/media"
import Link from "next/link"

interface MediaTabProps {
    projectId: string
}

export default function MediaTab({ projectId }: MediaTabProps) {
    const [mediaItems, setMediaItems] = useState<Media[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedType, setSelectedType] = useState<string>("all")

    useEffect(() => {
        loadMediaItems()
    }, [projectId])

    const loadMediaItems = async () => {
        try {
            setLoading(true)
            // Get all media types for this project
            const [images, videos, documents, audio] = await Promise.all([
                getMediaByProjectId(projectId, "image"),
                getMediaByProjectId(projectId, "video"),
                getMediaByProjectId(projectId, "document"),
                getMediaByProjectId(projectId, "audio")
            ])

            const allMedia = [...images, ...videos, ...documents, ...audio]
            setMediaItems(allMedia)
        } catch (error) {
            console.error("Error loading project media:", error)
        } finally {
            setLoading(false)
        }
    }

    // Filter media by type
    const filteredMedia = selectedType === "all"
        ? mediaItems
        : mediaItems.filter(item => item.type === selectedType)

    // Get icon for file type
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

    // Format date
    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Unknown"
        return new Date(dateString).toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    if (loading) {
        return (
            <div className="flex flex-col gap-4">
                <h2 className="text-lg font-semibold">Project Media</h2>
                <div className="flex items-center justify-center py-12">
                    <div className="loading loading-spinner loading-lg"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold">Project Media</h2>
                <Link
                    href={`/dashboard/media/upload?project=${projectId}`}
                    className="btn btn-primary btn-sm"
                >
                    <i className="fas fa-upload mr-2"></i>
                    Upload Media
                </Link>
            </div>

            <p className="text-base-content/70">
                Media files associated with this project ({mediaItems.length} items)
            </p>

            {/* Filter tabs */}
            <div className="tabs tabs-boxed">
                <button
                    className={`tab ${selectedType === "all" ? "tab-active" : ""}`}
                    onClick={() => setSelectedType("all")}
                >
                    All ({mediaItems.length})
                </button>
                <button
                    className={`tab ${selectedType === "image" ? "tab-active" : ""}`}
                    onClick={() => setSelectedType("image")}
                >
                    Images ({mediaItems.filter(m => m.type === "image").length})
                </button>
                <button
                    className={`tab ${selectedType === "video" ? "tab-active" : ""}`}
                    onClick={() => setSelectedType("video")}
                >
                    Videos ({mediaItems.filter(m => m.type === "video").length})
                </button>
                <button
                    className={`tab ${selectedType === "document" ? "tab-active" : ""}`}
                    onClick={() => setSelectedType("document")}
                >
                    Documents ({mediaItems.filter(m => m.type === "document").length})
                </button>
                <button
                    className={`tab ${selectedType === "audio" ? "tab-active" : ""}`}
                    onClick={() => setSelectedType("audio")}
                >
                    Audio ({mediaItems.filter(m => m.type === "audio").length})
                </button>
            </div>

            {filteredMedia.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredMedia.map((item) => (
                        <div key={item.id} className="card bg-base-100 shadow-md hover:shadow-lg transition-shadow duration-200">
                            <figure className="relative h-32 bg-base-200">
                                {item.type === "image" ? (
                                    <img
                                        src={item.url || "/placeholder.svg"}
                                        alt={item.name ?? ""}
                                        className="object-cover w-full h-full"
                                    />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full">
                                        {getFileIcon(item.type || "")}
                                    </div>
                                )}
                            </figure>
                            <div className="card-body p-4">
                                <h3 className="card-title text-sm flex items-center">
                                    {getFileIcon(item.type ?? "")}
                                    <span className="ml-2 truncate">{item.name}</span>
                                </h3>
                                {item.description && (
                                    <p className="text-xs text-base-content/70 truncate">{item.description}</p>
                                )}
                                <div className="text-xs text-base-content/50">
                                    <p>Uploaded {formatDate(item.created_at)}</p>
                                    <p>{item.size || "Unknown size"}</p>
                                </div>
                                <div className="card-actions justify-end mt-2">
                                    <Link
                                        href={`/dashboard/media/${item.id}`}
                                        className="btn btn-primary btn-xs"
                                    >
                                        View
                                    </Link>
                                    <a
                                        href={item.url}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="btn btn-ghost btn-xs"
                                    >
                                        Download
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <i className="fas fa-file text-4xl text-base-content/30 mb-4"></i>
                    <p className="text-base-content/70 mb-4">
                        No {selectedType === "all" ? "media files" : selectedType + " files"} found for this project
                    </p>
                    <Link
                        href={`/dashboard/media/upload?project=${projectId}`}
                        className="btn btn-primary"
                    >
                        Upload First File
                    </Link>
                </div>
            )}
        </div>
    )
}
