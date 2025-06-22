export default function MapLoading() {
    return (
        <div className="h-[calc(100vh-4rem)] w-full relative bg-base-200">
            {/* Map skeleton background */}
            <div className="w-full h-full bg-gradient-to-br from-green-100 to-blue-100 animate-pulse"></div>

            {/* Header overlay skeleton */}
            <div className="absolute top-4 left-20 z-50 max-w-50">
                <div className="card bg-base-100/90 backdrop-blur shadow-lg">
                    <div className="card-body p-3">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                            <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                        </div>
                        <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse mt-1"></div>
                    </div>
                </div>
            </div>

            {/* Legend skeleton */}
            <div className="absolute top-4 right-4 z-50">
                <div className="card bg-base-100/90 backdrop-blur shadow-lg">
                    <div className="card-body p-3">
                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse mb-3"></div>
                        <div className="space-y-2">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-gray-200 rounded-full animate-pulse"></div>
                                    <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Loading indicator in center */}
            <div className="absolute inset-0 flex items-center justify-center z-40">
                <div className="text-center">
                    <div className="loading loading-spinner loading-lg text-primary mb-4"></div>
                    <p className="text-base-content/70">
                        Loading map and getting your location...
                    </p>
                </div>
            </div>

            {/* Map marker skeletons */}
            <div className="absolute top-1/3 left-1/3 z-30">
                <div className="w-4 h-4 bg-primary rounded-full animate-bounce"></div>
            </div>
            <div className="absolute top-1/2 right-1/3 z-30">
                <div className="w-4 h-4 bg-accent rounded-full animate-bounce delay-100"></div>
            </div>
            <div className="absolute bottom-1/3 left-1/2 z-30">
                <div className="w-4 h-4 bg-secondary rounded-full animate-bounce delay-200"></div>
            </div>
        </div>
    );
}
