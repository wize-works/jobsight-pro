"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { MaintenanceScheduler } from "@/components/maintenance-scheduler"

export default function MaintenanceSchedulePage() {
  const [upcomingMaintenance, setUpcomingMaintenance] = useState([
    {
      id: 1,
      equipmentId: 1,
      equipmentName: "Excavator #EX-101",
      type: "Routine",
      date: "2025-06-15",
      status: "Scheduled",
      assignedTo: "Mike Johnson",
      notes: "Regular 2-month maintenance",
    },
    {
      id: 2,
      equipmentId: 3,
      equipmentName: "Bulldozer #BD-105",
      type: "Repair",
      date: "2025-05-20",
      status: "Scheduled",
      assignedTo: "Sarah Williams",
      notes: "Complete hydraulic system repair",
    },
    {
      id: 3,
      equipmentId: 4,
      equipmentName: "Portable Generator #PG-42",
      type: "Inspection",
      date: "2025-06-30",
      status: "Scheduled",
      assignedTo: "Mike Johnson",
      notes: "Check fuel efficiency issues",
    },
    {
      id: 4,
      equipmentId: 7,
      equipmentName: "Forklift #FL-22",
      type: "Routine",
      date: "2025-06-10",
      status: "Scheduled",
      assignedTo: "Sarah Williams",
      notes: "Regular 2-month maintenance",
    },
  ])

  const [showScheduleModal, setShowScheduleModal] = useState(false)
  const [newMaintenance, setNewMaintenance] = useState({
    equipmentId: "",
    type: "Routine",
    date: "",
    assignedTo: "",
    notes: "",
  })

  const [equipment, setEquipment] = useState([
    { id: 1, name: "Excavator #EX-101" },
    { id: 2, name: "Cement Mixer #CM-203" },
    { id: 3, name: "Bulldozer #BD-105" },
    { id: 4, name: "Portable Generator #PG-42" },
    { id: 5, name: "Jackhammer Set #JH-12" },
    { id: 6, name: "Crane #CR-007" },
    { id: 7, name: "Forklift #FL-22" },
    { id: 8, name: "Power Drill Set #PD-35" },
  ])

  const [technicians, setTechnicians] = useState([
    { id: 1, name: "Mike Johnson" },
    { id: 2, name: "Sarah Williams" },
    { id: 3, name: "David Lee" },
    { id: 4, name: "Emma Garcia" },
  ])

  const handleScheduleMaintenance = (e: React.FormEvent) => {
    e.preventDefault()

    const selectedEquipment = equipment.find((e) => e.id.toString() === newMaintenance.equipmentId)

    if (selectedEquipment) {
      const maintenance = {
        id: upcomingMaintenance.length + 1,
        equipmentId: Number.parseInt(newMaintenance.equipmentId),
        equipmentName: selectedEquipment.name,
        type: newMaintenance.type,
        date: newMaintenance.date,
        status: "Scheduled" as const,
        assignedTo: newMaintenance.assignedTo,
        notes: newMaintenance.notes,
      }

      setUpcomingMaintenance([...upcomingMaintenance, maintenance])

      setNewMaintenance({
        equipmentId: "",
        type: "Routine",
        date: "",
        assignedTo: "",
        notes: "",
      })

      setShowScheduleModal(false)
    }
  }

  const handleCompleteMaintenance = (id: number) => {
    setUpcomingMaintenance(
      upcomingMaintenance.map((item) => (item.id === id ? { ...item, status: "Completed" as const } : item)),
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Maintenance Schedule</h1>
          <p className="text-base-content/70">Manage equipment maintenance and repairs</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowScheduleModal(true)}>
          <i className="fas fa-calendar-plus mr-2"></i>
          Schedule Maintenance
        </button>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Maintenance Calendar</h2>
          <MaintenanceScheduler />
        </div>
      </div>

      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Upcoming Maintenance</h2>
          <div className="overflow-x-auto">
            <table className="table table-zebra w-full">
              <thead>
                <tr>
                  <th>Equipment</th>
                  <th>Type</th>
                  <th>Date</th>
                  <th>Assigned To</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {upcomingMaintenance.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <Link href={`/dashboard/equipment/${item.equipmentId}`} className="link link-hover">
                        {item.equipmentName}
                      </Link>
                    </td>
                    <td>
                      <div
                        className={`badge ${
                          item.type === "Routine"
                            ? "badge-primary"
                            : item.type === "Repair"
                              ? "badge-warning"
                              : "badge-info"
                        }`}
                      >
                        {item.type}
                      </div>
                    </td>
                    <td>{item.date}</td>
                    <td>{item.assignedTo}</td>
                    <td>
                      <div
                        className={`badge ${
                          item.status === "Scheduled"
                            ? "badge-primary"
                            : item.status === "Completed"
                              ? "badge-success"
                              : "badge-error"
                        }`}
                      >
                        {item.status}
                      </div>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        {item.status === "Scheduled" && (
                          <button className="btn btn-ghost btn-xs" onClick={() => handleCompleteMaintenance(item.id)}>
                            <i className="fas fa-check text-success"></i>
                          </button>
                        )}
                        <button className="btn btn-ghost btn-xs">
                          <i className="fas fa-edit"></i>
                        </button>
                        <button className="btn btn-ghost btn-xs text-error">
                          <i className="fas fa-trash"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Schedule Maintenance Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Schedule Maintenance</h3>
            <form onSubmit={handleScheduleMaintenance} className="mt-4 space-y-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text">Equipment</span>
                </label>
                <select
                  value={newMaintenance.equipmentId}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, equipmentId: e.target.value })}
                  className="select select-bordered"
                  required
                >
                  <option value="">Select equipment</option>
                  {equipment.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Maintenance Type</span>
                </label>
                <select
                  value={newMaintenance.type}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, type: e.target.value })}
                  className="select select-bordered"
                  required
                >
                  <option value="Routine">Routine</option>
                  <option value="Repair">Repair</option>
                  <option value="Inspection">Inspection</option>
                  <option value="Overhaul">Overhaul</option>
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Date</span>
                </label>
                <input
                  type="date"
                  value={newMaintenance.date}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, date: e.target.value })}
                  className="input input-bordered"
                  required
                />
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Assign To</span>
                </label>
                <select
                  value={newMaintenance.assignedTo}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, assignedTo: e.target.value })}
                  className="select select-bordered"
                  required
                >
                  <option value="">Select technician</option>
                  {technicians.map((tech) => (
                    <option key={tech.id} value={tech.name}>
                      {tech.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text">Notes</span>
                </label>
                <textarea
                  value={newMaintenance.notes}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, notes: e.target.value })}
                  className="textarea textarea-bordered"
                  placeholder="Additional information"
                ></textarea>
              </div>

              <div className="modal-action">
                <button type="button" className="btn btn-ghost" onClick={() => setShowScheduleModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
