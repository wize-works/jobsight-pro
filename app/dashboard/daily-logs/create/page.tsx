"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { WeatherDisplay } from "@/components/weather-display"
import { PhotoUpload } from "@/components/photo-upload"

export default function CreateDailyLogPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [formData, setFormData] = useState({
    project: "",
    date: new Date().toISOString().split("T")[0],
    summary: "",
    notes: "",
    location: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would submit the form data to your backend
    console.log("Form submitted:", formData)
    // Redirect to the daily logs list
    // router.push("/dashboard/daily-logs")
  }

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/dashboard/daily-logs" className="btn btn-ghost btn-sm">
              <i className="fas fa-arrow-left"></i>
            </Link>
            <h1 className="text-2xl font-bold">Create Daily Log</h1>
          </div>
          <p className="text-base-content/70">Record today's project activities</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Tabs */}
        <div className="tabs tabs-boxed mb-6">
          <button
            type="button"
            className={`tab ${activeTab === "general" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("general")}
          >
            General
          </button>
          <button
            type="button"
            className={`tab ${activeTab === "tasks" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("tasks")}
          >
            Tasks & Materials
          </button>
          <button
            type="button"
            className={`tab ${activeTab === "equipment" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("equipment")}
          >
            Equipment
          </button>
          <button
            type="button"
            className={`tab ${activeTab === "safety" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("safety")}
          >
            Safety
          </button>
          <button
            type="button"
            className={`tab ${activeTab === "photos" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("photos")}
          >
            Photos
          </button>
          <button
            type="button"
            className={`tab ${activeTab === "visitors" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("visitors")}
          >
            Visitors
          </button>
        </div>

        {/* General Tab */}
        {activeTab === "general" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <div className="card bg-base-100 shadow-md mb-6">
                <div className="card-body">
                  <h2 className="card-title">Log Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Project</span>
                      </label>
                      <select
                        name="project"
                        className="select select-bordered w-full"
                        value={formData.project}
                        onChange={handleChange}
                        required
                      >
                        <option value="" disabled>
                          Select a project
                        </option>
                        <option value="Riverside Apartments">Riverside Apartments</option>
                        <option value="Downtown Office Complex">Downtown Office Complex</option>
                        <option value="Community Center">Community Center</option>
                      </select>
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Date</span>
                      </label>
                      <input
                        type="date"
                        name="date"
                        className="input input-bordered"
                        value={formData.date}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-control mt-4">
                    <label className="label">
                      <span className="label-text">Location</span>
                    </label>
                    <input
                      type="text"
                      name="location"
                      placeholder="Enter location (e.g., New York, NY)"
                      className="input input-bordered"
                      value={formData.location}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-control mt-4">
                    <label className="label">
                      <span className="label-text">Summary</span>
                    </label>
                    <textarea
                      name="summary"
                      className="textarea textarea-bordered h-24"
                      placeholder="Provide a brief summary of today's activities"
                      value={formData.summary}
                      onChange={handleChange}
                      required
                    ></textarea>
                  </div>

                  <div className="form-control mt-4">
                    <label className="label">
                      <span className="label-text">Notes</span>
                    </label>
                    <textarea
                      name="notes"
                      className="textarea textarea-bordered h-24"
                      placeholder="Additional notes, observations, or follow-up items"
                      value={formData.notes}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <h2 className="card-title">Weather Conditions</h2>
                  <WeatherDisplay
                    location={formData.location || "New York, NY"}
                    date={formData.date}
                    fallbackData={{
                      condition: "Sunny",
                      temperature: 75,
                      humidity: 45,
                      windSpeed: 8,
                      location: formData.location || "New York, NY",
                    }}
                  />
                </div>
              </div>

              <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                  <h2 className="card-title">Quick Actions</h2>
                  <div className="space-y-2">
                    <button type="button" className="btn btn-outline btn-block">
                      <i className="fas fa-copy mr-2"></i>
                      Copy from Previous Log
                    </button>
                    <button type="button" className="btn btn-outline btn-block">
                      <i className="fas fa-file-import mr-2"></i>
                      Import Data
                    </button>
                    <button type="button" className="btn btn-outline btn-block">
                      <i className="fas fa-save mr-2"></i>
                      Save as Template
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks & Materials Tab */}
        {activeTab === "tasks" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="card-title">Tasks</h2>
                  <button type="button" className="btn btn-sm btn-primary">
                    <i className="fas fa-plus mr-2"></i>
                    Add Task
                  </button>
                </div>

                <div className="space-y-4">
                  {[1, 2, 3].map((index) => (
                    <div key={index} className="card bg-base-200">
                      <div className="card-body p-4">
                        <div className="flex justify-between items-start">
                          <div className="form-control w-full">
                            <input
                              type="text"
                              placeholder={`Task ${index} description`}
                              className="input input-sm input-bordered w-full"
                            />
                          </div>
                          <button type="button" className="btn btn-sm btn-ghost text-error ml-2">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                        <div className="flex items-center mt-2">
                          <select className="select select-sm select-bordered">
                            <option>Not Started</option>
                            <option>In Progress</option>
                            <option>Completed</option>
                            <option>Delayed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="card-title">Materials</h2>
                  <button type="button" className="btn btn-sm btn-primary">
                    <i className="fas fa-plus mr-2"></i>
                    Add Material
                  </button>
                </div>

                <div className="space-y-4">
                  {[1, 2].map((index) => (
                    <div key={index} className="card bg-base-200">
                      <div className="card-body p-4">
                        <div className="flex justify-between items-start">
                          <div className="form-control w-full">
                            <input
                              type="text"
                              placeholder={`Material ${index} name`}
                              className="input input-sm input-bordered w-full"
                            />
                          </div>
                          <button type="button" className="btn btn-sm btn-ghost text-error ml-2">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <input type="text" placeholder="Quantity" className="input input-sm input-bordered" />
                          <select className="select select-sm select-bordered">
                            <option>Not Delivered</option>
                            <option>Partially Delivered</option>
                            <option>Delivered</option>
                            <option>Delayed</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Equipment Tab */}
        {activeTab === "equipment" && (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">Equipment Used</h2>
                <button type="button" className="btn btn-sm btn-primary">
                  <i className="fas fa-plus mr-2"></i>
                  Add Equipment
                </button>
              </div>

              <div className="space-y-4">
                {[1, 2, 3].map((index) => (
                  <div key={index} className="card bg-base-200">
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start">
                        <div className="form-control w-full">
                          <input
                            type="text"
                            placeholder={`Equipment ${index} name`}
                            className="input input-sm input-bordered w-full"
                          />
                        </div>
                        <button type="button" className="btn btn-sm btn-ghost text-error ml-2">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2 mt-2">
                        <input type="number" placeholder="Hours" className="input input-sm input-bordered" />
                        <input type="text" placeholder="Operator" className="input input-sm input-bordered" />
                        <select className="select select-sm select-bordered">
                          <option>Operational</option>
                          <option>Maintenance Required</option>
                          <option>Broken Down</option>
                          <option>Not Used</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Safety Tab */}
        {activeTab === "safety" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="card-title">Safety Incidents</h2>
                  <button type="button" className="btn btn-sm btn-primary">
                    <i className="fas fa-plus mr-2"></i>
                    Add Incident
                  </button>
                </div>

                <div className="space-y-4">
                  {[1].map((index) => (
                    <div key={index} className="card bg-base-200">
                      <div className="card-body p-4">
                        <div className="flex justify-between items-start">
                          <div className="form-control w-full">
                            <input
                              type="text"
                              placeholder="Incident description"
                              className="input input-sm input-bordered w-full"
                            />
                          </div>
                          <button type="button" className="btn btn-sm btn-ghost text-error ml-2">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <select className="select select-sm select-bordered">
                            <option>Minor</option>
                            <option>Moderate</option>
                            <option>Severe</option>
                            <option>Critical</option>
                          </select>
                          <input type="text" placeholder="Action taken" className="input input-sm input-bordered" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="card-title">Safety Inspections</h2>
                  <button type="button" className="btn btn-sm btn-primary">
                    <i className="fas fa-plus mr-2"></i>
                    Add Inspection
                  </button>
                </div>

                <div className="space-y-4">
                  {[1].map((index) => (
                    <div key={index} className="card bg-base-200">
                      <div className="card-body p-4">
                        <div className="flex justify-between items-start">
                          <div className="form-control w-full">
                            <input
                              type="text"
                              placeholder="Inspection type"
                              className="input input-sm input-bordered w-full"
                            />
                          </div>
                          <button type="button" className="btn btn-sm btn-ghost text-error ml-2">
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <input type="text" placeholder="Inspector" className="input input-sm input-bordered" />
                          <input type="text" placeholder="Findings" className="input input-sm input-bordered" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Photos Tab */}
        {activeTab === "photos" && (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <h2 className="card-title">Site Photos</h2>
              <p className="text-base-content/70 mb-4">
                Upload photos of the construction site, materials, or any relevant visual documentation.
              </p>

              <PhotoUpload />
            </div>
          </div>
        )}

        {/* Visitors Tab */}
        {activeTab === "visitors" && (
          <div className="card bg-base-100 shadow-md">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">Visitors</h2>
                <button type="button" className="btn btn-sm btn-primary">
                  <i className="fas fa-plus mr-2"></i>
                  Add Visitor
                </button>
              </div>

              <div className="space-y-4">
                {[1, 2].map((index) => (
                  <div key={index} className="card bg-base-200">
                    <div className="card-body p-4">
                      <div className="flex justify-between items-start">
                        <div className="form-control w-full">
                          <input
                            type="text"
                            placeholder="Visitor name"
                            className="input input-sm input-bordered w-full"
                          />
                        </div>
                        <button type="button" className="btn btn-sm btn-ghost text-error ml-2">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        <input type="text" placeholder="Company" className="input input-sm input-bordered" />
                        <input type="text" placeholder="Purpose of visit" className="input input-sm input-bordered" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Form actions */}
        <div className="flex justify-end gap-2 mt-6">
          <Link href="/dashboard/daily-logs" className="btn btn-outline">
            Cancel
          </Link>
          <button type="submit" className="btn btn-primary">
            Save Daily Log
          </button>
        </div>
      </form>
    </div>
  )
}
