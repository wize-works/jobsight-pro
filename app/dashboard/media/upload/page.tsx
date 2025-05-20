"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { MediaUpload } from "@/components/media-upload"

// Mock data for projects
const mockProjects = [
  { id: "1", name: "Downtown Highrise" },
  { id: "2", name: "Riverside Apartments" },
  { id: "3", name: "Mountain View Condos" },
  { id: "4", name: "Training Materials" },
  { id: "5", name: "Company Events" },
]

// Mock data for folders
const mockFolders = [
  { id: "1", name: "Project Photos" },
  { id: "2", name: "Blueprints & Plans" },
  { id: "3", name: "Safety Documents" },
  { id: "4", name: "Training Videos" },
  { id: "5", name: "Equipment Manuals" },
  { id: "6", name: "Client Approvals" },
]

export default function MediaUploadPage() {
  const [files, setFiles] = useState<File[]>([])
  const [selectedProject, setSelectedProject] = useState<string>("")
  const [selectedFolder, setSelectedFolder] = useState<string>("")
  const [tags, setTags] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [location, setLocation] = useState<string>("")
  const [isUploading, setIsUploading] = useState(false)

  const handleUpload = (uploadedFiles: File[]) => {
    setFiles(uploadedFiles)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (files.length === 0) {
      alert("Please select at least one file to upload")
      return
    }

    // In a real app, you would upload the files to your server or cloud storage
    setIsUploading(true)
    setTimeout(() => {
      setIsUploading(false)
      alert(`${files.length} files uploaded successfully!`)
      // Redirect to media library
      window.location.href = "/dashboard/media"
    }, 2000)
  }

  return (
    <div className="container mx-auto">
      <div className="text-sm breadcrumbs mb-4">
        <ul>
          <li>
            <Link href="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link href="/dashboard/media">Media Library</Link>
          </li>
          <li>Upload Files</li>
        </ul>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Upload Files</h1>
          <p className="text-base-content/70">Add new photos, videos, or documents to your media library</p>
        </div>
      </div>

      <div className="bg-base-100 rounded-box shadow-sm p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <MediaUpload onUpload={handleUpload} />
          </div>

          <div className="divider">File Information</div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="form-control">
              <label className="label">
                <span className="label-text">Project</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={selectedProject}
                onChange={(e) => setSelectedProject(e.target.value)}
              >
                <option value="">Select a project</option>
                {mockProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Folder</span>
              </label>
              <select
                className="select select-bordered w-full"
                value={selectedFolder}
                onChange={(e) => setSelectedFolder(e.target.value)}
              >
                <option value="">Select a folder</option>
                {mockFolders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Tags (comma separated)</span>
              </label>
              <input
                type="text"
                placeholder="e.g. site-photos, blueprints, safety"
                className="input input-bordered w-full"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
            </div>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Location</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 123 Main Street, Cityville"
                className="input input-bordered w-full"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
            </div>

            <div className="form-control md:col-span-2">
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                className="textarea textarea-bordered h-24"
                placeholder="Add a description for these files..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end mt-6 space-x-2">
            <Link href="/dashboard/media" className="btn btn-outline">
              Cancel
            </Link>
            <button type="submit" className="btn btn-primary" disabled={isUploading || files.length === 0}>
              {isUploading ? (
                <>
                  <span className="loading loading-spinner"></span>
                  Uploading...
                </>
              ) : (
                <>
                  <i className="fas fa-cloud-upload-alt mr-2"></i>
                  Upload {files.length > 0 ? `${files.length} Files` : "Files"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
