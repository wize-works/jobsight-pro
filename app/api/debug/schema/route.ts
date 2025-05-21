import { createServerClient } from "@/lib/supabase"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client not initialized" }, { status: 500 })
    }

    // Get the businesses table structure
    const { data: businessesColumns, error: businessesError } = await supabase.from("businesses").select("*").limit(1)

    if (businessesError) {
      return NextResponse.json({ error: businessesError.message }, { status: 500 })
    }

    // Get the column names from the first row
    const columnNames = businessesColumns && businessesColumns.length > 0 ? Object.keys(businessesColumns[0]) : []

    return NextResponse.json({
      businessesColumns: columnNames,
      businessesData: businessesColumns,
    })
  } catch (error) {
    console.error("Error fetching schema:", error)
    return NextResponse.json({ error: "Failed to fetch schema" }, { status: 500 })
  }
}
