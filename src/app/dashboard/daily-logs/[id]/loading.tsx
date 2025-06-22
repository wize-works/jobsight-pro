import React from "react";

// Daily log detail page loading skeleton using DaisyUI classes
export default function DailyLogDetailLoading() {
    return (
        <div>
            {/* Navigation Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="h-10 w-32 bg-base-300 animate-pulse rounded-lg"></div>
                <div className="flex gap-2">
                    <div className="h-10 w-20 bg-base-300 animate-pulse rounded-lg"></div>
                    <div className="h-10 w-24 bg-base-300 animate-pulse rounded-lg"></div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Detail Section */}
                <div className="lg:col-span-2">
                    {/* Basic Information Card */}
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="h-6 w-40 bg-base-300 animate-pulse rounded mb-4"></div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="mb-4">
                                        <div className="h-4 w-16 bg-base-300 animate-pulse rounded mb-2"></div>
                                        <div className="h-5 w-32 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                    <div className="mb-4">
                                        <div className="h-4 w-12 bg-base-300 animate-pulse rounded mb-2"></div>
                                        <div className="h-5 w-24 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                    <div className="mb-4">
                                        <div className="h-4 w-20 bg-base-300 animate-pulse rounded mb-2"></div>
                                        <div className="h-5 w-28 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-4">
                                        <div className="h-4 w-20 bg-base-300 animate-pulse rounded mb-2"></div>
                                        <div className="h-5 w-16 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                    <div className="mb-4">
                                        <div className="h-4 w-16 bg-base-300 animate-pulse rounded mb-2"></div>
                                        <div className="h-5 w-20 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                    <div className="mb-4">
                                        <div className="h-4 w-14 bg-base-300 animate-pulse rounded mb-2"></div>
                                        <div className="h-5 w-32 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Work Details Card */}
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="h-6 w-32 bg-base-300 animate-pulse rounded mb-4"></div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <div className="mb-4">
                                        <div className="h-4 w-28 bg-base-300 animate-pulse rounded mb-2"></div>
                                        <div className="h-4 w-full bg-base-300 animate-pulse rounded mb-1"></div>
                                        <div className="h-4 w-3/4 bg-base-300 animate-pulse rounded mb-1"></div>
                                        <div className="h-4 w-1/2 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                    <div className="mb-4">
                                        <div className="h-4 w-24 bg-base-300 animate-pulse rounded mb-2"></div>
                                        <div className="h-4 w-full bg-base-300 animate-pulse rounded mb-1"></div>
                                        <div className="h-4 w-2/3 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                </div>
                                <div>
                                    <div className="mb-4">
                                        <div className="h-4 w-20 bg-base-300 animate-pulse rounded mb-2"></div>
                                        <div className="h-4 w-32 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                    <div className="mb-4">
                                        <div className="h-4 w-16 bg-base-300 animate-pulse rounded mb-2"></div>
                                        <div className="h-4 w-40 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                    <div className="mb-4">
                                        <div className="h-4 w-20 bg-base-300 animate-pulse rounded mb-2"></div>
                                        <div className="h-4 w-28 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs Section */}
                    <div className="tabs tabs-box mb-6">
                        {Array.from({ length: 4 }).map((_, index) => (
                            <div key={index} className="tab">
                                <div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div>
                            </div>
                        ))}
                    </div>

                    {/* Tab Content - Materials */}
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
                                            <th><div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div></th>
                                            <th><div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div></th>
                                            <th><div className="h-4 w-12 bg-base-300 animate-pulse rounded"></div></th>
                                            <th><div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div></th>
                                            <th><div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: 4 }).map((_, index) => (
                                            <tr key={index}>
                                                <td><div className="h-4 w-24 bg-base-300 animate-pulse rounded"></div></td>
                                                <td><div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div></td>
                                                <td><div className="h-4 w-8 bg-base-300 animate-pulse rounded"></div></td>
                                                <td><div className="h-4 w-12 bg-base-300 animate-pulse rounded"></div></td>
                                                <td><div className="h-6 w-6 bg-base-300 animate-pulse rounded"></div></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Equipment Table */}
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <div className="h-6 w-24 bg-base-300 animate-pulse rounded"></div>
                                <div className="h-8 w-28 bg-base-300 animate-pulse rounded-lg"></div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="table table-zebra">
                                    <thead>
                                        <tr>
                                            <th><div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div></th>
                                            <th><div className="h-4 w-12 bg-base-300 animate-pulse rounded"></div></th>
                                            <th><div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div></th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Array.from({ length: 3 }).map((_, index) => (
                                            <tr key={index}>
                                                <td><div className="h-4 w-32 bg-base-300 animate-pulse rounded"></div></td>
                                                <td><div className="h-4 w-8 bg-base-300 animate-pulse rounded"></div></td>
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
                    {/* Summary Card */}
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="h-6 w-20 bg-base-300 animate-pulse rounded mb-4"></div>

                            <div className="stats stats-vertical shadow">
                                <div className="stat">
                                    <div className="stat-title">
                                        <div className="h-3 w-20 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                    <div className="stat-value">
                                        <div className="h-6 w-12 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                </div>
                                <div className="stat">
                                    <div className="stat-title">
                                        <div className="h-3 w-16 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                    <div className="stat-value">
                                        <div className="h-6 w-8 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                </div>
                                <div className="stat">
                                    <div className="stat-title">
                                        <div className="h-3 w-24 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                    <div className="stat-value">
                                        <div className="h-6 w-16 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Notes Card */}
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="h-6 w-16 bg-base-300 animate-pulse rounded mb-4"></div>
                            <div className="h-4 w-full bg-base-300 animate-pulse rounded mb-2"></div>
                            <div className="h-4 w-3/4 bg-base-300 animate-pulse rounded mb-2"></div>
                            <div className="h-4 w-1/2 bg-base-300 animate-pulse rounded"></div>
                        </div>
                    </div>

                    {/* Weather Card */}
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
