"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"

// Mock data for a single media item
const mockMediaItem = {
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
  description:
    "Initial site survey photo showing the north-east corner of the property. This image captures the existing structures and terrain before demolition began.",
  location: "123 Main Street, Cityville",
  coordinates: "40.7128° N, 74.0060° W",
  camera: "iPhone 13 Pro",
  comments: [
    {
      id: "1",
      user: "Jane Smith",
      avatar: "/diverse-avatars.png",
      text: "We should mark the utility lines visible in this photo before excavation begins.",
      timestamp: "2023-05-16 09:30 AM",
    },
    {
      id: "2",
      user: "Mike Johnson",
      avatar: null,
      text: "Good catch. I'll have the surveyor update the plans with these details.",
      timestamp: "2023-05-16 10:15 AM",
    },
  ],
}

// Mock data for related media
const mockRelatedMedia = [
  {
    id: "2",
    type: "image",
    name: "Site Survey Photo 2",
    url: "/placeholder-kpzye.png",
    project: "Downtown Highrise",
  },
  {
    id: "3",
    type: "image",
    name: "Site Survey Photo 3",
    url: "/placeholder-xf0jv.png",
    project: "Downtown Highrise",
  },
  {
    id: "4",
    type: "document",
    name: "Site Survey Report",
    url: "/placeholder.svg",
    project: "Downtown Highrise",
  },
]

