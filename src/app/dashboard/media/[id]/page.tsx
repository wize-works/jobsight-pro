"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"

// Mock data for a single media item
const mockMediaItem = {
    id: "media1",
    name: "Site Overview.jpg",
    type: "image",
    size: "2.4 MB",
    project: "Main Street Project",
    uploadedBy: "John Doe",
    uploadedAt: "2025-05-10T14:30:00",
    url: "/placeholder.svg?key=alucj",
    tags: ["site", "overview"],
    description: "Aerial view of the Main Street Project construction site showing current progress.",
    metadata: {
        dimensions: "3840 x 2160",
        device: "DJI Mavic Air 2",
        location: "123 Main St, Anytown, USA",
        coordinates: "40.7128° N, 74.0060° W",
    },
}

// Mock data for related media
const mockRelatedMedia = [
    {
        id: "media5",
        name: "Concrete Pour.jpg",
        type: "image",
        url: "/placeholder.svg?key=5lhd9",
    },
    {
        id: "media2",
        name: "Foundation Plan.pdf",
        type: "document",
        url: "/placeholder.svg?key=69yfj",
    },
    {
        id: "media3",
        name: "Equipment Inspection.mp4",
        type: "video",
        url: "/placeholder.svg?key=ku0og",
    },
]

export default function MediaDetail({ params }: { params: Promise<{ id: string }> }) {
    const [showShareModal, setShowShareModal] = useState(false)
    const [showDeleteModal, setShowDeleteModal] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editedItem, setEditedItem] = useState({ ...mockMediaItem })

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        })
    }

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

    // Handle form submission
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // In a real app, you would save the changes to the server here
        setIsEditing(false)
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <Link href="/dashboard/media" className="btn btn-ghost btn-sm">
                        <i className="fas fa-arrow-left"></i>
                    </Link>
                    <h1 className="text-2xl font-bold">{mockMediaItem.name}</h1>
                </div>
                <div className="flex gap-2">
                    <button className="btn btn-outline btn-sm" onClick={() => window.print()}>
                        <i className="fas fa-print mr-2"></i> Print
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => setShowShareModal(true)}>
                        <i className="fas fa-share-alt mr-2"></i> Share
                    </button>
                    <button className="btn btn-outline btn-sm">
                        <i className="fas fa-download mr-2"></i> Download
                    </button>
                    <div className="dropdown dropdown-end">
                        <div tabIndex={0} role="button" className="btn btn-sm">
                            <i className="fas fa-ellipsis-v"></i>
                        </div>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                            <li>
                                <a onClick={() => setIsEditing(true)}>Edit</a>
                            </li>
                            <li>
                                <a>Move</a>
                            </li>
                            <li>
                                <a>Duplicate</a>
                            </li>
                            <li>
                                <a className="text-error" onClick={() => setShowDeleteModal(true)}>
                                    Delete
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Media preview */}
                <div className="lg:col-span-2">
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="bg-base-200 rounded-lg flex items-center justify-center min-h-[400px]">
                                {mockMediaItem.type === "image" ? (
                                    <img
                                        src={mockMediaItem.url || "/placeholder.svg"}
                                        alt={mockMediaItem.name}
                                        className="max-w-full max-h-[600px] object-contain"
                                    />
                                ) : mockMediaItem.type === "video" ? (
                                    <div className="text-center">
                                        <i className="fas fa-play-circle text-6xl text-primary mb-4"></i>
                                        <p>Video preview not available</p>
                                        <button className="btn btn-primary mt-4">Play Video</button>
                                    </div>
                                ) : mockMediaItem.type === "document" ? (
                                    <div className="text-center">
                                        <i className="fas fa-file-alt text-6xl text-secondary mb-4"></i>
                                        <p>Document preview not available</p>
                                        <button className="btn btn-secondary mt-4">Open Document</button>
                                    </div>
                                ) : (
                                    <div className="text-center">
                                        <i className="fas fa-file text-6xl text-base-content/50 mb-4"></i>
                                        <p>Preview not available</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Media details */}
                <div>
                    {isEditing ? (
                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <h2 className="card-title">Edit Media</h2>
                                <form onSubmit={handleSubmit}>
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Name</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered"
                                            value={editedItem.name}
                                            onChange={(e) => setEditedItem({ ...editedItem, name: e.target.value })}
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Project</span>
                                        </label>
                                        <select
                                            className="select select-bordered"
                                            value={editedItem.project}
                                            onChange={(e) => setEditedItem({ ...editedItem, project: e.target.value })}
                                        >
                                            <option>Main Street Project</option>
                                            <option>Riverside Apartments</option>
                                            <option>Downtown Project</option>
                                            <option>Johnson Residence</option>
                                        </select>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Description</span>
                                        </label>
                                        <textarea
                                            className="textarea textarea-bordered"
                                            rows={3}
                                            value={editedItem.description}
                                            onChange={(e) => setEditedItem({ ...editedItem, description: e.target.value })}
                                        ></textarea>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">Tags</span>
                                        </label>
                                        <input
                                            type="text"
                                            className="input input-bordered"
                                            value={editedItem.tags.join(", ")}
                                            onChange={(e) =>
                                                setEditedItem({
                                                    ...editedItem,
                                                    tags: e.target.value.split(",").map((tag) => tag.trim()),
                                                })
                                            }
                                        />
                                        <label className="label">
                                            <span className="label-text-alt">Separate tags with commas</span>
                                        </label>
                                    </div>

                                    <div className="form-control mt-4">
                                        <button type="submit" className="btn btn-primary">
                                            Save Changes
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-ghost mt-2"
                                            onClick={() => {
                                                setEditedItem({ ...mockMediaItem })
                                                setIsEditing(false)
                                            }}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    ) : (
                        <div className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <h2 className="card-title">Details</h2>
                                <div className="overflow-x-auto">
                                    <table className="table">
                                        <tbody>
                                            <tr>
                                                <td className="font-medium">Type</td>
                                                <td className="flex items-center">
                                                    {getFileIcon(mockMediaItem.type)}
                                                    <span className="ml-2 capitalize">{mockMediaItem.type}</span>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="font-medium">Size</td>
                                                <td>{mockMediaItem.size}</td>
                                            </tr>
                                            <tr>
                                                <td className="font-medium">Project</td>
                                                <td>
                                                    <Link href={`/dashboard/projects/project1`} className="link link-primary">
                                                        {mockMediaItem.project}
                                                    </Link>
                                                </td>
                                            </tr>
                                            <tr>
                                                <td className="font-medium">Uploaded By</td>
                                                <td>{mockMediaItem.uploadedBy}</td>
                                            </tr>
                                            <tr>
                                                <td className="font-medium">Upload Date</td>
                                                <td>{formatDate(mockMediaItem.uploadedAt)}</td>
                                            </tr>
                                            {mockMediaItem.metadata.dimensions && (
                                                <tr>
                                                    <td className="font-medium">Dimensions</td>
                                                    <td>{mockMediaItem.metadata.dimensions}</td>
                                                </tr>
                                            )}
                                            {mockMediaItem.metadata.device && (
                                                <tr>
                                                    <td className="font-medium">Device</td>
                                                    <td>{mockMediaItem.metadata.device}</td>
                                                </tr>
                                            )}
                                            {mockMediaItem.metadata.location && (
                                                <tr>
                                                    <td className="font-medium">Location</td>
                                                    <td>{mockMediaItem.metadata.location}</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="mt-4">
                                    <h3 className="font-medium mb-2">Description</h3>
                                    <p className="text-sm">{mockMediaItem.description}</p>
                                </div>

                                <div className="mt-4">
                                    <h3 className="font-medium mb-2">Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {mockMediaItem.tags.map((tag, index) => (
                                            <span key={index} className="badge badge-outline">
                                                #{tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Related media */}
                    <div className="card bg-base-100 shadow-sm mt-6">
                        <div className="card-body">
                            <h2 className="card-title text-lg">Related Media</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {mockRelatedMedia.map((item) => (
                                    <Link
                                        href={`/dashboard/media/${item.id}`}
                                        key={item.id}
                                        className="card bg-base-200 hover:bg-base-300 transition-colors"
                                    >
                                        <figure className="h-24">
                                            {item.type === "image" ? (
                                                <img
                                                    src={item.url || "/placeholder.svg"}
                                                    alt={item.name}
                                                    className="object-cover w-full h-full"
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center w-full h-full">{getFileIcon(item.type)}</div>
                                            )}
                                        </figure>
                                        <div className="card-body p-2">
                                            <p className="text-xs truncate">{item.name}</p>
                                        </div>
                                    </Link>
                                ))}
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
                                    <span className="label-text">Share Link</span>
                                </label>
                                <div className="input-group">
                                    <input
                                        type="text"
                                        className="input input-bordered flex-1"
                                        value={`https://jobsight.app/share/media/${mockMediaItem.id}`}
                                        readOnly
                                    />
                                    <button className="btn btn-square">
                                        <i className="fas fa-copy"></i>
                                    </button>
                                </div>
                            </div>

                            <div className="form-control mt-4">
                                <label className="label">
                                    <span className="label-text">Share with Team Members</span>
                                </label>
                                <select className="select select-bordered w-full">
                                    <option disabled selected>
                                        Select team members
                                    </option>
                                    <option>John Doe</option>
                                    <option>Sarah Johnson</option>
                                    <option>Mike Wilson</option>
                                    <option>Emily Clark</option>
                                </select>
                            </div>

                            <div className="form-control mt-4">
                                <label className="label">
                                    <span className="label-text">Permission Level</span>
                                </label>
                                <select className="select select-bordered w-full">
                                    <option>View only</option>
                                    <option>View and comment</option>
                                    <option>Edit</option>
                                    <option>Full access</option>
                                </select>
                            </div>

                            <div className="form-control mt-4">
                                <label className="label cursor-pointer justify-start gap-2">
                                    <input type="checkbox" className="checkbox checkbox-sm" />
                                    <span className="label-text">Allow download</span>
                                </label>
                            </div>

                            <div className="divider">Or share via</div>

                            <div className="flex justify-center gap-4">
                                <button className="btn btn-circle btn-outline">
                                    <i className="fab fa-facebook-f"></i>
                                </button>
                                <button className="btn btn-circle btn-outline">
                                    <i className="fab fa-twitter"></i>
                                </button>
                                <button className="btn btn-circle btn-outline">
                                    <i className="fab fa-linkedin-in"></i>
                                </button>
                                <button className="btn btn-circle btn-outline">
                                    <i className="fas fa-envelope"></i>
                                </button>
                            </div>
                        </div>
                        <div className="modal-action">
                            <button className="btn" onClick={() => setShowShareModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-primary">Share</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="modal modal-open">
                    <div className="modal-box">
                        <h3 className="font-bold text-lg">Delete Media</h3>
                        <p className="py-4">
                            Are you sure you want to delete "{mockMediaItem.name}"? This action cannot be undone.
                        </p>
                        <div className="modal-action">
                            <button className="btn" onClick={() => setShowDeleteModal(false)}>
                                Cancel
                            </button>
                            <button className="btn btn-error">Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
