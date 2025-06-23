export default function TaskDetailLoading() {
    return (
        <div>
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div className="h-10 w-32 bg-base-300 animate-pulse rounded-lg"></div>
                <div className="flex items-center gap-2">
                    <div className="h-10 w-20 bg-base-300 animate-pulse rounded-lg"></div>
                    <div className="h-10 w-24 bg-base-300 animate-pulse rounded-lg"></div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content */}
                <div className="lg:col-span-2">
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            {/* Task Title */}
                            <div className="h-8 w-48 bg-base-300 animate-pulse rounded mb-4"></div>

                            {/* Card Title */}
                            <div className="h-6 w-32 bg-base-300 animate-pulse rounded mb-4"></div>

                            {/* Task Information Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    {[...Array(6)].map((_, index) => (
                                        <div key={index}>
                                            <div className="h-4 w-24 bg-base-300 animate-pulse rounded mb-2"></div>
                                            <div className="h-5 w-32 bg-base-300 animate-pulse rounded"></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="space-y-4">
                                    {[...Array(6)].map((_, index) => (
                                        <div key={index}>
                                            <div className="h-4 w-24 bg-base-300 animate-pulse rounded mb-2"></div>
                                            <div className="h-5 w-32 bg-base-300 animate-pulse rounded"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Description Section */}
                            <div className="mt-6">
                                <div className="h-4 w-20 bg-base-300 animate-pulse rounded mb-2"></div>
                                <div className="space-y-2">
                                    <div className="h-4 w-full bg-base-300 animate-pulse rounded"></div>
                                    <div className="h-4 w-3/4 bg-base-300 animate-pulse rounded"></div>
                                    <div className="h-4 w-1/2 bg-base-300 animate-pulse rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Progress Section */}
                    <div className="card bg-base-100 shadow-lg mt-6">
                        <div className="card-body">
                            <div className="h-6 w-32 bg-base-300 animate-pulse rounded mb-4"></div>
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between items-center mb-2">
                                        <div className="h-4 w-20 bg-base-300 animate-pulse rounded"></div>
                                        <div className="h-4 w-8 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                    <div className="h-4 w-full bg-base-300 animate-pulse rounded-full"></div>
                                </div>

                                {/* Status and Priority */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="h-4 w-12 bg-base-300 animate-pulse rounded mb-2"></div>
                                        <div className="h-6 w-20 bg-base-300 animate-pulse rounded-full"></div>
                                    </div>
                                    <div>
                                        <div className="h-4 w-16 bg-base-300 animate-pulse rounded mb-2"></div>
                                        <div className="h-6 w-16 bg-base-300 animate-pulse rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-1">
                    {/* Project Information */}
                    <div className="card bg-base-100 shadow-lg mb-6">
                        <div className="card-body">
                            <div className="h-6 w-28 bg-base-300 animate-pulse rounded mb-4"></div>
                            <div className="space-y-3">
                                {[...Array(4)].map((_, index) => (
                                    <div key={index}>
                                        <div className="h-4 w-20 bg-base-300 animate-pulse rounded mb-1"></div>
                                        <div className="h-5 w-32 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Assigned Crew */}
                    <div className="card bg-base-100 shadow-lg mb-6">
                        <div className="card-body">
                            <div className="h-6 w-28 bg-base-300 animate-pulse rounded mb-4"></div>
                            <div className="space-y-3">
                                <div className="h-4 w-24 bg-base-300 animate-pulse rounded mb-1"></div>
                                <div className="h-5 w-32 bg-base-300 animate-pulse rounded"></div>
                                <div className="h-3 w-40 bg-base-300 animate-pulse rounded"></div>
                            </div>
                        </div>
                    </div>

                    {/* Activity Log */}
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <div className="h-6 w-24 bg-base-300 animate-pulse rounded mb-4"></div>
                            <div className="space-y-4">
                                {[...Array(3)].map((_, index) => (
                                    <div key={index} className="flex items-start gap-3">
                                        <div className="h-8 w-8 bg-base-300 animate-pulse rounded-full"></div>
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 w-32 bg-base-300 animate-pulse rounded"></div>
                                            <div className="h-3 w-24 bg-base-300 animate-pulse rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
