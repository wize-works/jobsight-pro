"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

export interface CalendarProps extends React.InputHTMLAttributes<HTMLInputElement> {
  date?: Date
  onSelect?: (date: Date | undefined) => void
}

function Calendar({ className, date, onSelect, ...props }: CalendarProps) {
  const [selectedDate, setSelectedDate] = React.useState<string>(date ? formatDateForInput(date) : "")

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSelectedDate(value)

    if (value && isValidDateString(value)) {
      const newDate = new Date(value + "T00:00:00")
      onSelect?.(newDate)
    } else {
      onSelect?.(undefined)
    }
  }

  React.useEffect(() => {
    if (date) {
      setSelectedDate(formatDateForInput(date))
    }
  }, [date])

  return (
    <input
      type="date"
      className={cn(
        "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      value={selectedDate}
      onChange={handleDateChange}
      {...props}
    />
  )
}

// Helper functions
function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0]
}

function isValidDateString(dateString: string): boolean {
  const regex = /^\d{4}-\d{2}-\d{2}$/
  if (!regex.test(dateString)) return false

  const date = new Date(dateString + "T00:00:00")
  return !isNaN(date.getTime())
}

export { Calendar }
