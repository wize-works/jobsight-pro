export default function MediaLibraryLoading() {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="h-8 w-48 bg-base-300 animate-pulse rounded"></div>
                <div className="h-10 w-24 bg-base-300 animate-pulse rounded"></div>
            </div>

            <div className="bg-base-100 p-4 rounded-lg shadow-sm mb-6">
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="h-12 w-full bg-base-300 animate-pulse rounded"></div>
                    <div className="flex gap-2">
                        <div className="h-12 w-40 bg-base-300 animate-pulse rounded"></div>
                        <div className="h-12 w-40 bg-base-300 animate-pulse rounded"></div>
                        <div className="h-12 w-20 bg-base-300 animate-pulse rounded"></div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                    <div key={i} className="card bg-base-100 shadow-sm">
                        <div className="h-40 bg-base-300 animate-pulse"></div>
                        <div className="card-body p-4">
                            <div className="h-5 w-3/4 bg-base-300 animate-pulse rounded mb-2"></div>
                            <div className="h-4 w-1/2 bg-base-300 animate-pulse rounded mb-1"></div>
                            <div className="h-4 w-1/3 bg-base-300 animate-pulse rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
