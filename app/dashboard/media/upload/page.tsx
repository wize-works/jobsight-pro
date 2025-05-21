"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"

// Mock data for projects (for selection)
const mockProjects = [
  { id: "project1", name: "Main Street Project" },
  { id: "project2", name: "Riverside Apartments" },
  { id: "project3", name: "Downtown Project" },
  { id: "project4", name: "Johnson Residence" },
]

export default function MediaUpload() {
  const [files, setFiles] = useState<File[]>([])
  const [project, setProject] = useState("")
  const [tags, setTags] = useState("")
  const [description, setDescription] = useState("")
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const fileArray = Array.from(e.target.files)
      setFiles((prevFiles) => [...prevFiles, ...fileArray])
    }
  }

  // Handle file drop
  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      const fileArray = Array.from(e.dataTransfer.files)
      setFiles((prevFiles) => [...prevFiles, ...fileArray])
    }
  }

  // Prevent default behavior for drag events
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
  }

  // Remove a file from the list
  const removeFile = (index: number) => {
    const newFiles = [...files]
    newFiles.splice(index, 1)
    setFiles(newFiles)
  }

  // Format file size for display
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes"
    const k = 1024
    const sizes = ["Bytes", "KB", "MB", "GB"]
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
  }

  // Get icon for file type
  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) {
      return <i className="fas fa-image text-accent"></i>
    } else if (type.startsWith("video/")) {
      return <i className="fas fa-video text-primary"></i>
    } else if (type.startsWith("audio/")) {
      return <i className="fas fa-volume-up text-info"></i>
    } else if (type.includes("pdf")) {
      return <i className="fas fa-file-pdf text-error"></i>
    } else if (type.includes("word") || type.includes("document")) {
      return <i className="fas fa-file-word text-info"></i>
    } else if (type.includes("excel") || type.includes("sheet")) {
      return <i className="fas fa-file-excel text-success"></i>
    } else {
      return <i className="fas fa-file text-base-content"></i>
    }
  }

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (files.length === 0) {
      alert("Please select at least one file to upload")
      return
    }

    setUploading(true)

    // Simulate upload progress
    let progress = 0
    const interval = setInterval(() => {
      progress += 5
      setUploadProgress(progress)

      if (progress >= 100) {
        clearInterval(interval)
        setTimeout(() => {
          // In a real app, you would redirect to the media library after successful upload
          setUploading(false)
          alert("Files uploaded successfully!")
          // window.location.href = "/dashboard/media"
        }, 500)
      }
    }, 200)
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/media" className="btn btn-ghost btn-sm">
            <i className="fas fa-arrow-left"></i>
          </Link>
          <h1 className="text-2xl font-bold">Upload Media</h1>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            {/* Drag and drop area */}
            <div
              className="border-2 border-dashed border-base-300 rounded-lg p-8 text-center cursor-pointer hover:bg-base-200 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById("file-upload")?.click()}
            >
              <input type="file" id="file-upload" className="hidden" multiple onChange={handleFileChange} />
              <i className="fas fa-cloud-upload-alt text-4xl text-base-content/50 mb-4"></i>
              <p className="mb-2">Drag and drop files here, or click to browse</p>
              <p className="text-xs text-base-content/70">
                Supports images, videos, documents, and audio files (max 50MB per file)
              </p>
            </div>

            {/* Selected files */}
            {files.length > 0 && (
              <div className="mt-6">
                <h3 className="font-medium mb-2">Selected Files ({files.length})</h3>
                <div className="overflow-x-auto">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {files.map((file, index) => (
                        <tr key={index}>
                          <td className="flex items-center gap-2">
                            {getFileIcon(file.type)}
                            <span className="truncate max-w-xs">{file.name}</span>
                          </td>
                          <td>{file.type || "Unknown"}</td>
                          <td>{formatFileSize(file.size)}</td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-ghost btn-sm text-error"
                              onClick={() => removeFile(index)}
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Upload options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Project</span>
                </label>
                <select
                  className="select select-bordered w-full"
                  value={project}
                  onChange={(e) => setProject(e.target.value)}
                  required
                >
                  <option value="" disabled>
                    Select a project
                  </option>
                  {mockProjects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Tags</span>
                </label>
                <input
                  type="text"
                  className="input input-bordered w-full"
                  placeholder="Add tags separated by commas"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                />
                <label className="label">
                  <span className="label-text-alt">Example: site, inspection, foundation</span>
                </label>
              </div>
            </div>

            <div className="form-control mt-4">
              <label className="label">
                <span className="label-text">Description</span>
              </label>
              <textarea
                className="textarea textarea-bordered w-full"
                rows={3}
                placeholder="Add a description for these files"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              ></textarea>
            </div>

            <div className="form-control mt-4">
              <label className="label cursor-pointer justify-start gap-2">
                <input type="checkbox" className="checkbox checkbox-sm" />
                <span className="label-text">Notify team members</span>
              </label>
            </div>

            {/* Upload progress */}
            {uploading && (
              <div className="mt-6">
                <div className="flex justify-between mb-1">
                  <span className="text-sm">Uploading...</span>
                  <span className="text-sm">{uploadProgress}%</span>
                </div>
                <progress className="progress progress-primary w-full" value={uploadProgress} max="100"></progress>
              </div>
            )}

            {/* Submit button */}
            <div className="flex justify-end gap-2 mt-6">
              <Link href="/dashboard/media" className="btn btn-ghost">
                Cancel
              </Link>
              <button type="submit" className="btn btn-primary" disabled={uploading || files.length === 0}>
                {uploading ? (
                  <>
                    <span className="loading loading-spinner loading-sm mr-2"></span>
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="fas fa-cloud-upload-alt mr-2"></i>
                    Upload Files
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
