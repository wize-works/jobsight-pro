export default function TasksLoading() {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <div className="h-8 bg-base-300 rounded w-64 mb-2"></div>
                    <div className="h-4 bg-base-300 rounded w-96"></div>
                </div>
                <div className="h-10 bg-base-300 rounded w-40"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="stat bg-base-100 shadow-sm">
                        <div className="h-6 bg-base-300 rounded w-24 mb-2"></div>
                        <div className="h-8 bg-base-300 rounded w-16 mb-1"></div>
                        <div className="h-4 bg-base-300 rounded w-20"></div>
                    </div>
                ))}
            </div>

            <div className="card bg-base-100 shadow-sm mb-6">
                <div className="card-body">
                    <div className="h-6 bg-base-300 rounded w-24 mb-4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="h-10 bg-base-300 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="card bg-base-100 shadow-sm">
                <div className="card-body">
                    <div className="h-6 bg-base-300 rounded w-24 mb-4"></div>
                    <div className="h-64 bg-base-300 rounded"></div>
                </div>
            </div>
        </div>
    )
}
