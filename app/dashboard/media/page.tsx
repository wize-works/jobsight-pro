"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

// Mock data for media items
const mockMediaItems = [
  {
    id: "1",
    type: "image",
    name: "Site Survey Photo 1",
    url: "/placeholder-miyu3.png",
    size: "2.4 MB",
    dimensions: "1920x1080",
    createdAt: "2023-05-15",
    project: "Downtown Highrise",
    tags: ["survey", "site-photos"],
    uploadedBy: "John Doe",
  },
  {
    id: "2",
    type: "image",
    name: "Equipment Installation",
    url: "/placeholder-kpzye.png",
    size: "1.8 MB",
    dimensions: "1920x1080",
    createdAt: "2023-05-16",
    project: "Downtown Highrise",
    tags: ["equipment", "installation"],
    uploadedBy: "Jane Smith",
  },
  {
    id: "3",
    type: "document",
    name: "Safety Inspection Report",
    url: "/placeholder.svg",
    size: "1.2 MB",
    format: "PDF",
    createdAt: "2023-05-17",
    project: "Riverside Apartments",
    tags: ["safety", "reports"],
    uploadedBy: "Mike Johnson",
  },
  {
    id: "4",
    type: "image",
    name: "Foundation Work",
    url: "/placeholder-xf0jv.png",
    size: "3.1 MB",
    dimensions: "2048x1536",
    createdAt: "2023-05-18",
    project: "Riverside Apartments",
    tags: ["foundation", "construction"],
    uploadedBy: "Sarah Williams",
  },
  {
    id: "5",
    type: "video",
    name: "Crane Operation Training",
    url: "/placeholder.svg",
    size: "24.6 MB",
    duration: "3:45",
    createdAt: "2023-05-19",
    project: "Training Materials",
    tags: ["training", "equipment", "safety"],
    uploadedBy: "Robert Brown",
  },
  {
    id: "6",
    type: "document",
    name: "Project Blueprint",
    url: "/placeholder.svg",
    size: "5.8 MB",
    format: "PDF",
    createdAt: "2023-05-20",
    project: "Mountain View Condos",
    tags: ["blueprints", "plans"],
    uploadedBy: "Emily Davis",
  },
  {
    id: "7",
    type: "image",
    name: "Electrical Installation",
    url: "/placeholder-i2g3x.png",
    size: "2.9 MB",
    dimensions: "1920x1080",
    createdAt: "2023-05-21",
    project: "Mountain View Condos",
    tags: ["electrical", "installation"],
    uploadedBy: "David Wilson",
  },
  {
    id: "8",
    type: "image",
    name: "Team Meeting",
    url: "/placeholder-mge0c.png",
    size: "1.7 MB",
    dimensions: "1920x1080",
    createdAt: "2023-05-22",
    project: "Company Events",
    tags: ["team", "meetings"],
    uploadedBy: "Lisa Anderson",
  },
]

// Mock data for folders
const mockFolders = [
  { id: "1", name: "Project Photos", count: 45 },
  { id: "2", name: "Blueprints & Plans", count: 12 },
  { id: "3", name: "Safety Documents", count: 8 },
  { id: "4", name: "Training Videos", count: 5 },
  { id: "5", name: "Equipment Manuals", count: 17 },
  { id: "6", name: "Client Approvals", count: 9 },
]

// Mock data for projects
const mockProjects = [
  { id: "1", name: "Downtown Highrise" },
  { id: "2", name: "Riverside Apartments" },
  { id: "3", name: "Mountain View Condos" },
  { id: "4", name: "Training Materials" },
  { id: "5", name: "Company Events" },
]

