"use client"

import { useState, useEffect } from "react"
import { getMedias, searchMedias, deleteMedia } from "@/app/actions/media"
import { getProjects } from "@/app/actions/projects"
import { Media } from "@/types/media"
import { Project } from "@/types/projects"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { useBusiness } from "@/lib/business-context"

// Media types for filtering
const mediaTypes = [
    { id: "image", name: "Images" },
    { id: "video", name: "Videos" },
    { id: "document", name: "Documents" },
    { id: "audio", name: "Audio" },
]

export default function MediaLibrary() {
    const { businessId } = useBusiness();
    const [view, setView] = useState<"grid" | "list">("grid");
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedProject, setSelectedProject] = useState<string | null>(null);
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [mediaItems, setMediaItems] = useState<Media[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);

    // Load data on component mount
    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [mediaData, projectsData] = await Promise.all([
                getMedias(businessId),
                getProjects(businessId)
            ])
            setMediaItems(mediaData)
            setProjects(projectsData)
        } catch (error) {
            console.error("Error loading media data:", error)
            toast.error({
                title: "Error",
                description: "Failed to load media library",
            })
        } finally {
            setLoading(false)
        }
    }

    // Handle search
    useEffect(() => {
        const handleSearch = async () => {
            if (searchQuery.trim()) {
                try {
                    const results = await searchMedias(businessId, searchQuery)
                    setMediaItems(results)
                } catch (error) {
                    console.error("Error searching media:", error)
                }
            } else {
                loadData()
            }
        }

        const debounceTimer = setTimeout(handleSearch, 300)
        return () => clearTimeout(debounceTimer)
    }, [searchQuery])

    // Filter media items based on project and type
    const filteredMedia = mediaItems.filter((item) => {
        const matchesProject = selectedProject === null || item.project_id === selectedProject
        const matchesType = selectedType === null || item.type === selectedType
        return matchesProject && matchesType
    })

    // Toggle selection of an item
    const toggleSelection = (id: string) => {
        if (selectedItems.includes(id)) {
            setSelectedItems(selectedItems.filter((itemId) => itemId !== id))
        } else {
            setSelectedItems([...selectedItems, id])
        }
    }

    // Handle bulk delete
    const handleBulkDelete = async () => {
        if (selectedItems.length === 0) return

        if (confirm(`Are you sure you want to delete ${selectedItems.length} item(s)?`)) {
            try {
                await Promise.all(selectedItems.map(id => deleteMedia(businessId, id)))
                setSelectedItems([])
                await loadData()
                toast.success({
                    title: "Success",
                    description: `${selectedItems.length} item(s) deleted successfully`
                })
            } catch (error) {
                console.error("Error deleting media:", error)
                toast.error({
                    title: "Error",
                    description: "Failed to delete media items",
                })
            }
        }
    }

    // Handle single item delete
    const handleSingleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this item?")) {
            try {
                await deleteMedia(businessId, id)
                await loadData()
                toast.success({
                    title: "Success",
                    description: "Media item deleted successfully"
                })
            } catch (error) {
                console.error("Error deleting media:", error)
                toast.error({
                    title: "Error",
                    description: "Failed to delete media item",
                })
            }
        }
    }

    // Format date for display
    const formatDate = (dateString: string | null) => {
        if (!dateString) return "Unknown"
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        })
    }

    // Get icon for file type
    const getFileIcon = (type: string) => {
        switch (type) {
            case "image":
                return <i className="far fa-image text-accent"></i>
            case "video":
                return <i className="far fa-video text-primary"></i>
            case "document":
                return <i className="far fa-file-alt text-secondary"></i>
            case "audio":
                return <i className="far fa-volume-up text-info"></i>
            default:
                return <i className="far fa-file text-base-content"></i>
        }
    }

    // Get project name by ID
    const getProjectName = (projectId: string | null) => {
        if (!projectId) return "No Project"
        const project = projects.find(p => p.id === projectId)
        return project?.name || "Unknown Project"
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="loading loading-spinner loading-lg"></div>
            </div>
        )
    }

    return (
        <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-6">
                <h1 className="text-2xl font-bold">Media Library</h1>
                <div className="flex gap-2">
                    <Link href="/dashboard/media/upload" className="btn btn-primary">
                        <i className="far fa-upload mr-2"></i> Upload
                    </Link>
                    {selectedItems.length > 0 && (
                        <div className="dropdown dropdown-end">
                            <div tabIndex={0} role="button" className="btn">
                                Actions <i className="far fa-chevron-down ml-2"></i>
                            </div>
                            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                                <li>
                                    <button onClick={handleBulkDelete} className="text-error">
                                        Delete Selected
                                    </button>
                                </li>
                            </ul>
                        </div>
                    )}
                </div>
            </div>

            {/* Filters and search */}
            <div className="bg-base-100 p-4 rounded-lg shadow-sm mb-6">
                <div className="flex flex-col md:flex-row gap-6">

                    <label className="input input-bordered input-secondary flex items-center gap-2 w-full">
                        <i className="far fa-search"></i>
                        <input
                            type="text"
                            placeholder="Search projects..."
                            className="input input-bordered w-full"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </label>

                    <div className="flex gap-6">
                        <select
                            className="select select-bordered select-secondary w-full max-w-xs"
                            value={selectedProject || ""}
                            onChange={(e) => setSelectedProject(e.target.value || null)}
                        >
                            <option value="">All Projects</option>
                            {projects.map((project) => (
                                <option key={project.id} value={project.id}>
                                    {project.name}
                                </option>
                            ))}
                        </select>

                        <select
                            className="select select-bordered select-secondary w-full max-w-xs"
                            value={selectedType || ""}
                            onChange={(e) => setSelectedType(e.target.value || null)}
                        >
                            <option value="">All Types</option>
                            {mediaTypes.map((type) => (
                                <option key={type.id} value={type.id}>
                                    {type.name}
                                </option>
                            ))}
                        </select>
                        <div className="flex items-center gap-2">
                            <div role="tablist" className="tabs tabs-box tabs-sm flex-nowrap">
                                <button role="tab" className={`tab tab-secondary ${view === "grid" ? "tab-active text-secondary" : ""}`} onClick={() => setView("grid")}> <i className="far fa-grid-2"></i> </button>
                                <button role="tab" className={`tab ${view === "list" ? "tab-active" : ""}`} onClick={() => setView("list")}> <i className="far fa-table-rows"></i> </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Media content */}
            {view === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredMedia.map((item) => (
                        <div
                            key={item.id}
                            className={`card bg-base-100 shadow-sm hover:shadow-md transition-shadow ${selectedItems.includes(item.id) ? "ring-2 ring-primary" : ""
                                }`}
                        >
                            <figure className="relative h-40 bg-base-200">
                                {item.type === "image" ? (
                                    <img src={item.url || "/placeholder.svg"} alt={item.name ?? ""} className="object-cover w-full h-full" />
                                ) : (
                                    <div className="flex items-center justify-center w-full h-full">
                                        {item.type === "video" && <i className="far fa-play-circle text-5xl text-primary"></i>}
                                        {item.type === "document" && <i className="far fa-file-alt text-5xl text-secondary"></i>}
                                        {item.type === "audio" && <i className="far fa-volume-up text-5xl text-info"></i>}
                                    </div>
                                )}
                                <div className="absolute top-2 right-2">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-primary"
                                        checked={selectedItems.includes(item.id)}
                                        onChange={() => toggleSelection(item.id)}
                                    />
                                </div>
                            </figure>
                            <div className="card-body p-4">
                                <h3 className="card-title text-sm font-medium flex items-center">
                                    {getFileIcon(item.type || "")}
                                    <span className="ml-2 truncate">{item.name}</span>
                                </h3>
                                <div className="text-xs text-base-content/70">
                                    <p>{getProjectName(item.project_id)}</p>
                                    <p>Uploaded {formatDate(item.created_at)}</p>
                                    <p>{item.size || "Unknown size"}</p>
                                </div>
                                <div className="card-actions justify-end mt-2">
                                    <div className="dropdown dropdown-end">
                                        <div tabIndex={0} role="button" className="btn btn-sm btn-ghost btn-circle">
                                            <i className="far fa-ellipsis-v"></i>
                                        </div>
                                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                                            <li>
                                                <Link href={`/dashboard/media/${item.id}`}>Preview</Link>
                                            </li>
                                            <li>
                                                <a href={item.url} download target="_blank" rel="noopener noreferrer">Download</a>
                                            </li>
                                            <li>
                                                <button onClick={() => handleSingleDelete(item.id)} className="text-error">
                                                    Delete
                                                </button>
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th className="w-8">
                                    <input
                                        type="checkbox"
                                        className="checkbox checkbox-sm"
                                        checked={selectedItems.length === filteredMedia.length && filteredMedia.length > 0}
                                        onChange={() => {
                                            if (selectedItems.length === filteredMedia.length) {
                                                setSelectedItems([])
                                            } else {
                                                setSelectedItems(filteredMedia.map((item) => item.id))
                                            }
                                        }}
                                    />
                                </th>
                                <th>Name</th>
                                <th>Project</th>
                                <th>Size</th>
                                <th>Date</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredMedia.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            className="checkbox checkbox-sm"
                                            checked={selectedItems.includes(item.id)}
                                            onChange={() => toggleSelection(item.id)}
                                        />
                                    </td>
                                    <td>
                                        <div className="flex items-center space-x-6">
                                            <div className="flex-shrink-0">{getFileIcon(item.type ?? "")}</div>
                                            <div>
                                                <div className="font-medium">{item.name}</div>
                                                <div className="text-xs opacity-50">{item.description}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>{getProjectName(item.project_id)}</td>
                                    <td>{item.size || "Unknown"}</td>
                                    <td>{formatDate(item.created_at)}</td>
                                    <td>
                                        <div className="dropdown dropdown-end">
                                            <div tabIndex={0} role="button" className="btn btn-sm btn-ghost btn-circle">
                                                <i className="far fa-ellipsis-v"></i>
                                            </div>
                                            <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                                                <li>
                                                    <Link href={`/dashboard/media/${item.id}`}>Preview</Link>
                                                </li>
                                                <li>
                                                    <a href={item.url} download target="_blank" rel="noopener noreferrer">Download</a>
                                                </li>
                                                <li>
                                                    <button onClick={() => handleSingleDelete(item.id)} className="text-error">
                                                        Delete
                                                    </button>
                                                </li>
                                            </ul>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {filteredMedia.length === 0 && !loading && (
                <div className="text-center py-12">
                    <i className="far fa-file text-4xl text-base-content/30 mb-4"></i>
                    <p className="text-base-content/70">No media files found</p>
                    <Link href="/dashboard/media/upload" className="btn btn-primary mt-4">
                        Upload First File
                    </Link>
                </div>
            )}
        </div>
    )
}