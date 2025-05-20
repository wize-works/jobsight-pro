"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"

export default function NewDailyLogPage() {
  // Mock data for projects and crews
  const projects = [
    { id: "proj-001", name: "Oakridge Commercial Center" },
    { id: "proj-002", name: "Riverside Apartments" },
    { id: "proj-003", name: "Metro City Government Building" },
    { id: "proj-004", name: "Greenfield Homes Development" },
  ]

  const crews = [
    { id: "crew-001", name: "Foundation Team Alpha" },
    { id: "crew-002", name: "Framing Crew" },
    { id: "crew-003", name: "Electrical Team" },
    { id: "crew-004", name: "HVAC Installation Team" },
    { id: "crew-005", name: "Roofing Team" },
  ]

  // State for form data
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    projectId: "",
    crewId: "",
    weather: {
      condition: "",
      temperature: "",
      windSpeed: "",
      precipitation: "",
      notes: "",
    },
    workCompleted: "",
    workPlanned: "",
    startTime: "07:00",
    endTime: "16:00",
    hoursWorked: 8,
    overtime: 0,
    materials: [{ name: "", quantity: "", cost: "", supplier: "" }],
    equipment: [{ name: "", hours: "", operator: "", condition: "Good" }],
    safety: {
      incidents: "No incidents",
      inspections: "",
      hazards: "",
      corrective: "",
    },
    quality: {
      inspections: "",
      issues: "None",
      corrective: "",
    },
    delays: {
      description: "",
      impact: "",
      resolution: "",
    },
    visitors: [{ name: "", company: "", purpose: "" }],
    notes: "",
  })

  // State for active tab
  const [activeTab, setActiveTab] = useState("general")

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target

    // Handle nested properties
    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent as keyof typeof formData],
          [child]: value,
        },
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  // Handle array field changes (materials, equipment, visitors)
  const handleArrayChange = (
    arrayName: "materials" | "equipment" | "visitors",
    index: number,
    field: string,
    value: string,
  ) => {
    const updatedArray = [...formData[arrayName]]
    updatedArray[index] = {
      ...updatedArray[index],
      [field]: value,
    }

    setFormData({
      ...formData,
      [arrayName]: updatedArray,
    })
  }

  // Add new item to an array
  const addArrayItem = (arrayName: "materials" | "equipment" | "visitors") => {
    let newItem

    if (arrayName === "materials") {
      newItem = { name: "", quantity: "", cost: "", supplier: "" }
    } else if (arrayName === "equipment") {
      newItem = { name: "", hours: "", operator: "", condition: "Good" }
    } else {
      newItem = { name: "", company: "", purpose: "" }
    }

    setFormData({
      ...formData,
      [arrayName]: [...formData[arrayName], newItem],
    })
  }

  // Remove item from an array
  const removeArrayItem = (arrayName: "materials" | "equipment" | "visitors", index: number) => {
    const updatedArray = [...formData[arrayName]]
    updatedArray.splice(index, 1)

    setFormData({
      ...formData,
      [arrayName]: updatedArray,
    })
  }

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log("Form submitted:", formData)
    // In a real app, this would send the data to the server
    // For now, we'll just redirect to the daily logs page
    window.location.href = "/dashboard/daily-logs"
  }

  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/daily-logs" className="btn btn-ghost btn-sm">
              <i className="fas fa-arrow-left"></i>
            </Link>
            <h1 className="text-2xl font-bold">New Daily Log</h1>
          </div>
          <p className="text-gray-500">Record daily activities, progress, and resources</p>
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
            className={`tab ${activeTab === "labor" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("labor")}
          >
            Labor & Hours
          </button>
          <button
            type="button"
            className={`tab ${activeTab === "materials" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("materials")}
          >
            Materials & Equipment
          </button>
          <button
            type="button"
            className={`tab ${activeTab === "safety" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("safety")}
          >
            Safety & Quality
          </button>
          <button
            type="button"
            className={`tab ${activeTab === "other" ? "tab-active" : ""}`}
            onClick={() => setActiveTab("other")}
          >
            Other
          </button>
        </div>

        {/* General Tab */}
        {activeTab === "general" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Basic Information</h2>
                <div className="divider my-2"></div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Date</span>
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleChange}
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Project</span>
                  </label>
                  <select
                    name="projectId"
                    value={formData.projectId}
                    onChange={handleChange}
                    className="select select-bordered"
                    required
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Crew</span>
                  </label>
                  <select
                    name="crewId"
                    value={formData.crewId}
                    onChange={handleChange}
                    className="select select-bordered"
                    required
                  >
                    <option value="">Select a crew</option>
                    {crews.map((crew) => (
                      <option key={crew.id} value={crew.id}>
                        {crew.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Weather Conditions</h2>
                <div className="divider my-2"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Weather Condition</span>
                    </label>
                    <select
                      name="weather.condition"
                      value={formData.weather.condition}
                      onChange={handleChange}
                      className="select select-bordered"
                      required
                    >
                      <option value="">Select condition</option>
                      <option value="Sunny">Sunny</option>
                      <option value="Partly Cloudy">Partly Cloudy</option>
                      <option value="Cloudy">Cloudy</option>
                      <option value="Rainy">Rainy</option>
                      <option value="Stormy">Stormy</option>
                      <option value="Snowy">Snowy</option>
                      <option value="Foggy">Foggy</option>
                      <option value="Windy">Windy</option>
                    </select>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Temperature</span>
                    </label>
                    <input
                      type="text"
                      name="weather.temperature"
                      value={formData.weather.temperature}
                      onChange={handleChange}
                      placeholder="e.g., 75°F"
                      className="input input-bordered"
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Wind Speed</span>
                    </label>
                    <input
                      type="text"
                      name="weather.windSpeed"
                      value={formData.weather.windSpeed}
                      onChange={handleChange}
                      placeholder="e.g., 5 mph"
                      className="input input-bordered"
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Precipitation</span>
                    </label>
                    <input
                      type="text"
                      name="weather.precipitation"
                      value={formData.weather.precipitation}
                      onChange={handleChange}
                      placeholder="e.g., 0 in"
                      className="input input-bordered"
                    />
                  </div>
                </div>

                <div className="form-control mt-2">
                  <label className="label">
                    <span className="label-text">Weather Notes</span>
                  </label>
                  <textarea
                    name="weather.notes"
                    value={formData.weather.notes}
                    onChange={handleChange}
                    placeholder="Any additional weather information..."
                    className="textarea textarea-bordered h-20"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-lg md:col-span-2">
              <div className="card-body">
                <h2 className="card-title">Work Summary</h2>
                <div className="divider my-2"></div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Work Completed</span>
                  </label>
                  <textarea
                    name="workCompleted"
                    value={formData.workCompleted}
                    onChange={handleChange}
                    placeholder="Describe the work completed today..."
                    className="textarea textarea-bordered h-24"
                    required
                  ></textarea>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Work Planned for Next Day</span>
                  </label>
                  <textarea
                    name="workPlanned"
                    value={formData.workPlanned}
                    onChange={handleChange}
                    placeholder="Describe the work planned for tomorrow..."
                    className="textarea textarea-bordered h-24"
                    required
                  ></textarea>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Labor & Hours Tab */}
        {activeTab === "labor" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Hours Information</h2>
                <div className="divider my-2"></div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Start Time</span>
                    </label>
                    <input
                      type="time"
                      name="startTime"
                      value={formData.startTime}
                      onChange={handleChange}
                      className="input input-bordered"
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">End Time</span>
                    </label>
                    <input
                      type="time"
                      name="endTime"
                      value={formData.endTime}
                      onChange={handleChange}
                      className="input input-bordered"
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Regular Hours</span>
                    </label>
                    <input
                      type="number"
                      name="hoursWorked"
                      value={formData.hoursWorked}
                      onChange={handleChange}
                      className="input input-bordered"
                      required
                    />
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Overtime Hours</span>
                    </label>
                    <input
                      type="number"
                      name="overtime"
                      value={formData.overtime}
                      onChange={handleChange}
                      className="input input-bordered"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Crew Attendance</h2>
                <div className="divider my-2"></div>

                <p className="text-sm text-gray-500 mb-4">
                  Crew members will be automatically populated based on the selected crew. You can mark attendance and
                  hours for each member on the next screen.
                </p>

                <div className="alert alert-info">
                  <i className="fas fa-info-circle"></i>
                  <span>Select a crew in the General tab to manage attendance.</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Materials & Equipment Tab */}
        {activeTab === "materials" && (
          <div className="grid grid-cols-1 gap-6">
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <div className="flex justify-between items-center">
                  <h2 className="card-title">Materials Used</h2>
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => addArrayItem("materials")}>
                    <i className="fas fa-plus mr-1"></i> Add Material
                  </button>
                </div>
                <div className="divider my-2"></div>

                {formData.materials.map((material, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-base-300">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Material Name</span>
                      </label>
                      <input
                        type="text"
                        value={material.name}
                        onChange={(e) => handleArrayChange("materials", index, "name", e.target.value)}
                        placeholder="e.g., Concrete"
                        className="input input-bordered"
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Quantity</span>
                      </label>
                      <input
                        type="text"
                        value={material.quantity}
                        onChange={(e) => handleArrayChange("materials", index, "quantity", e.target.value)}
                        placeholder="e.g., 12 yards"
                        className="input input-bordered"
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Cost ($)</span>
                      </label>
                      <input
                        type="text"
                        value={material.cost}
                        onChange={(e) => handleArrayChange("materials", index, "cost", e.target.value)}
                        placeholder="e.g., 1440"
                        className="input input-bordered"
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Supplier</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={material.supplier}
                          onChange={(e) => handleArrayChange("materials", index, "supplier", e.target.value)}
                          placeholder="e.g., Metro Concrete"
                          className="input input-bordered flex-1"
                        />
                        {formData.materials.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-square btn-outline btn-error"
                            onClick={() => removeArrayItem("materials", index)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <div className="flex justify-between items-center">
                  <h2 className="card-title">Equipment Used</h2>
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => addArrayItem("equipment")}>
                    <i className="fas fa-plus mr-1"></i> Add Equipment
                  </button>
                </div>
                <div className="divider my-2"></div>

                {formData.equipment.map((equipment, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4 pb-4 border-b border-base-300">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Equipment Name</span>
                      </label>
                      <input
                        type="text"
                        value={equipment.name}
                        onChange={(e) => handleArrayChange("equipment", index, "name", e.target.value)}
                        placeholder="e.g., Excavator"
                        className="input input-bordered"
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Hours Used</span>
                      </label>
                      <input
                        type="text"
                        value={equipment.hours}
                        onChange={(e) => handleArrayChange("equipment", index, "hours", e.target.value)}
                        placeholder="e.g., 4"
                        className="input input-bordered"
                        required
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Operator</span>
                      </label>
                      <input
                        type="text"
                        value={equipment.operator}
                        onChange={(e) => handleArrayChange("equipment", index, "operator", e.target.value)}
                        placeholder="e.g., John Smith"
                        className="input input-bordered"
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Condition</span>
                      </label>
                      <div className="flex gap-2">
                        <select
                          value={equipment.condition}
                          onChange={(e) => handleArrayChange("equipment", index, "condition", e.target.value)}
                          className="select select-bordered flex-1"
                        >
                          <option value="Good">Good</option>
                          <option value="Fair">Fair</option>
                          <option value="Poor">Poor</option>
                          <option value="Needs Repair">Needs Repair</option>
                        </select>
                        {formData.equipment.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-square btn-outline btn-error"
                            onClick={() => removeArrayItem("equipment", index)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Safety & Quality Tab */}
        {activeTab === "safety" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Safety Information</h2>
                <div className="divider my-2"></div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Incidents</span>
                  </label>
                  <input
                    type="text"
                    name="safety.incidents"
                    value={formData.safety.incidents}
                    onChange={handleChange}
                    placeholder="e.g., No incidents"
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Safety Inspections</span>
                  </label>
                  <textarea
                    name="safety.inspections"
                    value={formData.safety.inspections}
                    onChange={handleChange}
                    placeholder="e.g., Daily toolbox talk completed. All PPE verified."
                    className="textarea textarea-bordered h-20"
                  ></textarea>
                </div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Hazards Identified</span>
                  </label>
                  <textarea
                    name="safety.hazards"
                    value={formData.safety.hazards}
                    onChange={handleChange}
                    placeholder="e.g., Deep excavation areas marked and barricaded."
                    className="textarea textarea-bordered h-20"
                  ></textarea>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Corrective Actions</span>
                  </label>
                  <textarea
                    name="safety.corrective"
                    value={formData.safety.corrective}
                    onChange={handleChange}
                    placeholder="e.g., None required"
                    className="textarea textarea-bordered h-20"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Quality Control</h2>
                <div className="divider my-2"></div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Quality Inspections</span>
                  </label>
                  <textarea
                    name="quality.inspections"
                    value={formData.quality.inspections}
                    onChange={handleChange}
                    placeholder="e.g., Concrete mix verified to meet specifications. Slump test performed."
                    className="textarea textarea-bordered h-20"
                  ></textarea>
                </div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Quality Issues</span>
                  </label>
                  <textarea
                    name="quality.issues"
                    value={formData.quality.issues}
                    onChange={handleChange}
                    placeholder="e.g., None"
                    className="textarea textarea-bordered h-20"
                  ></textarea>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Corrective Actions</span>
                  </label>
                  <textarea
                    name="quality.corrective"
                    value={formData.quality.corrective}
                    onChange={handleChange}
                    placeholder="e.g., None required"
                    className="textarea textarea-bordered h-20"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-lg md:col-span-2">
              <div className="card-body">
                <h2 className="card-title">Delays & Issues</h2>
                <div className="divider my-2"></div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Description</span>
                    </label>
                    <textarea
                      name="delays.description"
                      value={formData.delays.description}
                      onChange={handleChange}
                      placeholder="e.g., Material delivery delayed by 30 minutes"
                      className="textarea textarea-bordered h-20"
                    ></textarea>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Impact</span>
                    </label>
                    <textarea
                      name="delays.impact"
                      value={formData.delays.impact}
                      onChange={handleChange}
                      placeholder="e.g., Minimal - team adjusted work sequence"
                      className="textarea textarea-bordered h-20"
                    ></textarea>
                  </div>

                  <div className="form-control">
                    <label className="label">
                      <span className="label-text">Resolution</span>
                    </label>
                    <textarea
                      name="delays.resolution"
                      value={formData.delays.resolution}
                      onChange={handleChange}
                      placeholder="e.g., Coordinated with supplier for earlier delivery tomorrow"
                      className="textarea textarea-bordered h-20"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Other Tab */}
        {activeTab === "other" && (
          <div className="grid grid-cols-1 gap-6">
            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <div className="flex justify-between items-center">
                  <h2 className="card-title">Site Visitors</h2>
                  <button type="button" className="btn btn-sm btn-outline" onClick={() => addArrayItem("visitors")}>
                    <i className="fas fa-plus mr-1"></i> Add Visitor
                  </button>
                </div>
                <div className="divider my-2"></div>

                {formData.visitors.map((visitor, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-base-300">
                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Visitor Name</span>
                      </label>
                      <input
                        type="text"
                        value={visitor.name}
                        onChange={(e) => handleArrayChange("visitors", index, "name", e.target.value)}
                        placeholder="e.g., Robert Chen"
                        className="input input-bordered"
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Company</span>
                      </label>
                      <input
                        type="text"
                        value={visitor.company}
                        onChange={(e) => handleArrayChange("visitors", index, "company", e.target.value)}
                        placeholder="e.g., Oakridge Development"
                        className="input input-bordered"
                      />
                    </div>

                    <div className="form-control">
                      <label className="label">
                        <span className="label-text">Purpose</span>
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={visitor.purpose}
                          onChange={(e) => handleArrayChange("visitors", index, "purpose", e.target.value)}
                          placeholder="e.g., Client inspection"
                          className="input input-bordered flex-1"
                        />
                        {formData.visitors.length > 1 && (
                          <button
                            type="button"
                            className="btn btn-square btn-outline btn-error"
                            onClick={() => removeArrayItem("visitors", index)}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Additional Notes</h2>
                <div className="divider my-2"></div>

                <div className="form-control">
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Any additional notes or observations..."
                    className="textarea textarea-bordered h-32"
                  ></textarea>
                </div>
              </div>
            </div>

            <div className="card bg-base-100 shadow-lg">
              <div className="card-body">
                <h2 className="card-title">Photos & Documents</h2>
                <div className="divider my-2"></div>

                <div className="form-control mb-4">
                  <label className="label">
                    <span className="label-text">Upload Photos</span>
                  </label>
                  <input type="file" multiple accept="image/*" className="file-input file-input-bordered w-full" />
                  <p className="text-xs text-gray-500 mt-1">You can upload multiple photos. Maximum 10MB per file.</p>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Upload Documents</span>
                  </label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    className="file-input file-input-bordered w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Accepted formats: PDF, DOC, DOCX, XLS, XLSX. Maximum 10MB per file.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="flex justify-between mt-6">
          <Link href="/dashboard/daily-logs" className="btn btn-outline">
            Cancel
          </Link>
          <div className="flex gap-2">
            <button type="button" className="btn btn-outline">
              Save as Draft
            </button>
            <button type="submit" className="btn btn-primary">
              Submit Log
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
