export default function TasksListLoading() {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <div className="h-8 w-16 bg-base-300 animate-pulse rounded mb-2"></div>
                    <div className="h-4 w-48 bg-base-300 animate-pulse rounded"></div>
                </div>
                <div className="h-10 w-36 bg-base-300 animate-pulse rounded-lg"></div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {[...Array(4)].map((_, index) => (
                    <div key={index} className="stat bg-base-100 shadow-lg">
                        <div className="stat-figure">
                            <div className="h-12 w-12 bg-base-300 animate-pulse rounded-full"></div>
                        </div>
                        <div className="stat-title">
                            <div className="h-4 w-20 bg-base-300 animate-pulse rounded"></div>
                        </div>
                        <div className="stat-value">
                            <div className="h-8 w-12 bg-base-300 animate-pulse rounded"></div>
                        </div>
                        <div className="stat-desc">
                            <div className="h-3 w-32 bg-base-300 animate-pulse rounded"></div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filters and Search */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body p-2">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="h-12 w-full lg:w-80 bg-base-300 animate-pulse rounded-lg"></div>
                        <div className="h-12 w-full lg:w-40 bg-base-300 animate-pulse rounded-lg"></div>
                        <div className="h-12 w-full lg:w-40 bg-base-300 animate-pulse rounded-lg"></div>
                        <div className="h-12 w-full lg:w-40 bg-base-300 animate-pulse rounded-lg"></div>
                        <div className="h-12 w-full lg:w-40 bg-base-300 animate-pulse rounded-lg"></div>
                        <div className="h-12 w-24 bg-base-300 animate-pulse rounded-lg"></div>
                    </div>
                </div>
            </div>

            {/* Task Table */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <div className="overflow-x-auto">
                        <table className="table table-zebra">
                            <thead>
                                <tr>
                                    <th>
                                        <div className="h-4 w-20 bg-base-300 animate-pulse rounded"></div>
                                    </th>
                                    <th>
                                        <div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div>
                                    </th>
                                    <th>
                                        <div className="h-4 w-20 bg-base-300 animate-pulse rounded"></div>
                                    </th>
                                    <th>
                                        <div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div>
                                    </th>
                                    <th>
                                        <div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div>
                                    </th>
                                    <th>
                                        <div className="h-4 w-20 bg-base-300 animate-pulse rounded"></div>
                                    </th>
                                    <th>
                                        <div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div>
                                    </th>
                                    <th>
                                        <div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...Array(8)].map((_, index) => (
                                    <tr key={index}>
                                        <td>
                                            <div className="space-y-2">
                                                <div className="h-4 w-32 bg-base-300 animate-pulse rounded"></div>
                                                <div className="h-3 w-24 bg-base-300 animate-pulse rounded"></div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="h-4 w-20 bg-base-300 animate-pulse rounded"></div>
                                        </td>
                                        <td>
                                            <div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div>
                                        </td>
                                        <td>
                                            <div className="h-6 w-16 bg-base-300 animate-pulse rounded-full"></div>
                                        </td>
                                        <td>
                                            <div className="h-6 w-16 bg-base-300 animate-pulse rounded-full"></div>
                                        </td>
                                        <td>
                                            <div className="space-y-1">
                                                <div className="h-2 w-full bg-base-300 animate-pulse rounded-full"></div>
                                                <div className="h-3 w-12 bg-base-300 animate-pulse rounded"></div>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="h-3 w-16 bg-base-300 animate-pulse rounded"></div>
                                        </td>
                                        <td>
                                            <div className="flex gap-2">
                                                <div className="h-8 w-8 bg-base-300 animate-pulse rounded"></div>
                                                <div className="h-8 w-8 bg-base-300 animate-pulse rounded"></div>
                                                <div className="h-8 w-8 bg-base-300 animate-pulse rounded"></div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
