"use client"

import { useState } from "react"

// Mock data for media items
const mockMediaItems = [
  {
    id: "media1",
    name: "Site Overview.jpg",
    type: "image",
    size: "2.4 MB",
    project: "Main Street Project",
    uploadedBy: "John Doe",
    uploadedAt: "2025-05-10T14:30:00",
    url: "/placeholder.svg?key=9yucx",
    tags: ["site", "overview"],
  },
  {
    id: "media2",
    name: "Foundation Plan.pdf",
    type: "document",
    size: "1.8 MB",
    project: "Riverside Apartments",
    uploadedBy: "Sarah Johnson",
    uploadedAt: "2025-05-09T10:15:00",
    url: "/placeholder.svg?key=5y1vc",
    tags: ["plan", "foundation"],
  },
  {
    id: "media3",
    name: "Equipment Inspection.mp4",
    type: "video",
    size: "8.7 MB",
    project: "Downtown Project",
    uploadedBy: "Mike Wilson",
    uploadedAt: "2025-05-08T16:45:00",
    url: "/placeholder.svg?key=alfgl",
    tags: ["equipment", "inspection", "video"],
  },
  {
    id: "media4",
    name: "Client Meeting Notes.docx",
    type: "document",
    size: "0.5 MB",
    project: "Johnson Residence",
    uploadedBy: "Emily Clark",
    uploadedAt: "2025-05-07T09:30:00",
    url: "/placeholder.svg?key=c321h",
    tags: ["meeting", "notes", "client"],
  },
  {
    id: "media5",
    name: "Concrete Pour.jpg",
    type: "image",
    size: "3.2 MB",
    project: "Main Street Project",
    uploadedBy: "John Doe",
    uploadedAt: "2025-05-06T11:20:00",
    url: "/placeholder.svg?key=jf0e0",
    tags: ["concrete", "pour"],
  },
  {
    id: "media6",
    name: "Safety Briefing.mp4",
    type: "video",
    size: "12.5 MB",
    project: "All Projects",
    uploadedBy: "Sarah Johnson",
    uploadedAt: "2025-05-05T08:00:00",
    url: "/placeholder.svg?key=tkegz",
    tags: ["safety", "briefing", "training"],
  },
  {
    id: "media7",
    name: "Electrical Layout.pdf",
    type: "document",
    size: "2.1 MB",
    project: "Riverside Apartments",
    uploadedBy: "Mike Wilson",
    uploadedAt: "2025-05-04T14:10:00",
    url: "/electrical-blueprint.png",
    tags: ["electrical", "layout", "plan"],
  },
  {
    id: "media8",
    name: "Progress Report.xlsx",
    type: "document",
    size: "0.8 MB",
    project: "Downtown Project",
    uploadedBy: "Emily Clark",
    uploadedAt: "2025-05-03T16:30:00",
    url: "/spreadsheet-icon.png",
    tags: ["report", "progress"],
  },
]

// Mock data for projects (for filtering)
const mockProjects = [
  { id: "project1", name: "Main Street Project" },
  { id: "project2", name: "Riverside Apartments" },
  { id: "project3", name: "Downtown Project" },
  { id: "project4", name: "Johnson Residence" },
]

// Mock data for media types (for filtering)
const mediaTypes = [
  { id: "image", name: "Images" },
  { id: "video", name: "Videos" },
  { id: "document", name: "Documents" },
  { id: "audio", name: "Audio" },
]

