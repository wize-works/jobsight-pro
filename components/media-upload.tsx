"use client"

import type React from "react"

import { useState, useRef } from "react"
import Image from "next/image"

interface MediaUploadProps {
  onUpload?: (files: File[]) => void
  maxFiles?: number
  acceptedTypes?: string
  maxSize?: number // in MB
}

export function MediaUpload({
  onUpload,
  maxFiles = 10,
  acceptedTypes = "image/*,video/*,application/pdf",
  maxSize = 10, // 10MB
}: MediaUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [dragActive, setDragActive] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const validateFile = (file: File): string | null => {
    // Check file type
    const fileType = file.type
    if (!acceptedTypes.includes(fileType.split("/")[0] + "/*") && !acceptedTypes.includes(fileType)) {
      return `File type ${fileType} is not supported`
    }

    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`
    }

    return null
  }

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return

    const fileArray = Array.from(newFiles)
    const newErrors: string[] = []
    const validFiles: File[] = []
    const newPreviews: string[] = []

    // Check if adding these files would exceed the max files limit
    if (files.length + fileArray.length > maxFiles) {
      newErrors.push(`You can only upload a maximum of ${maxFiles} files`)
      return
    }

    fileArray.forEach((file) => {
      const error = validateFile(file)
      if (error) {
        newErrors.push(`${file.name}: ${error}`)
      } else {
        validFiles.push(file)

        // Create preview for images
        if (file.type.startsWith("image/")) {
          const reader = new FileReader()
          reader.onloadend = () => {
            newPreviews.push(reader.result as string)
            setPreviews([...previews, ...newPreviews])
          }
          reader.readAsDataURL(file)
        } else if (file.type.startsWith("video/")) {
          newPreviews.push("/video-file-concept.png")
        } else {
          newPreviews.push("/document-file.png")
        }
      }
    })

    if (validFiles.length > 0) {
      setFiles([...files, ...validFiles])
      if (onUpload) {
        onUpload([...files, ...validFiles])
      }
    }

    if (newErrors.length > 0) {
      setErrors([...errors, ...newErrors])
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    handleFiles(e.dataTransfer.files)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files)
  }

  const handleButtonClick = () => {
    inputRef.current?.click()
  }

  const removeFile = (index: number) => {
    const newFiles = [...files]
    const newPreviews = [...previews]
    newFiles.splice(index, 1)
    newPreviews.splice(index, 1)
    setFiles(newFiles)
    setPreviews(newPreviews)
    if (onUpload) {
      onUpload(newFiles)
    }
  }

  const removeError = (index: number) => {
    const newErrors = [...errors]
    newErrors.splice(index, 1)
    setErrors(newErrors)
  }

  return (
    <div className="w-full">
      {/* Error messages */}
      {errors.length > 0 && (
        <div className="mb-4">
          {errors.map((error, index) => (
            <div key={index} className="alert alert-error mb-2">
              <div>
                <i className="fas fa-exclamation-circle"></i>
                <span>{error}</span>
              </div>
              <button className="btn btn-sm btn-ghost" onClick={() => removeError(index)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drag and drop area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center ${
          dragActive ? "border-primary bg-primary/10" : "border-base-300"
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input ref={inputRef} type="file" multiple accept={acceptedTypes} onChange={handleChange} className="hidden" />

        <div className="flex flex-col items-center justify-center py-4">
          <i className="fas fa-cloud-upload-alt text-4xl mb-4 text-primary"></i>
          <p className="mb-2 text-lg font-semibold">{dragActive ? "Drop files here" : "Drag and drop files here"}</p>
          <p className="mb-4 text-sm text-base-content/70">
            or click to browse (max {maxFiles} files, {maxSize}MB each)
          </p>
          <button
            type="button"
            onClick={handleButtonClick}
            className="btn btn-primary"
            disabled={files.length >= maxFiles}
          >
            <i className="fas fa-folder-open mr-2"></i>
            Browse Files
          </button>
        </div>

        <div className="text-xs text-base-content/70 mt-2">
          Accepted file types: {acceptedTypes.replace(/,/g, ", ")}
        </div>
      </div>

      {/* Preview of selected files */}
      {files.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-2">Selected Files ({files.length})</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {files.map((file, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-base-200">
                  {file.type.startsWith("image/") && previews[index] ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={previews[index] || "/placeholder.svg"}
                        alt={file.name}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    </div>
                  ) : file.type.startsWith("video/") ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="fas fa-play-circle text-4xl"></i>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <i className="fas fa-file-alt text-4xl"></i>
                    </div>
                  )}
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button type="button" onClick={() => removeFile(index)} className="btn btn-sm btn-circle btn-error">
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
                <p className="text-xs mt-1 truncate">{file.name}</p>
                <p className="text-xs text-base-content/70">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
