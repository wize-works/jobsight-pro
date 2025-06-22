import React from "react";

// Daily logs list page loading skeleton using DaisyUI classes
export default function DailyLogsListLoading() {
    return (
        <div className="container mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
                <div>
                    <div className="h-8 w-32 bg-base-300 animate-pulse rounded mb-2"></div>
                    <div className="h-4 w-64 bg-base-300 animate-pulse rounded"></div>
                </div>
                <div className="flex items-center space-x-6">
                    <div className="h-12 w-24 bg-base-300 animate-pulse rounded-lg"></div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="stat bg-base-100 shadow">
                        <div className="stat-title text-lg">
                            <div className="h-5 w-20 bg-base-300 animate-pulse rounded"></div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="stat-value text-3xl">
                                <div className="h-8 w-12 bg-base-300 animate-pulse rounded"></div>
                            </div>
                            <div className="stat-icon">
                                <div className="h-12 w-12 bg-base-300 animate-pulse rounded-full"></div>
                            </div>
                        </div>
                        <div className="stat-desc">
                            <div className="h-3 w-24 bg-base-300 animate-pulse rounded"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="bg-base-100 p-4 rounded-lg shadow mb-6">
                <div className="flex flex-col md:flex-row gap-6 mb-4">
                    <div className="h-12 w-full bg-base-300 animate-pulse rounded-lg"></div>
                    <div className="h-12 w-full bg-base-300 animate-pulse rounded-lg"></div>
                    <div className="h-12 w-full bg-base-300 animate-pulse rounded-lg"></div>
                    <div className="h-12 w-full bg-base-300 animate-pulse rounded-lg"></div>
                </div>
                <div className="flex flex-col md:flex-row justify-end gap-4">
                    {/* Quick Date Filters */}
                    <div className="h-8 w-16 bg-base-300 animate-pulse rounded-lg"></div>
                    <div className="h-8 w-20 bg-base-300 animate-pulse rounded-lg"></div>
                    <div className="h-8 w-24 bg-base-300 animate-pulse rounded-lg"></div>
                    <div className="h-8 w-28 bg-base-300 animate-pulse rounded-lg"></div>
                </div>
            </div>

            {/* Logs Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="card bg-base-100 shadow">
                        <div className="card-body">
                            <div className="flex items-center justify-between mb-4">
                                <div className="h-6 w-40 bg-base-300 animate-pulse rounded"></div>
                                <div className="h-8 w-24 bg-base-300 animate-pulse rounded-lg"></div>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                                <div className="h-4 w-32 bg-base-300 animate-pulse rounded"></div>
                            </div>
                            <div className="mt-2 mb-4">
                                <div className="h-6 w-20 bg-base-300 animate-pulse rounded-full inline-block mr-2"></div>
                                <div className="h-6 w-16 bg-base-300 animate-pulse rounded-full inline-block"></div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="h-4 w-28 bg-base-300 animate-pulse rounded mb-2"></div>
                                    <div className="h-4 w-full bg-base-300 animate-pulse rounded mb-1"></div>
                                    <div className="h-4 w-3/4 bg-base-300 animate-pulse rounded mb-3"></div>

                                    <div className="h-4 w-24 bg-base-300 animate-pulse rounded mb-2"></div>
                                    <div className="h-4 w-32 bg-base-300 animate-pulse rounded mb-3"></div>

                                    <div className="h-4 w-28 bg-base-300 animate-pulse rounded mb-2"></div>
                                    <div className="h-4 w-36 bg-base-300 animate-pulse rounded mb-3"></div>

                                    <div className="h-4 w-20 bg-base-300 animate-pulse rounded mb-2"></div>
                                    <div className="h-4 w-28 bg-base-300 animate-pulse rounded"></div>
                                </div>
                                <div>
                                    <div className="h-4 w-24 bg-base-300 animate-pulse rounded mb-2"></div>
                                    {Array.from({ length: 3 }).map((_, materialIndex) => (
                                        <div key={materialIndex} className="h-3 w-full bg-base-300 animate-pulse rounded mb-1"></div>
                                    ))}

                                    <div className="h-4 w-28 bg-base-300 animate-pulse rounded mb-2 mt-3"></div>
                                    {Array.from({ length: 2 }).map((_, equipIndex) => (
                                        <div key={equipIndex} className="h-3 w-full bg-base-300 animate-pulse rounded mb-1"></div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-4">
                                <div className="h-4 w-12 bg-base-300 animate-pulse rounded mb-2"></div>
                                <div className="h-4 w-full bg-base-300 animate-pulse rounded mb-1"></div>
                                <div className="h-4 w-2/3 bg-base-300 animate-pulse rounded"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
