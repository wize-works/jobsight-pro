"use client"

import { useState } from "react"
import Link from "next/link"

// Mock data for media items
const mockMediaItems = [
  {
    id: "media1",
    name: "Site Overview.jpg",
    type: "image",
    url: "/placeholder.svg?key=fyrxg",
  },
  {
    id: "media2",
    name: "Foundation Plan.pdf",
    type: "document",
    url: "/placeholder.svg?key=2pakh",
  },
  {
    id: "media3",
    name: "Equipment Inspection.mp4",
    type: "video",
    url: "/placeholder.svg?key=7jbro",
  },
  {
    id: "media4",
    name: "Client Meeting Notes.docx",
    type: "document",
    url: "/placeholder.svg?key=vz4dz",
  },
  {
    id: "media5",
    name: "Concrete Pour.jpg",
    type: "image",
    url: "/placeholder.svg?key=eoq87",
  },
  {
    id: "media6",
    name: "Safety Briefing.mp4",
    type: "video",
    url: "/placeholder.svg?key=irpuc",
  },
]

interface MediaSelectorProps {
  multiple?: boolean
  onSelect: (selectedMedia: any | any[]) => void
  onClose: () => void
  initialSelected?: string[]
}

export default function MediaSelector({
  multiple = false,
  onSelect,
  onClose,
  initialSelected = [],
}: MediaSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedItems, setSelectedItems] = useState<string[]>(initialSelected)

  // Filter media items based on search query
  const filteredMedia = mockMediaItems.filter((item) => {
    return searchQuery === "" || item.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  // Toggle selection of an item
  const toggleSelection = (id: string) => {
    if (multiple) {
      if (selectedItems.includes(id)) {
        setSelectedItems(selectedItems.filter((itemId) => itemId !== id))
      } else {
        setSelectedItems([...selectedItems, id])
      }
    } else {
      setSelectedItems([id])
    }
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

  // Handle selection confirmation
  const handleConfirm = () => {
    if (multiple) {
      const selectedMedia = mockMediaItems.filter((item) => selectedItems.includes(item.id))
      onSelect(selectedMedia)
    } else {
      const selectedMedia = mockMediaItems.find((item) => item.id === selectedItems[0])
      onSelect(selectedMedia)
    }
    onClose()
  }

  return (
    <div className="bg-base-100 rounded-lg shadow-lg p-4 max-h-[80vh] flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Select Media</h3>
        <button className="btn btn-sm btn-ghost" onClick={onClose}>
          <i className="fas fa-times"></i>
        </button>
      </div>

      <div className="form-control mb-4">
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

      <div className="flex justify-between items-center mb-2">
        <span className="text-sm">{filteredMedia.length} items</span>
        <Link href="/dashboard/media/upload" className="text-sm text-primary">
          Upload New
        </Link>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 overflow-y-auto flex-1">
        {filteredMedia.map((item) => (
          <div
            key={item.id}
            className={`card bg-base-200 cursor-pointer hover:bg-base-300 transition-colors ${
              selectedItems.includes(item.id) ? "ring-2 ring-primary" : ""
            }`}
            onClick={() => toggleSelection(item.id)}
          >
            <figure className="relative h-20">
              {item.type === "image" ? (
                <img src={item.url || "/placeholder.svg"} alt={item.name} className="object-cover w-full h-full" />
              ) : (
                <div className="flex items-center justify-center w-full h-full">{getFileIcon(item.type)}</div>
              )}
              {selectedItems.includes(item.id) && (
                <div className="absolute top-1 right-1">
                  <div className="badge badge-primary badge-sm">
                    <i className="fas fa-check"></i>
                  </div>
                </div>
              )}
            </figure>
            <div className="p-2">
              <p className="text-xs truncate">{item.name}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-2 mt-4">
        <button className="btn btn-ghost btn-sm" onClick={onClose}>
          Cancel
        </button>
        <button className="btn btn-primary btn-sm" onClick={handleConfirm} disabled={selectedItems.length === 0}>
          {multiple ? `Select (${selectedItems.length})` : "Select"}
        </button>
      </div>
    </div>
  )
}
