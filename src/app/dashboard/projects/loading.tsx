import React from "react";

// Projects page loading skeleton using DaisyUI classes
export default function ProjectsLoading({ viewType = "grid" }: { viewType?: "grid" | "list" }) {
    return (
        <div>
            {/* Header */}
            <div className="flex justify-between mb-6">
                <div>
                    <div className="h-8 w-48 bg-base-300 animate-pulse rounded mb-2"></div>
                    <div className="h-4 w-64 bg-base-300 animate-pulse rounded"></div>
                </div>
                <div className="h-12 w-32 bg-base-300 animate-pulse rounded-lg"></div>
            </div>

            {/* Project Statistics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="stat bg-base-100 shadow">
                        <div className="stat-title">
                            <div className="h-4 w-24 bg-base-300 animate-pulse rounded"></div>
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
            <div className="card bg-base-100 shadow-lg mb-6 rounded-lg">
                <div className="card-body p-2">
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="h-12 w-full bg-base-300 animate-pulse rounded-lg"></div>
                        <div className="h-12 w-full bg-base-300 animate-pulse rounded-lg"></div>
                        <div className="h-12 w-full bg-base-300 animate-pulse rounded-lg"></div>
                        <div className="h-12 w-full bg-base-300 animate-pulse rounded-lg"></div>
                        <div className="h-12 w-24 bg-base-300 animate-pulse rounded-lg"></div>
                    </div>
                </div>
            </div>

            {/* Projects Grid/List */}
            {viewType === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, index) => (
                        <div key={index} className="card bg-base-100 shadow-lg">
                            <div className="card-body p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="h-6 w-32 bg-base-300 animate-pulse rounded"></div>
                                    <div className="h-6 w-16 bg-base-300 animate-pulse rounded-full"></div>
                                </div>
                                <div className="h-4 w-24 bg-base-300 animate-pulse rounded mb-2"></div>
                                <div className="flex items-center mb-2">
                                    <div className="h-4 w-4 bg-base-300 animate-pulse rounded mr-2"></div>
                                    <div className="h-4 w-40 bg-base-300 animate-pulse rounded"></div>
                                </div>
                                <div className="flex items-center mb-2">
                                    <div className="h-4 w-4 bg-base-300 animate-pulse rounded mr-2"></div>
                                    <div className="h-4 w-36 bg-base-300 animate-pulse rounded"></div>
                                </div>
                                <div className="flex items-center mb-3">
                                    <div className="h-4 w-4 bg-base-300 animate-pulse rounded mr-2"></div>
                                    <div className="h-4 w-20 bg-base-300 animate-pulse rounded"></div>
                                </div>
                                <div className="mt-3">
                                    <div className="flex justify-between mb-1">
                                        <div className="h-3 w-12 bg-base-300 animate-pulse rounded"></div>
                                        <div className="h-3 w-8 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                    <div className="w-full bg-base-300 rounded-full h-2">
                                        <div className="h-2 w-1/3 bg-base-300 animate-pulse rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card bg-base-100 shadow-lg">
                    <div className="card-body p-0">
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th><div className="h-4 w-24 bg-base-300 animate-pulse rounded"></div></th>
                                        <th><div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div></th>
                                        <th><div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div></th>
                                        <th><div className="h-4 w-20 bg-base-300 animate-pulse rounded"></div></th>
                                        <th><div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div></th>
                                        <th><div className="h-4 w-20 bg-base-300 animate-pulse rounded"></div></th>
                                        <th><div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div></th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {Array.from({ length: 8 }).map((_, index) => (
                                        <tr key={index}>
                                            <td><div className="h-4 w-32 bg-base-300 animate-pulse rounded"></div></td>
                                            <td><div className="h-4 w-24 bg-base-300 animate-pulse rounded"></div></td>
                                            <td><div className="h-6 w-16 bg-base-300 animate-pulse rounded-full"></div></td>
                                            <td><div className="h-4 w-28 bg-base-300 animate-pulse rounded"></div></td>
                                            <td><div className="h-4 w-20 bg-base-300 animate-pulse rounded"></div></td>
                                            <td>
                                                <div className="w-full bg-base-300 rounded-full h-2">
                                                    <div className="h-2 w-1/3 bg-base-300 animate-pulse rounded-full"></div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    <div className="h-6 w-6 bg-base-300 animate-pulse rounded"></div>
                                                    <div className="h-6 w-6 bg-base-300 animate-pulse rounded"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
