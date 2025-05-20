"use client"

import { useState } from "react"

interface MaintenanceEvent {
  id: number
  equipmentId: number
  equipmentName: string
  type: string
  date: string
  status: "Scheduled" | "Completed" | "Overdue"
  assignedTo: string | null
  notes: string
}

interface MaintenanceSchedulerProps {
  initialDate?: Date
}

export function MaintenanceScheduler({ initialDate = new Date() }: MaintenanceSchedulerProps) {
  const [currentDate, setCurrentDate] = useState(initialDate)
  const [events, setEvents] = useState<MaintenanceEvent[]>([
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

  // Get current month and year
  const currentMonthYear = currentDate.toLocaleString("default", { month: "long", year: "numeric" })

  // Generate days for the current month
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()

  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay()

  // Move to previous month
  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  // Move to next month
  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  // Function to check if day has events
  const getEventsForDay = (day: number) => {
    const dateToCheck = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
    const dateString = dateToCheck.toISOString().split("T")[0]

    return events.filter((event) => event.date === dateString)
  }

  // Get day cell background color based on the event type
  const getDayColor = (events: MaintenanceEvent[]) => {
    if (events.length === 0) return ""

    // Priority: overdue > scheduled > completed
    if (events.some((e) => e.status === "Overdue")) return "bg-error bg-opacity-10"
    if (events.some((e) => e.status === "Scheduled")) return "bg-primary bg-opacity-10"
    if (events.some((e) => e.status === "Completed")) return "bg-success bg-opacity-10"

    return ""
  }

  // Create calendar grid
  const calendarDays = []

  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(<div key={`empty-${i}`} className="p-2 border border-base-300 bg-base-200"></div>)
  }

  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const eventsForDay = getEventsForDay(day)
    const isToday =
      new Date().getDate() === day &&
      new Date().getMonth() === currentDate.getMonth() &&
      new Date().getFullYear() === currentDate.getFullYear()

    calendarDays.push(
      <div
        key={`day-${day}`}
        className={`p-2 border border-base-300 min-h-24 ${getDayColor(eventsForDay)} ${isToday ? "ring-2 ring-primary ring-inset" : ""}`}
      >
        <div className="text-right font-medium mb-1">{day}</div>
        <div className="space-y-1">
          {eventsForDay.map((event) => (
            <div
              key={event.id}
              className={`text-xs truncate p-1 rounded ${
                event.status === "Scheduled"
                  ? "bg-primary text-primary-content"
                  : event.status === "Completed"
                    ? "bg-success text-success-content"
                    : "bg-error text-error-content"
              }`}
              title={`${event.equipmentName} - ${event.type}`}
            >
              {event.equipmentName}
            </div>
          ))}
        </div>
      </div>,
    )
  }

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <button className="btn btn-ghost btn-sm" onClick={goToPreviousMonth}>
          <i className="fas fa-chevron-left"></i>
        </button>
        <h3 className="text-lg font-semibold">{currentMonthYear}</h3>
        <button className="btn btn-ghost btn-sm" onClick={goToNextMonth}>
          <i className="fas fa-chevron-right"></i>
        </button>
      </div>

      <div className="grid grid-cols-7 gap-0">
        {/* Day headers */}
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="p-2 text-center font-medium bg-base-300">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {calendarDays}
      </div>

      <div className="mt-4 flex gap-3">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary"></div>
          <span className="text-xs">Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-success"></div>
          <span className="text-xs">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-error"></div>
          <span className="text-xs">Overdue</span>
        </div>
      </div>
    </div>
  )
}
