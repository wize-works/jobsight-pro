export default function MediaDetailLoading() {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                    <div className="h-10 w-10 bg-base-300 animate-pulse rounded"></div>
                    <div className="h-8 w-48 bg-base-300 animate-pulse rounded"></div>
                </div>
                <div className="flex gap-2">
                    <div className="h-10 w-24 bg-base-300 animate-pulse rounded"></div>
                    <div className="h-10 w-24 bg-base-300 animate-pulse rounded"></div>
                    <div className="h-10 w-24 bg-base-300 animate-pulse rounded"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Media preview skeleton */}
                <div className="lg:col-span-2">
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="bg-base-300 animate-pulse rounded-lg min-h-[400px]"></div>
                        </div>
                    </div>
                </div>

                {/* Media details skeleton */}
                <div>
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="h-7 w-24 bg-base-300 animate-pulse rounded mb-4"></div>

                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="flex justify-between mb-4">
                                    <div className="h-5 w-24 bg-base-300 animate-pulse rounded"></div>
                                    <div className="h-5 w-32 bg-base-300 animate-pulse rounded"></div>
                                </div>
                            ))}

                            <div className="h-5 w-24 bg-base-300 animate-pulse rounded mb-2 mt-4"></div>
                            <div className="h-20 bg-base-300 animate-pulse rounded mb-4"></div>

                            <div className="h-5 w-24 bg-base-300 animate-pulse rounded mb-2"></div>
                            <div className="flex gap-2">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="h-6 w-16 bg-base-300 animate-pulse rounded"></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm mt-6">
                        <div className="card-body">
                            <div className="h-7 w-32 bg-base-300 animate-pulse rounded mb-4"></div>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="card bg-base-300 animate-pulse h-40"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
