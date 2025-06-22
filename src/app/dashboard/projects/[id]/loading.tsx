import React from "react";

// Project detail page loading skeleton using DaisyUI classes
export default function ProjectDetailLoading() {
    return (
        <div>
            {/* Header Navigation and Actions */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-32 bg-base-300 animate-pulse rounded-lg"></div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="h-10 w-20 bg-base-300 animate-pulse rounded-lg"></div>
                    <div className="h-10 w-24 bg-base-300 animate-pulse rounded-lg"></div>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="card bg-base-100 shadow-sm">
                        <div className="card-body p-4">
                            <div className="flex items-center gap-2">
                                <div className="h-10 w-10 bg-base-300 animate-pulse rounded-full mr-4"></div>
                                <div className="flex flex-col flex-1">
                                    <div className="h-5 w-32 bg-base-300 animate-pulse rounded mb-1"></div>
                                    <div className="h-3 w-24 bg-base-300 animate-pulse rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2">
                    {/* Project Details Card */}
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex flex-col justify-start items-start gap-2 mb-4">
                                    <div className="flex justify-start items-start gap-6">
                                        <div className="h-8 w-48 bg-base-300 animate-pulse rounded"></div>
                                        <div className="h-6 w-16 bg-base-300 animate-pulse rounded-full"></div>
                                    </div>
                                    <div className="mb-4">
                                        <div className="h-4 w-24 bg-base-300 animate-pulse rounded mb-2"></div>
                                        <div className="h-4 w-32 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-start gap-2">
                                    <div className="text-base-content/70 mt-1">
                                        <div className="h-6 w-40 bg-base-300 animate-pulse rounded mb-2"></div>
                                        <div className="h-4 w-48 bg-base-300 animate-pulse rounded mb-1"></div>
                                        <div className="h-4 w-36 bg-base-300 animate-pulse rounded mb-2"></div>
                                        <div className="h-4 w-44 bg-base-300 animate-pulse rounded mb-1"></div>
                                        <div className="h-4 w-40 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="divider my-4"></div>
                            <div className="h-6 w-32 bg-base-300 animate-pulse rounded mb-4"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="mb-4">
                                        <div className="h-3 w-20 bg-base-300 animate-pulse rounded mb-1"></div>
                                        <div className="h-4 w-24 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                    <div className="mb-1 flex flex-col justify-between">
                                        <div className="h-4 w-16 bg-base-300 animate-pulse rounded mb-2"></div>
                                        <div className="flex items-center gap-2">
                                            <div className="h-6 w-32 bg-base-300 animate-pulse rounded-full mr-2"></div>
                                            <div className="h-6 w-6 bg-base-300 animate-pulse rounded"></div>
                                        </div>
                                    </div>
                                    <div className="flex justify-start gap-2 mb-6">
                                        <div className="h-6 w-20 bg-base-300 animate-pulse rounded"></div>
                                        <div className="h-6 w-20 bg-base-300 animate-pulse rounded"></div>
                                        <div className="h-6 w-20 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                </div>
                                <div>
                                    {Array.from({ length: 3 }).map((_, index) => (
                                        <div key={index} className="mb-4">
                                            <div className="h-3 w-20 bg-base-300 animate-pulse rounded mb-1"></div>
                                            <div className="h-4 w-24 bg-base-300 animate-pulse rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <div className="h-4 w-20 bg-base-300 animate-pulse rounded mb-2"></div>
                                <div className="h-4 w-full bg-base-300 animate-pulse rounded"></div>
                                <div className="h-4 w-3/4 bg-base-300 animate-pulse rounded mt-1"></div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="tabs tabs-box mb-6">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="tab">
                                <div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div>
                            </div>
                        ))}
                    </div>

                    {/* Milestones Card */}
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <div className="h-6 w-20 bg-base-300 animate-pulse rounded"></div>
                                <div className="h-8 w-28 bg-base-300 animate-pulse rounded-lg"></div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th><div className="h-4 w-20 bg-base-300 animate-pulse rounded"></div></th>
                                            <th><div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div></th>
                                            <th><div className="h-4 w-12 bg-base-300 animate-pulse rounded"></div></th>
                                            <th><div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: 3 }).map((_, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <div className="h-4 w-32 bg-base-300 animate-pulse rounded mb-1"></div>
                                                    <div className="h-3 w-48 bg-base-300 animate-pulse rounded"></div>
                                                </td>
                                                <td><div className="h-4 w-20 bg-base-300 animate-pulse rounded"></div></td>
                                                <td><div className="h-6 w-16 bg-base-300 animate-pulse rounded-full"></div></td>
                                                <td><div className="h-6 w-6 bg-base-300 animate-pulse rounded"></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Recent Tasks Card */}
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <div className="h-6 w-24 bg-base-300 animate-pulse rounded"></div>
                                <div className="h-8 w-20 bg-base-300 animate-pulse rounded-lg"></div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th><div className="h-4 w-12 bg-base-300 animate-pulse rounded"></div></th>
                                            <th><div className="h-4 w-20 bg-base-300 animate-pulse rounded"></div></th>
                                            <th><div className="h-4 w-12 bg-base-300 animate-pulse rounded"></div></th>
                                            <th><div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div></th>
                                            <th><div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: 3 }).map((_, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <div className="h-4 w-28 bg-base-300 animate-pulse rounded mb-1"></div>
                                                    <div className="h-3 w-36 bg-base-300 animate-pulse rounded"></div>
                                                </td>
                                                <td><div className="h-4 w-20 bg-base-300 animate-pulse rounded"></div></td>
                                                <td><div className="h-6 w-16 bg-base-300 animate-pulse rounded-full"></div></td>
                                                <td>
                                                    <div className="w-full bg-base-300 rounded-full h-2">
                                                        <div className="h-2 w-1/3 bg-base-300 animate-pulse rounded-full"></div>
                                                    </div>
                                                </td>
                                                <td><div className="h-6 w-6 bg-base-300 animate-pulse rounded"></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    {/* Project Progress Card */}
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="h-6 w-32 bg-base-300 animate-pulse rounded mb-4"></div>
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="h-4 w-24 bg-base-300 animate-pulse rounded"></div>
                                    <div className="h-4 w-8 bg-base-300 animate-pulse rounded"></div>
                                </div>
                                <div className="h-2 w-full bg-base-300 animate-pulse rounded-full"></div>
                            </div>
                            <div className="stats stats-vertical shadow">
                                <div className="stat">
                                    <div className="stat-title">
                                        <div className="h-3 w-20 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                    <div className="stat-value text-lg">
                                        <div className="h-6 w-24 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                    <div className="stat-desc">
                                        <div className="h-3 w-32 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                </div>
                                <div className="stat">
                                    <div className="stat-title">
                                        <div className="h-3 w-28 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                    <div className="stat-value text-lg">
                                        <div className="h-6 w-8 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                    <div className="stat-desc">
                                        <div className="h-3 w-24 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Client Contacts Card */}
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="h-6 w-28 bg-base-300 animate-pulse rounded mb-4"></div>
                            {Array.from({ length: 2 }).map((_, index) => (
                                <div key={index} className={index > 0 ? "mt-4 pt-4 border-t" : ""}>
                                    <div className="h-4 w-32 bg-base-300 animate-pulse rounded mb-2"></div>
                                    <div className="h-3 w-20 bg-base-300 animate-pulse rounded mb-2"></div>
                                    <div className="h-3 w-40 bg-base-300 animate-pulse rounded mb-2"></div>
                                    <div className="h-3 w-32 bg-base-300 animate-pulse rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Assigned Crews Card */}
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <div className="h-6 w-28 bg-base-300 animate-pulse rounded"></div>
                                <div className="h-8 w-20 bg-base-300 animate-pulse rounded-lg"></div>
                            </div>
                            {Array.from({ length: 2 }).map((_, index) => (
                                <div key={index} className="mb-3">
                                    <div className="h-4 w-24 bg-base-300 animate-pulse rounded mb-1"></div>
                                    <div className="h-3 w-36 bg-base-300 animate-pulse rounded"></div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Weather Widget Skeleton */}
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="h-6 w-20 bg-base-300 animate-pulse rounded mb-4"></div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-8 w-8 bg-base-300 animate-pulse rounded-full"></div>
                                <div className="text-right">
                                    <div className="h-8 w-16 bg-base-300 animate-pulse rounded mb-1"></div>
                                    <div className="h-3 w-20 bg-base-300 animate-pulse rounded"></div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <div className="h-3 w-16 bg-base-300 animate-pulse rounded mb-1"></div>
                                    <div className="h-4 w-12 bg-base-300 animate-pulse rounded"></div>
                                </div>
                                <div>
                                    <div className="h-3 w-16 bg-base-300 animate-pulse rounded mb-1"></div>
                                    <div className="h-4 w-8 bg-base-300 animate-pulse rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
