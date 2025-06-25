import { createServerClient } from "./supabase"
import type { Database } from "@/types/supabase"
import type { SupabaseClient } from "@supabase/supabase-js"
import { v4 as uuidv4 } from "uuid"

// Generic type for database tables
type Tables = Database["public"]["Tables"]
type TableName = keyof Tables

// Query builder types
interface JoinConfig {
    table: string;
    type?: 'left' | 'inner' | 'right'; // default to left
    on?: Record<string, string>; // { foreign_key: "main_table.primary_key" } - Optional for Supabase relationships
    select?: string[]; // fields to include from joined table
    alias?: string; // alias for the joined data in results
    where?: Record<string, any>; // additional filters for joined table
}

interface AggregateConfig {
    function: 'count' | 'sum' | 'avg' | 'max' | 'min';
    table: string;
    column?: string; // not needed for count
    alias: string; // name in the result set
    where?: Record<string, any>; // filter conditions for the aggregate
}

interface OrderByConfig {
    column: string;
    ascending?: boolean;
}

interface QueryBuilderConfig {
    from: string; // main table
    select?: string[]; // fields from main table
    joins?: JoinConfig[];
    aggregates?: AggregateConfig[];
    where?: Record<string, any>;
    orderBy?: OrderByConfig;
    limit?: number;
    page?: number;
}

