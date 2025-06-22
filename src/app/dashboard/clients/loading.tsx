import React from "react";

// Clients list page loading skeleton using DaisyUI classes
export default function ClientsListLoading({ viewType = "grid" }: { viewType?: "grid" | "list" }) {
    return (
        <>
            {/* Header */}
            <div className="flex justify-between mb-4">
                <div className="h-8 w-48 bg-base-300 animate-pulse rounded"></div>
                <div className="h-12 w-32 bg-base-300 animate-pulse rounded-lg"></div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="stat bg-base-100 shadow-sm">
                        <div className="stat-title text-lg">
                            <div className="h-5 w-24 bg-base-300 animate-pulse rounded"></div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="stat-value">
                                <div className="h-8 w-12 bg-base-300 animate-pulse rounded"></div>
                            </div>
                            <div className="stat-icon">
                                <div className="h-12 w-12 bg-base-300 animate-pulse rounded-full"></div>
                            </div>
                        </div>
                        <div className="stat-desc">
                            <div className="h-3 w-32 bg-base-300 animate-pulse rounded"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Search and Filters */}
            <div className="card bg-base-100 shadow-sm mb-6 rounded-lg">
                <div className="card-body p-2">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full">
                            <div className="h-12 w-full bg-base-300 animate-pulse rounded-lg"></div>
                        </div>
                        <div className="h-12 w-full bg-base-300 animate-pulse rounded-lg"></div>
                        <div className="h-12 w-full bg-base-300 animate-pulse rounded-lg"></div>
                        <div className="h-12 w-24 bg-base-300 animate-pulse rounded-lg"></div>
                    </div>
                </div>
            </div>

            {/* Content based on view type */}
            {viewType === "grid" ? (
                /* Grid View */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="card bg-base-100 shadow-sm">
                            <div className="card-body">
                                <div className="flex justify-between mb-4">
                                    <div className="flex justify-between">
                                        <div className="avatar">
                                            <div className="w-12 h-12 bg-base-300 animate-pulse rounded-full"></div>
                                        </div>
                                        <div className="ml-4">
                                            <div className="h-6 w-32 bg-base-300 animate-pulse rounded mb-2"></div>
                                            <div className="h-4 w-24 bg-base-300 animate-pulse rounded"></div>
                                        </div>
                                    </div>
                                    <div className="h-6 w-16 bg-base-300 animate-pulse rounded-full"></div>
                                </div>
                                <div className="space-y-2">
                                    <div className="h-4 w-full bg-base-300 animate-pulse rounded"></div>
                                    <div className="h-4 w-3/4 bg-base-300 animate-pulse rounded"></div>
                                    <div className="h-4 w-2/3 bg-base-300 animate-pulse rounded"></div>
                                </div>
                                <div className="card-actions justify-end mt-4">
                                    <div className="h-8 w-24 bg-base-300 animate-pulse rounded-lg"></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                /* List View */
                <div className="overflow-x-auto card bg-base-100 shadow-sm mb-6">
                    <table className="table table-zebra w-full">
                        <thead>
                            <tr>
                                <th><div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div></th>
                                <th><div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div></th>
                                <th><div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div></th>
                                <th><div className="h-4 w-12 bg-base-300 animate-pulse rounded"></div></th>
                                <th><div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div></th>
                            </tr>
                        </thead>
                        <tbody>
                            {Array.from({ length: 8 }).map((_, index) => (
                                <tr key={index}>
                                    <td>
                                        <div className="flex items-center gap-3">
                                            <div className="avatar flex">
                                                <div className="w-12 h-12 bg-base-300 animate-pulse rounded-full"></div>
                                            </div>
                                            <div>
                                                <div className="h-4 w-32 bg-base-300 animate-pulse rounded mb-1"></div>
                                                <div className="h-3 w-24 bg-base-300 animate-pulse rounded"></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="h-4 w-28 bg-base-300 animate-pulse rounded mb-1"></div>
                                        <div className="h-3 w-36 bg-base-300 animate-pulse rounded mb-1"></div>
                                        <div className="h-3 w-32 bg-base-300 animate-pulse rounded"></div>
                                    </td>
                                    <td>
                                        <div className="h-4 w-20 bg-base-300 animate-pulse rounded mb-1"></div>
                                        <div className="h-3 w-16 bg-base-300 animate-pulse rounded"></div>
                                    </td>
                                    <td>
                                        <div className="h-6 w-16 bg-base-300 animate-pulse rounded-full"></div>
                                    </td>
                                    <td>
                                        <div className="h-8 w-20 bg-base-300 animate-pulse rounded-lg"></div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </>
    );
}
