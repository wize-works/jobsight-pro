"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { CrewCalendar } from "@/components/crew-calendar"

export default function CrewSchedulePage({ params }: { params: { id: string } }) {
  const crewId = Number.parseInt(params.id)

  const [crew, setCrew] = useState({
    id: crewId,
    name: "Team Alpha",
    type: "General Construction",
  })

  const [showAddEventModal, setShowAddEventModal] = useState(false)
  const [newEvent, setNewEvent] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "08:00",
    endTime: "17:00",
    location: "",
    type: "project",
  })

  const handleAddEvent = (e: React.FormEvent) => {
    e.preventDefault()

    // In a real app, this would save to a database
    console.log("New event:", newEvent)

    // Close modal
    setShowAddEventModal(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{crew.name} Schedule</h1>
          <p className="text-base-content/70">Manage crew assignments and availability</p>
        </div>
        <div className="flex gap-2">
          <Link href={`/dashboard/crews/${crewId}`} className="btn btn-ghost">
            <i className="fas fa-arrow-left mr-2"></i>
            Back to Crew
          </Link>
          <button className="btn btn-primary" onClick={() => setShowAddEventModal(true)}>
            <i className="fas fa-plus mr-2"></i>
            Add Event
          </button>
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <CrewCalendar crewId={crewId} />
        </div>
      </div>

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Add Schedule Event</h3>
            <form onSubmit={handleAddEvent} className="mt-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Event Title</span>
                </label>
                <input
                  type="text"
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="input input-bordered"
                  placeholder="Project name or event title"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Description</span>
                </label>
                <textarea
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="textarea textarea-bordered"
                  placeholder="Brief description of work or event"
                ></textarea>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Date</span>
                  </label>
                  <input
                    type="date"
                    value={newEvent.date}
                    onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                    className="input input-bordered"
                    required
                  />
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Type</span>
                  </label>
                  <select
                    value={newEvent.type}
                    onChange={(e) => setNewEvent({ ...newEvent, type: e.target.value })}
                    className="select select-bordered"
                    required
                  >
                    <option value="project">Project Work</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="training">Training</option>
                    <option value="leave">Leave/Time Off</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Start Time</span>
                  </label>
                  <input
                    type="time"
                    value={newEvent.startTime}
                    onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
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
                    value={newEvent.endTime}
                    onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
                    className="input input-bordered"
                    required
                  />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Location</span>
                </label>
                <input
                  type="text"
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="input input-bordered"
                  placeholder="Work site or event location"
                />
              </div>

              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setShowAddEventModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