export default function MediaLibraryPage() {
  const [view, setView] = useState<"grid" | "list">("grid")
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedType, setSelectedType] = useState<string | null>(null)

  // Filter media items based on selected filters
  const filteredMedia = mockMediaItems.filter((item) => {
    // Filter by folder (not implemented in mock data, just for UI demonstration)
    if (selectedFolder) {
      // In a real app, you would check if the item belongs to the selected folder
      // For now, we'll just return true to show all items
    }

    // Filter by project
    if (selectedProject && item.project !== selectedProject) {
      return false
    }

    // Filter by type
    if (selectedType && item.type !== selectedType) {
      return false
    }

    // Filter by search query
    if (
      searchQuery &&
      !item.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    ) {
      return false
    }

    return true
  })

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Media Library</h1>
          <p className="text-base-content/70">Manage your photos, videos, and documents</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button className="btn btn-primary">
            <i className="fas fa-upload mr-2"></i>
            Upload Files
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar with filters */}
        <div className="lg:col-span-1">
          <div className="bg-base-100 rounded-box shadow-sm p-4">
            <div className="form-control mb-4">
              <div className="input-group">
                <input
                  type="text"
                  placeholder="Search media..."
                  className="input input-bordered w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button className="btn btn-square">
                  <i className="fas fa-search"></i>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium mb-2">View</h3>
              <div className="btn-group">
                <button className={`btn btn-sm ${view === "grid" ? "btn-active" : ""}`} onClick={() => setView("grid")}>
                  <i className="fas fa-th-large"></i>
                </button>
                <button className={`btn btn-sm ${view === "list" ? "btn-active" : ""}`} onClick={() => setView("list")}>
                  <i className="fas fa-list"></i>
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium mb-2">Type</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  className={`btn btn-sm ${selectedType === null ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setSelectedType(null)}
                >
                  All
                </button>
                <button
                  className={`btn btn-sm ${selectedType === "image" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setSelectedType("image")}
                >
                  <i className="fas fa-image mr-1"></i> Images
                </button>
                <button
                  className={`btn btn-sm ${selectedType === "video" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setSelectedType("video")}
                >
                  <i className="fas fa-video mr-1"></i> Videos
                </button>
                <button
                  className={`btn btn-sm ${selectedType === "document" ? "btn-primary" : "btn-outline"}`}
                  onClick={() => setSelectedType("document")}
                >
                  <i className="fas fa-file mr-1"></i> Documents
                </button>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-medium mb-2">Folders</h3>
              <ul className="menu bg-base-100 rounded-box p-0">
                {mockFolders.map((folder) => (
                  <li key={folder.id}>
                    <button
                      className={selectedFolder === folder.id ? "active" : ""}
                      onClick={() => setSelectedFolder(folder.id === selectedFolder ? null : folder.id)}
                    >
                      <i className="fas fa-folder text-warning"></i>
                      <span>{folder.name}</span>
                      <span className="badge badge-sm">{folder.count}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div className="mb-6">
              <h3 className="font-medium mb-2">Projects</h3>
              <ul className="menu bg-base-100 rounded-box p-0">
                <li>
                  <button className={selectedProject === null ? "active" : ""} onClick={() => setSelectedProject(null)}>
                    <i className="fas fa-project-diagram"></i>
                    <span>All Projects</span>
                  </button>
                </li>
                {mockProjects.map((project) => (
                  <li key={project.id}>
                    <button
                      className={selectedProject === project.name ? "active" : ""}
                      onClick={() => setSelectedProject(project.name === selectedProject ? null : project.name)}
                    >
                      <i className="fas fa-project-diagram"></i>
                      <span>{project.name}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-medium mb-2">Storage</h3>
              <div className="w-full bg-base-200 rounded-full h-2.5">
                <div className="bg-primary h-2.5 rounded-full" style={{ width: "45%" }}></div>
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span>45% used</span>
                <span>4.5 GB / 10 GB</span>
              </div>
              <button className="btn btn-sm btn-outline btn-block mt-2">Upgrade Storage</button>
            </div>
          </div>
        </div>

        {/* Main content area */}
        <div className="lg:col-span-3">
          <div className="bg-base-100 rounded-box shadow-sm p-4">
            {/* Breadcrumb navigation */}
            <div className="text-sm breadcrumbs mb-4">
              <ul>
                <li>
                  <Link href="/dashboard">Dashboard</Link>
                </li>
                <li>
                  <Link href="/dashboard/media">Media Library</Link>
                </li>
                {selectedFolder && (
                  <li>{mockFolders.find((folder) => folder.id === selectedFolder)?.name || "Selected Folder"}</li>
                )}
              </ul>
            </div>

            {/* Media items */}
            {filteredMedia.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <i className="fas fa-search text-4xl text-base-content/30 mb-4"></i>
                <h3 className="text-lg font-medium">No media items found</h3>
                <p className="text-base-content/70">Try adjusting your search or filters</p>
              </div>
            ) : view === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredMedia.map((item) => (
                  <Link href={`/dashboard/media/${item.id}`} key={item.id}>
                    <div className="card bg-base-200 hover:bg-base-300 transition-colors">
                      <figure className="h-40 relative">
                        {item.type === "image" ? (
                          <Image
                            src={item.url || "/placeholder.svg"}
                            alt={item.name}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : item.type === "video" ? (
                          <div className="w-full h-full flex items-center justify-center bg-base-300">
                            <i className="fas fa-play-circle text-4xl"></i>
                          </div>
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-base-300">
                            <i className="fas fa-file-alt text-4xl"></i>
                          </div>
                        )}
                        <div className="absolute top-2 right-2 badge badge-primary">{item.type}</div>
                      </figure>
                      <div className="card-body p-3">
                        <h3 className="card-title text-sm">{item.name}</h3>
                        <p className="text-xs text-base-content/70">
                          {item.project} • {item.createdAt}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Type</th>
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
                          <div className="flex items-center space-x-3">
                            <div className="avatar">
                              <div className="mask mask-squircle w-12 h-12">
                                {item.type === "image" ? (
                                  <Image src={item.url || "/placeholder.svg"} alt={item.name} width={48} height={48} />
                                ) : item.type === "video" ? (
                                  <div className="w-full h-full flex items-center justify-center bg-base-300">
                                    <i className="fas fa-play-circle"></i>
                                  </div>
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center bg-base-300">
                                    <i className="fas fa-file-alt"></i>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <div className="font-bold">{item.name}</div>
                              <div className="text-sm opacity-50">{item.tags.map((tag) => `#${tag}`).join(", ")}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge-outline">
                            {item.type === "image" && <i className="fas fa-image mr-1"></i>}
                            {item.type === "video" && <i className="fas fa-video mr-1"></i>}
                            {item.type === "document" && <i className="fas fa-file mr-1"></i>}
                            {item.type}
                          </span>
                        </td>
                        <td>{item.project}</td>
                        <td>{item.size}</td>
                        <td>{item.createdAt}</td>
                        <td>
                          <div className="flex space-x-1">
                            <Link href={`/dashboard/media/${item.id}`} className="btn btn-xs btn-ghost">
                              <i className="fas fa-eye"></i>
                            </Link>
                            <button className="btn btn-xs btn-ghost">
                              <i className="fas fa-download"></i>
                            </button>
                            <div className="dropdown dropdown-end">
                              <div tabIndex={0} role="button" className="btn btn-xs btn-ghost">
                                <i className="fas fa-ellipsis-v"></i>
                              </div>
                              <ul
                                tabIndex={0}
                                className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                              >
                                <li>
                                  <a>
                                    <i className="fas fa-edit"></i> Rename
                                  </a>
                                </li>
                                <li>
                                  <a>
                                    <i className="fas fa-share"></i> Share
                                  </a>
                                </li>
                                <li>
                                  <a>
                                    <i className="fas fa-folder-plus"></i> Move
                                  </a>
                                </li>
                                <li>
                                  <a className="text-error">
                                    <i className="fas fa-trash"></i> Delete
                                  </a>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-base-content/70">
                Showing <span className="font-medium">{filteredMedia.length}</span> of{" "}
                <span className="font-medium">{mockMediaItems.length}</span> items
              </div>
              <div className="join">
                <button className="join-item btn btn-sm">«</button>
                <button className="join-item btn btn-sm btn-active">1</button>
                <button className="join-item btn btn-sm">2</button>
                <button className="join-item btn btn-sm">3</button>
                <button className="join-item btn btn-sm">»</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
