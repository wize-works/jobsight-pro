export default function TaskDetailLoading() {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <div className="h-8 bg-base-300 rounded w-64 mb-2"></div>
                    <div className="h-4 bg-base-300 rounded w-40"></div>
                </div>
                <div className="flex gap-2">
                    <div className="h-10 bg-base-300 rounded w-32"></div>
                    <div className="h-10 bg-base-300 rounded w-24"></div>
                </div>
            </div>

            <div className="h-12 bg-base-300 rounded mb-6"></div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="h-6 bg-base-300 rounded w-40 mb-4"></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <div className="h-4 bg-base-300 rounded w-24 mb-2"></div>
                                    <div className="h-4 bg-base-300 rounded w-32 mb-4"></div>
                                    <div className="h-4 bg-base-300 rounded w-24 mb-2"></div>
                                    <div className="h-4 bg-base-300 rounded w-32 mb-4"></div>
                                    <div className="h-4 bg-base-300 rounded w-24 mb-2"></div>
                                    <div className="h-4 bg-base-300 rounded w-32 mb-4"></div>
                                </div>
                                <div>
                                    <div className="h-4 bg-base-300 rounded w-24 mb-2"></div>
                                    <div className="h-4 bg-base-300 rounded w-32 mb-4"></div>
                                    <div className="h-4 bg-base-300 rounded w-24 mb-2"></div>
                                    <div className="h-4 bg-base-300 rounded w-32 mb-4"></div>
                                    <div className="h-4 bg-base-300 rounded w-24 mb-2"></div>
                                    <div className="h-4 bg-base-300 rounded w-32 mb-4"></div>
                                </div>
                            </div>
                            <div>
                                <div className="h-4 bg-base-300 rounded w-24 mb-2"></div>
                                <div className="h-4 bg-base-300 rounded w-full"></div>
                                <div className="h-4 bg-base-300 rounded w-full mt-1"></div>
                                <div className="h-4 bg-base-300 rounded w-3/4 mt-1"></div>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <div className="h-6 bg-base-300 rounded w-32"></div>
                                <div className="h-8 bg-base-300 rounded w-24"></div>
                            </div>
                            <div className="space-y-4">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="bg-base-200 p-4 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="h-4 bg-base-300 rounded w-32"></div>
                                            <div className="h-4 bg-base-300 rounded w-24"></div>
                                        </div>
                                        <div className="h-4 bg-base-300 rounded w-full"></div>
                                        <div className="h-4 bg-base-300 rounded w-3/4 mt-1"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <div className="h-6 bg-base-300 rounded w-32"></div>
                                <div className="h-8 bg-base-300 rounded w-24"></div>
                            </div>
                            <div className="h-48 bg-base-300 rounded"></div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="h-6 bg-base-300 rounded w-40 mb-4"></div>
                            <div className="h-4 bg-base-300 rounded w-full mb-2"></div>
                            <div className="h-2 bg-base-300 rounded w-full mb-4"></div>

                            <div className="h-32 bg-base-300 rounded mb-4"></div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <div className="h-6 bg-base-300 rounded w-32"></div>
                                <div className="h-8 bg-base-300 rounded w-24"></div>
                            </div>
                            <div className="h-32 bg-base-300 rounded"></div>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <div className="h-6 bg-base-300 rounded w-40"></div>
                                <div className="h-8 bg-base-300 rounded w-24"></div>
                            </div>
                            <div className="h-32 bg-base-300 rounded"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
