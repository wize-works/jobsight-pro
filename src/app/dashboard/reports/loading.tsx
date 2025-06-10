export default function ReportsLoading() {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="h-8 bg-base-300 rounded w-48 animate-pulse"></div>
                <div className="flex gap-2">
                    <div className="h-10 bg-base-300 rounded w-32 animate-pulse"></div>
                    <div className="h-10 bg-base-300 rounded w-40 animate-pulse"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left sidebar skeleton */}
                <div className="lg:col-span-1">
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="h-6 bg-base-300 rounded w-40 animate-pulse mb-4"></div>
                            <div className="divider"></div>
                            <div className="space-y-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-8 bg-base-300 rounded w-full animate-pulse"></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="h-6 bg-base-300 rounded w-36 animate-pulse mb-4"></div>
                            <div className="divider"></div>
                            <div className="space-y-6">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-8 bg-base-300 rounded w-full animate-pulse"></div>
                                ))}
                            </div>
                            <div className="mt-4">
                                <div className="h-10 bg-base-300 rounded w-full animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right content skeleton */}
                <div className="lg:col-span-3">
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="h-6 bg-base-300 rounded w-40 animate-pulse mb-4"></div>
                            <div className="divider"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="h-32 bg-base-300 rounded w-full animate-pulse"></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="h-6 bg-base-300 rounded w-48 animate-pulse mb-4"></div>
                            <div className="h-80 bg-base-300 rounded w-full animate-pulse mb-4"></div>
                            <div className="space-y-6 mt-4">
                                <div className="h-4 bg-base-300 rounded w-40 animate-pulse"></div>
                                <div className="h-4 bg-base-300 rounded w-full animate-pulse"></div>
                                <div className="h-4 bg-base-300 rounded w-3/4 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