export default function MediaLibrary() {
  const [view, setView] = useState<"grid" | "list">("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [selectedType, setSelectedType] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<string[]>([])
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Filter media items based on search query, project, and type
  const filteredMedia = mockMediaItems.filter((item) => {
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    const matchesProject = selectedProject === null || item.project === selectedProject
    const matchesType = selectedType === null || item.type === selectedType

    return matchesSearch && matchesProject && matchesType
  })

  // Toggle selection of an item
  const toggleSelection = (id: string) => {
    if (selectedItems.includes(id)) {
      setSelectedItems(selectedItems.filter((itemId) => itemId !== id))
    } else {
      setSelectedItems([...selectedItems, id])
    }
  }

  // Format date for display
  const formatDate = (dateString: string) => {
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

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-bold">Media Library</h1>
        <div className="flex gap-2">
          <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
            <i className="fas fa-upload mr-2"></i> Upload
          </button>
          {selectedItems.length > 0 && (
            <div className="dropdown dropdown-end">
              <div tabIndex={0} role="button" className="btn">
                Actions <i className="fas fa-chevron-down ml-2"></i>
              </div>
              <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                <li>
                  <a>Download</a>
                </li>
                <li>
                  <a>Share</a>
                </li>
                <li>
                  <a>Move</a>
                </li>
                <li>
                  <a>Tag</a>
                </li>
                <li>
                  <a className="text-error">Delete</a>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Filters and search */}
      <div className="bg-base-100 p-4 rounded-lg shadow-sm mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="form-control flex-1">
            <div className="input-group">
              <input
                type="text"
                placeholder="Search files..."
                className="input input-bordered w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button className="btn btn-square">
                <i className="fas fa-search"></i>
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <select
              className="select select-bordered w-full max-w-xs"
              value={selectedProject || ""}
              onChange={(e) => setSelectedProject(e.target.value || null)}
            >
              <option value="">All Projects</option>
              {mockProjects.map((project) => (
                <option key={project.id} value={project.name}>
                  {project.name}
                </option>
              ))}
            </select>

            <select
              className="select select-bordered w-full max-w-xs"
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

            <div className="btn-group">
              <button className={`btn ${view === "grid" ? "btn-active" : ""}`} onClick={() => setView("grid")}>
                <i className="fas fa-th-large"></i>
              </button>
              <button className={`btn ${view === "list" ? "btn-active" : ""}`} onClick={() => setView("list")}>
                <i className="fas fa-list"></i>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Media content */}
      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredMedia.map((item) => (
            <div
              key={item.id}
              className={`card bg-base-100 shadow-sm hover:shadow-md transition-shadow ${
                selectedItems.includes(item.id) ? "ring-2 ring-primary" : ""
              }`}
            >
              <figure className="relative h-40 bg-base-200">
                {item.type === "image" ? (
                  <img src={item.url || "/placeholder.svg"} alt={item.name} className="object-cover w-full h-full" />
                ) : (
                  <div className="flex items-center justify-center w-full h-full">
                    {item.type === "video" && <i className="fas fa-play-circle text-5xl text-primary"></i>}
                    {item.type === "document" && <i className="fas fa-file-alt text-5xl text-secondary"></i>}
                    {item.type === "audio" && <i className="fas fa-volume-up text-5xl text-info"></i>}
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
                  {getFileIcon(item.type)}
                  <span className="ml-2 truncate">{item.name}</span>
                </h3>
                <div className="text-xs text-base-content/70">
                  <p>{item.project}</p>
                  <p>Uploaded {formatDate(item.uploadedAt)}</p>
                  <p>{item.size}</p>
                </div>
                <div className="card-actions justify-end mt-2">
                  <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-sm btn-ghost btn-circle">
                      <i className="fas fa-ellipsis-v"></i>
                    </div>
                    <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                      <li>
                        <a>Preview</a>
                      </li>
                      <li>
                        <a>Download</a>
                      </li>
                      <li>
                        <a>Share</a>
                      </li>
                      <li>
                        <a>Rename</a>
                      </li>
                      <li>
                        <a>Move</a>
                      </li>
                      <li>
                        <a>Tag</a>
                      </li>
                      <li>
                        <a className="text-error">Delete</a>
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
                <th>Uploaded By</th>
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
                    <div className="flex items-center space-x-3">
                      <div className="flex-shrink-0">{getFileIcon(item.type)}</div>
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs opacity-50">{item.tags.map((tag) => `#${tag}`).join(", ")}</div>
                      </div>
                    </div>
                  </td>
                  <td>{item.project}</td>
                  <td>{item.size}</td>
                  <td>{item.uploadedBy}</td>
                  <td>{formatDate(item.uploadedAt)}</td>
                  <td>
                    <div className="dropdown dropdown-end">
                      <div tabIndex={0} role="button" className="btn btn-sm btn-ghost btn-circle">
                        <i className="fas fa-ellipsis-v"></i>
                      </div>
                      <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                        <li>
                          <a>Preview</a>
                        </li>
                        <li>
                          <a>Download</a>
                        </li>
                        <li>
                          <a>Share</a>
                        </li>
                        <li>
                          <a>Rename</a>
                        </li>
                        <li>
                          <a>Move</a>
                        </li>
                        <li>
                          <a>Tag</a>
                        </li>
                        <li>
                          <a className="text-error">Delete</a>
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

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Upload Media</h3>
            <div className="py-4">
              <div className="border-2 border-dashed border-base-300 rounded-lg p-8 text-center">
                <i className="fas fa-cloud-upload-alt text-4xl text-base-content/50 mb-4"></i>
                <p className="mb-2">Drag and drop files here, or click to browse</p>
                <p className="text-xs text-base-content/70 mb-4">Supports images, videos, documents, and audio files</p>
                <input type="file" className="file-input file-input-bordered w-full max-w-xs" multiple />
              </div>

              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text">Project</span>
                </label>
                <select className="select select-bordered w-full">
                  <option disabled selected>
                    Select a project
                  </option>
                  {mockProjects.map((project) => (
                    <option key={project.id}>{project.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-control mt-4">
                <label className="label">
                  <span className="label-text">Tags</span>
                </label>
                <input type="text" placeholder="Add tags separated by commas" className="input input-bordered w-full" />
              </div>
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowUploadModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary">Upload</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
