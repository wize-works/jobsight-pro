import { fetchByBusiness, insertWithBusiness, updateWithBusinessCheck, deleteWithBusinessCheck } from "./db"
import type { Database } from "@/types/supabase"
import { getSupabaseBrowserClient } from "./supabase"

export type DailyLog = Database["public"]["Tables"]["daily_logs"]["Row"]
export type DailyLogInsert = Database["public"]["Tables"]["daily_logs"]["Insert"]
export type DailyLogUpdate = Database["public"]["Tables"]["daily_logs"]["Update"]

// Fetch all daily logs for a business
export async function getDailyLogs(businessId: string) {
  return await fetchByBusiness("daily_logs", businessId, "*", {
    orderBy: { column: "date", ascending: false },
  })
}

// Fetch a single daily log by ID
export async function getDailyLogById(id: string, businessId: string) {
  const { data, error } = await fetchByBusiness("daily_logs", businessId, "*", {
    filter: { id },
  })

  return {
    data: data?.[0] || null,
    error,
  }
}

// Create a new daily log
export async function createDailyLog(dailyLog: Omit<DailyLogInsert, "business_id">, businessId: string) {
  return await insertWithBusiness("daily_logs", dailyLog, businessId)
}

// Update an existing daily log
export async function updateDailyLog(id: string, dailyLog: DailyLogUpdate, businessId: string) {
  return await updateWithBusinessCheck("daily_logs", id, dailyLog, businessId)
}

// Delete a daily log
export async function deleteDailyLog(id: string, businessId: string) {
  return await deleteWithBusinessCheck("daily_logs", id, businessId)
}

// Get daily logs by project
export async function getDailyLogsByProject(projectId: string, businessId: string) {
  return await fetchByBusiness("daily_logs", businessId, "*", {
    filter: { project_id: projectId },
    orderBy: { column: "date", ascending: false },
  })
}

// Get daily logs by crew
export async function getDailyLogsByCrew(crewId: string, businessId: string) {
  return await fetchByBusiness("daily_logs", businessId, "*", {
    filter: { crew_id: crewId },
    orderBy: { column: "date", ascending: false },
  })
}

// Get daily logs by date range
export async function getDailyLogsByDateRange(startDate: string, endDate: string, businessId: string) {
  const supabase = getSupabaseBrowserClient()
  if (!supabase) {
    return { data: null, error: new Error("Supabase client not initialized") }
  }

  return await supabase
    .from("daily_logs")
    .select("*")
    .eq("business_id", businessId)
    .gte("date", startDate)
    .lte("date", endDate)
    .order("date", { ascending: false })
}
