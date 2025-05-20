"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"

interface PhotoItem {
  id: string
  file: File
  preview: string
  caption: string
  timestamp: string
}

export function PhotoUpload() {
  const [photos, setPhotos] = useState<PhotoItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (files: FileList) => {
    const newPhotos: PhotoItem[] = []

    Array.from(files).forEach((file) => {
      if (file.type.startsWith("image/")) {
        const id = `photo-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
        newPhotos.push({
          id,
          file,
          preview: URL.createObjectURL(file),
          caption: "",
          timestamp: new Date().toISOString(),
        })
      }
    })

    setPhotos((prev) => [...prev, ...newPhotos])
  }

  const handleCaptionChange = (id: string, caption: string) => {
    setPhotos((prev) => prev.map((photo) => (photo.id === id ? { ...photo, caption } : photo)))
  }

  const handleRemovePhoto = (id: string) => {
    setPhotos((prev) => {
      const filtered = prev.filter((photo) => photo.id !== id)
      // Revoke the object URL to avoid memory leaks
      const photoToRemove = prev.find((photo) => photo.id === id)
      if (photoToRemove) {
        URL.revokeObjectURL(photoToRemove.preview)
      }
      return filtered
    })
  }

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center ${
          isDragging ? "border-primary bg-primary/10" : "border-base-300"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center justify-center">
          <i className="fas fa-cloud-upload-alt text-4xl mb-4 text-base-content/70"></i>
          <p className="mb-4">Drag and drop photos here, or click to select files</p>
          <button type="button" className="btn btn-primary" onClick={() => fileInputRef.current?.click()}>
            <i className="fas fa-camera mr-2"></i>
            Select Photos
          </button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>

      {/* Preview area */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-medium">Uploaded Photos ({photos.length})</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="card bg-base-200">
                <figure className="relative h-48">
                  <Image
                    src={photo.preview || "/placeholder.svg"}
                    alt={photo.caption || "Uploaded photo"}
                    fill
                    className="object-cover rounded-t-lg"
                  />
                  <button
                    type="button"
                    className="absolute top-2 right-2 btn btn-sm btn-circle btn-error"
                    onClick={() => handleRemovePhoto(photo.id)}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </figure>
                <div className="card-body p-4">
                  <input
                    type="text"
                    placeholder="Add a caption"
                    className="input input-sm input-bordered w-full"
                    value={photo.caption}
                    onChange={(e) => handleCaptionChange(photo.id, e.target.value)}
                  />
                  <p className="text-xs text-base-content/70">{new Date(photo.timestamp).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