export default function MediaDetailPage({ params }: { params: { id: string } }) {
  const [activeTab, setActiveTab] = useState("details")
  const [comment, setComment] = useState("")

  // In a real app, you would fetch the media item based on the ID
  const mediaItem = mockMediaItem

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would add the comment to the database
    alert(`Comment added: ${comment}`)
    setComment("")
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
          <li>{mediaItem.name}</li>
        </ul>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Media preview */}
        <div className="lg:col-span-2">
          <div className="bg-base-100 rounded-box shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h1 className="text-2xl font-bold">{mediaItem.name}</h1>
              <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-sm">
                  <i className="fas fa-ellipsis-v"></i>
                </div>
                <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52">
                  <li>
                    <a>
                      <i className="fas fa-download"></i> Download
                    </a>
                  </li>
                  <li>
                    <a>
                      <i className="fas fa-share"></i> Share
                    </a>
                  </li>
                  <li>
                    <a>
                      <i className="fas fa-edit"></i> Rename
                    </a>
                  </li>
                  <li>
                    <a>
                      <i className="fas fa-tag"></i> Manage Tags
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

            {mediaItem.type === "image" ? (
              <div className="relative w-full h-[500px] bg-base-300 rounded-box overflow-hidden">
                <Image
                  src={mediaItem.url || "/placeholder.svg"}
                  alt={mediaItem.name}
                  fill
                  className="object-contain"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            ) : mediaItem.type === "video" ? (
              <div className="relative w-full h-[500px] bg-base-300 rounded-box flex items-center justify-center">
                <i className="fas fa-play-circle text-6xl"></i>
              </div>
            ) : (
              <div className="relative w-full h-[500px] bg-base-300 rounded-box flex flex-col items-center justify-center">
                <i className="fas fa-file-alt text-6xl mb-4"></i>
                <p className="text-lg font-medium">{mediaItem.name}</p>
                <button className="btn btn-primary mt-4">
                  <i className="fas fa-download mr-2"></i>
                  Download Document
                </button>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-4">
              {mediaItem.tags.map((tag) => (
                <div key={tag} className="badge badge-outline">
                  #{tag}
                </div>
              ))}
              <button className="badge badge-outline">
                <i className="fas fa-plus mr-1"></i> Add Tag
              </button>
            </div>

            <div className="tabs tabs-boxed mt-6">
              <a
                className={`tab ${activeTab === "details" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("details")}
              >
                Details
              </a>
              <a
                className={`tab ${activeTab === "comments" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("comments")}
              >
                Comments ({mediaItem.comments.length})
              </a>
              <a
                className={`tab ${activeTab === "history" ? "tab-active" : ""}`}
                onClick={() => setActiveTab("history")}
              >
                History
              </a>
            </div>

            <div className="mt-4">
              {activeTab === "details" && (
                <div className="space-y-4">
                  <p className="text-base-content/80">{mediaItem.description}</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h3 className="font-medium">File Information</h3>
                      <table className="table table-sm">
                        <tbody>
                          <tr>
                            <td className="font-medium">Type</td>
                            <td>{mediaItem.type}</td>
                          </tr>
                          <tr>
                            <td className="font-medium">Size</td>
                            <td>{mediaItem.size}</td>
                          </tr>
                          {mediaItem.dimensions && (
                            <tr>
                              <td className="font-medium">Dimensions</td>
                              <td>{mediaItem.dimensions}</td>
                            </tr>
                          )}
                          <tr>
                            <td className="font-medium">Uploaded By</td>
                            <td>{mediaItem.uploadedBy}</td>
                          </tr>
                          <tr>
                            <td className="font-medium">Upload Date</td>
                            <td>{mediaItem.createdAt}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    <div>
                      <h3 className="font-medium">Location Information</h3>
                      <table className="table table-sm">
                        <tbody>
                          <tr>
                            <td className="font-medium">Project</td>
                            <td>{mediaItem.project}</td>
                          </tr>
                          <tr>
                            <td className="font-medium">Location</td>
                            <td>{mediaItem.location}</td>
                          </tr>
                          <tr>
                            <td className="font-medium">Coordinates</td>
                            <td>{mediaItem.coordinates}</td>
                          </tr>
                          {mediaItem.camera && (
                            <tr>
                              <td className="font-medium">Camera</td>
                              <td>{mediaItem.camera}</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "comments" && (
                <div className="space-y-4">
                  {mediaItem.comments.map((comment) => (
                    <div key={comment.id} className="flex gap-4">
                      <div className="avatar">
                        <div className="w-10 rounded-full">
                          {comment.avatar ? (
                            <Image
                              src={comment.avatar || "/placeholder.svg"}
                              alt={comment.user}
                              width={40}
                              height={40}
                            />
                          ) : (
                            <div className="bg-primary text-primary-content flex items-center justify-center h-full text-lg font-semibold">
                              {comment.user[0]}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{comment.user}</h4>
                          <span className="text-xs text-base-content/70">{comment.timestamp}</span>
                        </div>
                        <p className="mt-1">{comment.text}</p>
                      </div>
                    </div>
                  ))}

                  <form onSubmit={handleAddComment} className="mt-6">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Add a comment</span>
                      </label>
                      <textarea
                        className="textarea textarea-bordered h-24"
                        placeholder="Type your comment here..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      ></textarea>
                    </div>
                    <div className="form-control mt-4">
                      <button type="submit" className="btn btn-primary">
                        <i className="fas fa-comment mr-2"></i>
                        Add Comment
                      </button>
                    </div>
                  </form>
                </div>
              )}

              {activeTab === "history" && (
                <div className="space-y-4">
                  <ul className="timeline timeline-vertical">
                    <li>
                      <div className="timeline-start">May 15, 2023</div>
                      <div className="timeline-middle">
                        <i className="fas fa-circle"></i>
                      </div>
                      <div className="timeline-end timeline-box">
                        <p>
                          <span className="font-medium">John Doe</span> uploaded this file
                        </p>
                      </div>
                      <hr />
                    </li>
                    <li>
                      <div className="timeline-start">May 16, 2023</div>
                      <div className="timeline-middle">
                        <i className="fas fa-circle"></i>
                      </div>
                      <div className="timeline-end timeline-box">
                        <p>
                          <span className="font-medium">Jane Smith</span> added a comment
                        </p>
                      </div>
                      <hr />
                    </li>
                    <li>
                      <div className="timeline-start">May 16, 2023</div>
                      <div className="timeline-middle">
                        <i className="fas fa-circle"></i>
                      </div>
                      <div className="timeline-end timeline-box">
                        <p>
                          <span className="font-medium">Mike Johnson</span> added a comment
                        </p>
                      </div>
                      <hr />
                    </li>
                    <li>
                      <div className="timeline-start">May 17, 2023</div>
                      <div className="timeline-middle">
                        <i className="fas fa-circle"></i>
                      </div>
                      <div className="timeline-end timeline-box">
                        <p>
                          <span className="font-medium">Sarah Williams</span> added tag{" "}
                          <span className="badge badge-sm">survey</span>
                        </p>
                      </div>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-base-100 rounded-box shadow-sm p-4 mb-6">
            <h3 className="font-medium mb-4">Actions</h3>
            <div className="space-y-2">
              <button className="btn btn-outline btn-block">
                <i className="fas fa-download mr-2"></i>
                Download
              </button>
              <button className="btn btn-outline btn-block">
                <i className="fas fa-share mr-2"></i>
                Share
              </button>
              <button className="btn btn-outline btn-block">
                <i className="fas fa-edit mr-2"></i>
                Edit
              </button>
              <button className="btn btn-outline btn-block">
                <i className="fas fa-link mr-2"></i>
                Copy Link
              </button>
              <button className="btn btn-outline btn-error btn-block">
                <i className="fas fa-trash mr-2"></i>
                Delete
              </button>
            </div>
          </div>

          <div className="bg-base-100 rounded-box shadow-sm p-4">
            <h3 className="font-medium mb-4">Related Media</h3>
            <div className="space-y-4">
              {mockRelatedMedia.map((item) => (
                <Link href={`/dashboard/media/${item.id}`} key={item.id} className="flex gap-3 items-center">
                  <div className="avatar">
                    <div className="w-12 h-12 rounded">
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
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-base-content/70">{item.project}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
