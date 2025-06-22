export default function NotificationsLoading() {
    return (
        <div className="min-h-screen bg-base-100">
            <div className="container mx-auto px-4 py-6 max-w-4xl">
                {/* Header skeleton */}
                <div className="flex justify-between items-center mb-6">
                    <div className="h-8 bg-gray-200 rounded w-40 animate-pulse"></div>
                    <div className="flex gap-2">
                        {/* Filter buttons skeleton */}
                        <div className="join">
                            <div className="h-8 bg-gray-200 rounded-l w-16 animate-pulse"></div>
                            <div className="h-8 bg-gray-200 rounded-r w-20 animate-pulse"></div>
                        </div>
                        {/* Mark all read button skeleton */}
                        <div className="h-8 bg-gray-200 rounded w-28 animate-pulse"></div>
                    </div>
                </div>

                {/* Notification cards skeleton */}
                <div className="space-y-2">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="card bg-base-100 border border-base-300">
                            <div className="card-body p-4">
                                <div className="flex items-start gap-4">
                                    {/* Icon skeleton */}
                                    <div className="mt-1">
                                        <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
                                    </div>

                                    {/* Content skeleton */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="h-4 bg-gray-200 rounded w-48 animate-pulse"></div>
                                                {i % 3 === 0 && ( // Show "New" badge on some items
                                                    <div className="h-4 bg-gray-200 rounded w-8 animate-pulse"></div>
                                                )}
                                            </div>
                                            <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                                        </div>

                                        {/* Message skeleton */}
                                        <div className="space-y-1 mb-3">
                                            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                                            <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                        </div>

                                        {/* Actions skeleton */}
                                        <div className="flex justify-between items-center">
                                            <div className="flex gap-2">
                                                <div className="h-6 bg-gray-200 rounded w-12 animate-pulse"></div>
                                                {i % 2 === 0 && ( // Show mark as read on some items
                                                    <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                                                )}
                                            </div>
                                            <div className="h-5 bg-gray-200 rounded w-24 animate-pulse"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
