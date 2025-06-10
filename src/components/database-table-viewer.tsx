
import { useState, useEffect } from "react"
import { createServerClient } from "@/lib/supabase"

interface DatabaseTableViewerProps {
    tableName: string
    schema?: string
}

// Server action for fetching table data
async function fetchTableData(tableName: string, schema: string, page: number, pageSize: number) {
    'use server'
    const supabase = createServerClient()
    if (!supabase) {
        throw new Error("Failed to initialize Supabase client")
    }

    try {
        // Get total count
        const { count, error: countError } = await supabase
            .from(`${schema}.${tableName}`)
            .select("*", { count: "exact", head: true })

        if (countError) throw countError

        // Get data with pagination
        const { data, error: dataError } = await supabase
            .from(`${schema}.${tableName}`)
            .select("*")
            .range((page - 1) * pageSize, page * pageSize - 1)

        if (dataError) throw dataError

        if (!data || data.length === 0) {
            // Try to get columns from table info
            const { data: columnData, error: columnError } = await supabase.rpc("get_table_columns", {
                table_name: tableName,
                schema_name: schema,
            })

            if (columnError) throw columnError

            return {
                data: [],
                columns: columnData ? columnData.map((col: any) => col.column_name) : [],
                totalCount: count || 0,
            }
        }

        return {
            data,
            columns: Object.keys(data[0]),
            totalCount: count || 0,
        }
    } catch (error: any) {
        throw new Error(error.message || "Failed to fetch table data")
    }
}

export default function DatabaseTableViewer({ tableName, schema = "jobsight" }: DatabaseTableViewerProps) {
    const [data, setData] = useState<any[]>([])
    const [columns, setColumns] = useState<string[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [page, setPage] = useState(1)
    const [pageSize, setPageSize] = useState(10)
    const [totalCount, setTotalCount] = useState(0)

    // Function to load data using the server action
    const loadTableData = async () => {
        setIsLoading(true)
        setError(null)

        try {
            const result = await fetchTableData(tableName, schema, page, pageSize)
            setData(result.data)
            setColumns(result.columns)
            setTotalCount(result.totalCount)
        } catch (err: any) {
            console.error("Error fetching table data:", err)
            setError(err.message || "Failed to fetch table data")
        } finally {
            setIsLoading(false)
        }
    }

    // Effect to load data
    useEffect(() => {
        loadTableData()
    }, [tableName, schema, page, pageSize])

    const formatCellValue = (value: any) => {
        if (value === null || value === undefined) return "NULL"
        if (typeof value === "object") return JSON.stringify(value)
        return String(value)
    }

    const totalPages = Math.ceil(totalCount / pageSize)

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h3 className="font-semibold text-lg">
                    {schema}.{tableName}
                </h3>
                <div className="flex items-center gap-2">
                    <select
                        className="select select-bordered select-sm"
                        value={pageSize}
                        onChange={(e) => {
                            setPageSize(Number(e.target.value))
                            setPage(1)
                        }}
                    >
                        <option value="10">10 rows</option>
                        <option value="25">25 rows</option>
                        <option value="50">50 rows</option>
                        <option value="100">100 rows</option>
                    </select>
                    <button className="btn btn-sm btn-outline" onClick={() => loadTableData()}>
                        <i className="fas fa-sync-alt"></i>
                    </button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex justify-center py-8">
                    <span className="loading loading-spinner loading-lg"></span>
                </div>
            ) : error ? (
                <div className="alert alert-error">
                    <i className="fas fa-exclamation-circle"></i>
                    <span>{error}</span>
                </div>
            ) : data.length === 0 ? (
                <div className="alert">
                    <i className="fas fa-info-circle"></i>
                    <span>No data found in this table.</span>
                </div>
            ) : (
                <>
                    <div className="overflow-x-auto">
                        <table className="table table-sm w-full">
                            <thead>
                                <tr>
                                    {columns.map((column) => (
                                        <th key={column}>{column}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, rowIndex) => (
                                    <tr key={rowIndex}>
                                        {columns.map((column) => (
                                            <td key={`${rowIndex}-${column}`} className="truncate max-w-xs">
                                                {formatCellValue(row[column])}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {totalPages > 1 && (
                        <div className="flex justify-between items-center">
                            <span className="text-sm">
                                Showing {(page - 1) * pageSize + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount} rows
                            </span>
                            <div className="join">
                                <button className="join-item btn btn-sm" disabled={page === 1} onClick={() => setPage(1)}>
                                    <i className="fas fa-angle-double-left"></i>
                                </button>
                                <button
                                    className="join-item btn btn-sm"
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                    <i className="fas fa-angle-left"></i>
                                </button>
                                <button className="join-item btn btn-sm">
                                    Page {page} of {totalPages}
                                </button>
                                <button
                                    className="join-item btn btn-sm"
                                    disabled={page === totalPages}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                >
                                    <i className="fas fa-angle-right"></i>
                                </button>
                                <button
                                    className="join-item btn btn-sm"
                                    disabled={page === totalPages}
                                    onClick={() => setPage(totalPages)}
                                >
                                    <i className="fas fa-angle-double-right"></i>
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