// Update the withBusinessId function to also include tracking fields
function withBusinessId<T extends Record<string, any>>(
    data: T,
    businessId: string,
    userId?: string,
): T & { business_id: string; created_by?: string; updated_by?: string } {
    const result: T & { business_id: string; created_by?: string; updated_by?: string } = {
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

export async function fetchByBusiness<T extends TableName>(
    table: T,
    businessId: string,
    columns: Array<keyof Tables[T]["Row"]> | "*" = "*",
    options?: {
        filter?: Record<string, any>
        orderBy?: { column: keyof Tables[T]["Row"]; ascending?: boolean }
        limit?: number
        page?: number
        client?: SupabaseClient<Database>
    }
): Promise<{
    data: Tables[T]["Row"][] | null
    error: Error | null
}> {
    const supabase = options?.client || createServerClient()
    if (!supabase) {
        return { data: null, error: new Error("Supabase client not initialized") }
    }

    const columnList: string = Array.isArray(columns) ? (columns as string[]).join(",") : columns;

    let query = supabase.from(table).select(columnList).eq("business_id", businessId)

    if (options?.filter) {
        // Handle special or conditions first

        if (options.filter.or) {
            const orConditions = options.filter.or;
            if (Array.isArray(orConditions)) {
                const orFilterString = orConditions
                    .map((condition) => {
                        const [key, value] = Object.entries(condition)[0];
                        if (value === null) {
                            return `${key}.is.null`; // ✅ this is crucial
                        } else if (typeof value === 'object') {
                            const [op, opValue] = Object.entries(value)[0];
                            return `${key}.${op}.${opValue}`;
                        } else {
                            return `${key}.eq.${value}`;
                        }
                    })
                    .join(',');
                console.log("Constructed OR clause:", orFilterString);
                query = query.or(orFilterString);
            }

            // Remove `or` from the main filter

            const { or, ...restFilter } = options.filter;
            options.filter = restFilter;
        }

        // Process remaining filters
        for (const [key, value] of Object.entries(options.filter)) {
            if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                for (const [op, opValue] of Object.entries(value)) {
                    switch (op) {
                        case "eq":
                            query = query.eq(key, opValue);
                            break;
                        case "neq":
                            if (opValue === null) {
                                query = query.not(key, "is", null);
                            } else {
                                query = query.neq(key, opValue);
                            }
                            break;
                        case "gt":
                            query = query.gt(key, opValue);
                            break;
                        case "gte":
                            query = query.gte(key, opValue);
                            break;
                        case "lt":
                            query = query.lt(key, opValue);
                            break;
                        case "lte":
                            query = query.lte(key, opValue);
                            break;
                        case "ilike":
                            query = query.ilike(key, String(opValue));
                            break;
                        case "in":
                            query = query.in(key, opValue as readonly any[]);
                            break;
                        default:
                            console.warn(`Unsupported operator: ${op}`);
                    }
                }
            } else {
                if (value === null) {
                    query = query.is(key, null);
                } else {
                    query = query.eq(key, value);
                }
            }
        }
    }

    if (options?.orderBy) {
        query = query.order(options.orderBy.column as string, {
            ascending: options.orderBy.ascending,
        })
    }

    if (options?.limit) {
        query = query.limit(options.limit)
        if (options.page && options.page > 1) {
            query = query.range((options.page - 1) * options.limit, options.page * options.limit - 1)
        }
    }

    const { data, error } = await query
    return { data: data as unknown as Tables[T]["Row"][], error }
}

export async function fetchWithBusinessById<T extends TableName>(
    table: T,
    id: string,
    businessId: string,
    columns: Array<keyof Tables[T]["Row"]> | "*" = "*",
    options?: {
        client?: SupabaseClient<Database>
    }
): Promise<{
    data: Tables[T]["Row"] | null
    error: Error | null
}> {
    const supabase = options?.client || createServerClient()
    if (!supabase) {
        return { data: null, error: new Error("Supabase client not initialized") }
    }

    const columnList: string = Array.isArray(columns) ? (columns as string[]).join(",") : columns;

    const { data, error } = await supabase
        .from(table)
        .select(columnList)
        .eq("id", id)
        .eq("business_id", businessId)
        .single()

    return { data: data as unknown as Tables[T]["Row"], error }
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
    const supabase = options?.client || createServerClient()
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
    const supabase = options?.client || createServerClient()
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
    const supabase = options?.client || createServerClient()
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

// New query builder function for complex relational queries
export async function fetchByBusinessWithQuery(
    businessId: string,
    config: QueryBuilderConfig,
    options?: {
        client?: SupabaseClient<Database>
    }
): Promise<{
    data: any[] | null
    error: Error | null
}> {
    const supabase = options?.client || createServerClient()
    if (!supabase) {
        return { data: null, error: new Error("Supabase client not initialized") }
    }

    try {
        const { from, select = ["*"], joins = [], aggregates = [], where, orderBy, limit, page } = config

        // Build the select clause with relationships using Supabase syntax
        let selectClause = select.join(",")

        // Handle joins using Supabase's relationship syntax
        if (joins.length > 0) {
            const joinSelects = joins.map(join => {
                const { table: joinTable, select: joinSelect = ["*"], alias } = join
                const joinFields = joinSelect.join(",")
                return `${alias || joinTable}(${joinFields})`
            })

            selectClause = `${selectClause},${joinSelects.join(",")}`
        }

        let query = supabase.from(from).select(selectClause).eq("business_id", businessId)

        // Apply main table filters
        if (where) {
            for (const [key, value] of Object.entries(where)) {
                if (typeof value === "object" && value !== null && !Array.isArray(value)) {
                    for (const [op, opValue] of Object.entries(value)) {
                        switch (op) {
                            case "eq":
                                query = query.eq(key, opValue);
                                break;
                            case "neq":
                                if (opValue === null) {
                                    query = query.not(key, "is", null);
                                } else {
                                    query = query.neq(key, opValue);
                                }
                                break;
                            case "gt":
                                query = query.gt(key, opValue);
                                break;
                            case "gte":
                                query = query.gte(key, opValue);
                                break;
                            case "lt":
                                query = query.lt(key, opValue);
                                break;
                            case "lte":
                                query = query.lte(key, opValue);
                                break;
                            case "ilike":
                                query = query.ilike(key, String(opValue));
                                break;
                            case "in":
                                query = query.in(key, opValue as readonly any[]);
                                break;
                            default:
                                console.warn(`Unsupported operator: ${op}`);
                        }
                    }
                } else {
                    if (value === null) {
                        query = query.is(key, null);
                    } else {
                        query = query.eq(key, value);
                    }
                }
            }
        }

        // Apply ordering
        if (orderBy) {
            query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true })
        }

        // Apply pagination
        if (limit) {
            query = query.limit(limit)
            if (page && page > 1) {
                query = query.range((page - 1) * limit, page * limit - 1)
            }
        }

        // Execute main query
        const { data: mainData, error: mainError } = await query

        if (mainError) {
            return { data: null, error: mainError }
        }

        // Handle aggregates separately if needed
        if (aggregates.length > 0 && mainData) {
            const aggregatePromises = aggregates.map(async (agg) => {
                const { function: func, table: aggTable, column, alias, where: aggWhere } = agg

                let aggQuery = supabase.from(aggTable)
                    .select("*", { count: "exact", head: func === "count" })
                    .eq("business_id", businessId)

                // Apply aggregate-specific filters
                if (aggWhere) {
                    for (const [key, value] of Object.entries(aggWhere)) {
                        aggQuery = aggQuery.eq(key, value)
                    }
                }

                if (func === "count") {
                    const { count } = await aggQuery
                    return { alias, value: count || 0 }
                } else {
                    // For other aggregates, fetch data and compute client-side
                    const { data: aggData } = await aggQuery
                    if (!aggData || !column) return { alias, value: 0 }

                    switch (func) {
                        case "sum":
                            return { alias, value: aggData.reduce((sum, item) => sum + (item[column] || 0), 0) }
                        case "avg":
                            const total = aggData.reduce((sum, item) => sum + (item[column] || 0), 0)
                            return { alias, value: aggData.length > 0 ? total / aggData.length : 0 }
                        case "max":
                            return { alias, value: Math.max(...aggData.map(item => item[column] || 0)) }
                        case "min":
                            return { alias, value: Math.min(...aggData.map(item => item[column] || 0)) }
                        default:
                            return { alias, value: 0 }
                    }
                }
            })

            const aggregateResults = await Promise.all(aggregatePromises)
            // Add aggregate results to main data
            const enhancedData = mainData.map((item: any) => {
                const aggregateData = aggregateResults.reduce((acc, { alias, value }) => {
                    acc[alias] = value
                    return acc
                }, {} as Record<string, any>)

                return { ...item, ...aggregateData }
            })

            return { data: enhancedData, error: null }
        } return { data: mainData, error: null }
    } catch (error) {
        console.error("Error in fetchByBusinessWithQuery:", error)
        return { data: null, error: error as Error }
    }
}
