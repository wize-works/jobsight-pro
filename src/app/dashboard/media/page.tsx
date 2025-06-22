"use client"

import { useState, useEffect } from "react"
import { getMedias, searchMedias, deleteMedia } from "@/app/actions/media"
import { getProjects } from "@/app/actions/projects"
import { Media } from "@/types/media"
import { Project } from "@/types/projects"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { useBusiness } from "@/lib/business-context"
import MediaLibraryLoading from "./loading"
import { MediaCard } from "./components/card"
import { formatDate } from "@/utils/formatters"

// Helper functions for table view
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

const getProjectName = (projectId: string | null, projects: Project[]) => {
    if (!projectId) return "No Project"
    const project = projects.find(p => p.id === projectId)
    return project?.name || "Unknown Project"
}

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
        if (!businessId) {
            return;
        }
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
    }, [searchQuery, businessId])

    // Filter media items based on project and type
    const filteredMedia = mediaItems.filter((item) => {
        const matchesProject = selectedProject === null || item.project_id === selectedProject
        const matchesType = selectedType === null || item.type === selectedType
        return matchesProject && matchesType
    })    // Toggle selection of an item
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
    }    // Handle single item delete
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

    if (loading) {
        return (
            <MediaLibraryLoading />
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
            </div>            {/* Media content */}
            {view === "grid" ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {filteredMedia.map((item) => (
                        <MediaCard
                            key={item.id}
                            media={item}
                            projects={projects}
                            isSelected={selectedItems.includes(item.id)}
                            onSelect={toggleSelection}
                            onDelete={handleSingleDelete}
                        />
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
                                    </td>                                    <td>{getProjectName(item.project_id, projects)}</td>
                                    <td>{item.size || "Unknown"}</td>
                                    <td>{formatDate(item.created_at || "")}</td>
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