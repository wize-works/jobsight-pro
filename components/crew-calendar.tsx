"use client"

import { useState } from "react"

interface CalendarEvent {
  id: number
  title: string
  description: string
  start: string
  end: string
  location: string | null
  type: "project" | "maintenance" | "training" | "leave"
}

interface CrewCalendarProps {
  crewId: number
  initialDate?: Date
}

export function CrewCalendar({ crewId, initialDate = new Date() }: CrewCalendarProps) {
  const [currentDate, setCurrentDate] = useState(initialDate)
  const [events, setEvents] = useState<CalendarEvent[]>([
    {
      id: 1,
      title: "Riverside Apartments",
      description: "Foundation work",
      start: "2025-05-20T08:00:00",
      end: "2025-05-20T17:00:00",
      location: "123 Riverside Dr",
      type: "project",
    },
    {
      id: 2,
      title: "Equipment Maintenance",
      description: "Regular maintenance for crew equipment",
      start: "2025-05-22T13:00:00",
      end: "2025-05-22T15:00:00",
      location: "Main Warehouse",
      type: "maintenance",
    },
    {
      id: 3,
      title: "Safety Training",
      description: "Mandatory safety training session",
      start: "2025-05-24T09:00:00",
      end: "2025-05-24T12:00:00",
      location: "Training Room",
      type: "training",
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

    return events.filter((event) => event.start.startsWith(dateString))
  }

  // Get day cell background color based on the event type
  const getDayColor = (events: CalendarEvent[]) => {
    if (events.length === 0) return ""

    // Priority: project > maintenance > training > leave
    if (events.some((e) => e.type === "project")) return "bg-primary bg-opacity-10"
    if (events.some((e) => e.type === "maintenance")) return "bg-secondary bg-opacity-10"
    if (events.some((e) => e.type === "training")) return "bg-accent bg-opacity-10"
    if (events.some((e) => e.type === "leave")) return "bg-error bg-opacity-10"

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
                event.type === "project"
                  ? "bg-primary text-primary-content"
                  : event.type === "maintenance"
                    ? "bg-secondary text-secondary-content"
                    : event.type === "training"
                      ? "bg-accent text-accent-content"
                      : "bg-error text-error-content"
              }`}
              title={`${event.title} - ${event.description}`}
            >
              {event.title}
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
          <span className="text-xs">Project</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-secondary"></div>
          <span className="text-xs">Maintenance</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-accent"></div>
          <span className="text-xs">Training</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-error"></div>
          <span className="text-xs">Leave</span>
        </div>
      </div>
    </div>
  )
}
