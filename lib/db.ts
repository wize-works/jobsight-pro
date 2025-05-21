import { createServerClient, getSupabaseBrowserClient } from "./supabase"
import type { Database } from "@/types/supabase"
import type { SupabaseClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

// Generic type for database tables
type Tables = Database["public"]["Tables"]
type TableName = keyof Tables

// Update the withBusinessId function to also include tracking fields
function withBusinessId<T extends Record<string, any>>(
  data: T,
  businessId: string,
  userId?: string,
): T & { business_id: string; created_by?: string; updated_by?: string } {
  const result = {
    ...data,
    business_id: businessId,
  }

  // Add tracking fields if userId is provided
  if (userId) {
    // For new records, set created_by
    if (!data.id) {
      result.created_by = userId
    }
    // Always set updated_by when a user is performing an operation
    result.updated_by = userId
  }

  return result
}

// Generic function to fetch data with business_id filter
export async function fetchByBusiness<T extends TableName>(
  table: T,
  businessId: string,
  columns = "*",
  options?: {
    filter?: Record<string, any>
    orderBy?: { column: string; ascending?: boolean }
    limit?: number
    page?: number
    client?: SupabaseClient<Database>
  },
) {
  const supabase = options?.client || getSupabaseBrowserClient()
  if (!supabase) {
    return { data: null, error: new Error("Supabase client not initialized") }
  }

  let query = supabase.from(table).select(columns).eq("business_id", businessId)

  // Apply additional filters
  if (options?.filter) {
    Object.entries(options.filter).forEach(([key, value]) => {
      query = query.eq(key, value)
    })
  }

  // Apply ordering
  if (options?.orderBy) {
    const { column, ascending = true } = options.orderBy
    query = query.order(column, { ascending })
  }

  // Apply pagination
  if (options?.limit) {
    query = query.limit(options.limit)

    if (options?.page && options.page > 1) {
      query = query.range((options.page - 1) * options.limit, options.page * options.limit - 1)
    }
  }

  return await query
}

// Update insertWithBusiness to include userId parameter
export async function insertWithBusiness<T extends TableName>(
  table: T,
  data: Tables[T]["Insert"],
  businessId: string,
  options?: {
    client?: SupabaseClient<Database>
    userId?: string
  },
) {
  const supabase = options?.client || getSupabaseBrowserClient()
  if (!supabase) {
    return { data: null, error: new Error("Supabase client not initialized") }
  }

  const dataWithBusiness = withBusinessId(data as Record<string, any>, businessId, options?.userId)

  // Generate UUID if not provided
  if (!dataWithBusiness.id) {
    dataWithBusiness.id = uuidv4()
  }

  return await supabase.from(table).insert(dataWithBusiness).select().single()
}

// Update updateWithBusinessCheck to include userId parameter
export async function updateWithBusinessCheck<T extends TableName>(
  table: T,
  id: string,
  data: Tables[T]["Update"],
  businessId: string,
  options?: {
    client?: SupabaseClient<Database>
    userId?: string
  },
) {
  const supabase = options?.client || getSupabaseBrowserClient()
  if (!supabase) {
    return { data: null, error: new Error("Supabase client not initialized") }
  }

  // First verify this record belongs to the business
  const { data: existingData, error: checkError } = await supabase
    .from(table)
    .select("id")
    .eq("id", id)
    .eq("business_id", businessId)
    .maybeSingle()

  if (checkError) {
    return { data: null, error: checkError }
  }

  if (!existingData) {
    return {
      data: null,
      error: new Error(`Record not found or does not belong to this business`),
    }
  }

  // Add updated_by if userId is provided
  const updateData = { ...data } as Record<string, any>
  if (options?.userId) {
    updateData.updated_by = options.userId
  }

  return await supabase.from(table).update(updateData).eq("id", id).eq("business_id", businessId).select().single()
}

// Generic function to delete data with business_id check
export async function deleteWithBusinessCheck<T extends TableName>(
  table: T,
  id: string,
  businessId: string,
  options?: {
    client?: SupabaseClient<Database>
  },
) {
  const supabase = options?.client || getSupabaseBrowserClient()
  if (!supabase) {
    return { data: null, error: new Error("Supabase client not initialized") }
  }

  // First verify this record belongs to the business
  const { data: existingData, error: checkError } = await supabase
    .from(table)
    .select("id")
    .eq("id", id)
    .eq("business_id", businessId)
    .maybeSingle()

  if (checkError) {
    return { data: null, error: checkError }
  }

  if (!existingData) {
    return {
      data: null,
      error: new Error(`Record not found or does not belong to this business`),
    }
  }

  return await supabase.from(table).delete().eq("id", id).eq("business_id", businessId)
}

// Server-side functions
export async function serverFetchByBusiness<T extends TableName>(
  table: T,
  businessId: string,
  columns = "*",
  options?: {
    filter?: Record<string, any>
    orderBy?: { column: string; ascending?: boolean }
    limit?: number
    page?: number
  },
) {
  const supabase = createServerClient()
  if (!supabase) {
    return { data: null, error: new Error("Supabase client not initialized") }
  }

  let query = supabase.from(table).select(columns).eq("business_id", businessId)

  // Apply additional filters
  if (options?.filter) {
    Object.entries(options.filter).forEach(([key, value]) => {
      query = query.eq(key, value)
    })
  }

  // Apply ordering
  if (options?.orderBy) {
    const { column, ascending = true } = options.orderBy
    query = query.order(column, { ascending })
  }

  // Apply pagination
  if (options?.limit) {
    query = query.limit(options.limit)

    if (options?.page && options.page > 1) {
      query = query.range((options.page - 1) * options.limit, options.page * options.limit - 1)
    }
  }

  return await query
}

// Update server-side functions as well
export async function serverInsertWithBusiness<T extends TableName>(
  table: T,
  data: Tables[T]["Insert"],
  businessId: string,
  userId?: string,
) {
  const supabase = createServerClient()
  if (!supabase) {
    return { data: null, error: new Error("Supabase client not initialized") }
  }

  const dataWithBusiness = withBusinessId(data as Record<string, any>, businessId, userId)

  // Generate UUID if not provided
  if (!dataWithBusiness.id) {
    dataWithBusiness.id = uuidv4()
  }

  return await supabase.from(table).insert(dataWithBusiness).select().single()
}

export async function serverUpdateWithBusinessCheck<T extends TableName>(
  table: T,
  id: string,
  data: Tables[T]["Update"],
  businessId: string,
  userId?: string,
) {
  const supabase = createServerClient()
  if (!supabase) {
    return { data: null, error: new Error("Supabase client not initialized") }
  }

  // First verify this record belongs to the business
  const { data: existingData, error: checkError } = await supabase
    .from(table)
    .select("id")
    .eq("id", id)
    .eq("business_id", businessId)
    .maybeSingle()

  if (checkError) {
    return { data: null, error: checkError }
  }

  if (!existingData) {
    return {
      data: null,
      error: new Error(`Record not found or does not belong to this business`),
    }
  }

  // Add updated_by if userId is provided
  const updateData = { ...data } as Record<string, any>
  if (userId) {
    updateData.updated_by = userId
  }

  return await supabase.from(table).update(updateData).eq("id", id).eq("business_id", businessId).select().single()
}

export async function serverDeleteWithBusinessCheck<T extends TableName>(table: T, id: string, businessId: string) {
  const supabase = createServerClient()
  if (!supabase) {
    return { data: null, error: new Error("Supabase client not initialized") }
  }

  // First verify this record belongs to the business
  const { data: existingData, error: checkError } = await supabase
    .from(table)
    .select("id")
    .eq("id", id)
    .eq("business_id", businessId)
    .maybeSingle()

  if (checkError) {
    return { data: null, error: checkError }
  }

  if (!existingData) {
    return {
      data: null,
      error: new Error(`Record not found or does not belong to this business`),
    }
  }

  return await supabase.from(table).delete().eq("id", id).eq("business_id", businessId)
}
