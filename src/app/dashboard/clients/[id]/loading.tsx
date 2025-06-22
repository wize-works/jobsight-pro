export default function ClientDetailLoading() {
    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-6">
                <div className="flex items-center gap-2">
                    <div className="h-10 w-32 bg-base-300 animate-pulse rounded-lg"></div>
                </div>
                <div className="flex gap-2">
                    <div className="h-10 w-20 bg-base-300 animate-pulse rounded-lg"></div>
                    <div className="h-10 w-32 bg-base-300 animate-pulse rounded-lg"></div>
                    <div className="h-10 w-10 bg-base-300 animate-pulse rounded-lg"></div>
                </div>
            </div>

            {/* Tabs */}
            <div className="tabs tabs-box mb-6">
                {[...Array(6)].map((_, index) => (
                    <div key={index} className="tab">
                        <div className="h-5 w-16 bg-base-300 animate-pulse rounded"></div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Content - Left Side */}
                <div className="md:col-span-2">
                    {/* Client Information Card */}
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="h-16 w-16 bg-base-300 animate-pulse rounded-full"></div>
                                <div className="flex-1">
                                    <div className="h-8 w-48 bg-base-300 animate-pulse rounded mb-2"></div>
                                    <div className="h-6 w-24 bg-base-300 animate-pulse rounded"></div>
                                </div>
                            </div>

                            <div className="h-6 w-32 bg-base-300 animate-pulse rounded mb-4"></div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[...Array(6)].map((_, index) => (
                                    <div key={index}>
                                        <div className="h-4 w-16 bg-base-300 animate-pulse rounded mb-2"></div>
                                        <div className="h-5 w-32 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Projects Section */}
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <div className="h-6 w-24 bg-base-300 animate-pulse rounded"></div>
                                <div className="h-8 w-28 bg-base-300 animate-pulse rounded-lg"></div>
                            </div>

                            <div className="space-y-4">
                                {[...Array(3)].map((_, index) => (
                                    <div key={index} className="border rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="h-5 w-40 bg-base-300 animate-pulse rounded"></div>
                                            <div className="h-5 w-16 bg-base-300 animate-pulse rounded"></div>
                                        </div>
                                        <div className="h-4 w-64 bg-base-300 animate-pulse rounded mb-2"></div>
                                        <div className="flex justify-between">
                                            <div className="h-4 w-24 bg-base-300 animate-pulse rounded"></div>
                                            <div className="h-4 w-20 bg-base-300 animate-pulse rounded"></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar - Right Side */}
                <div className="md:col-span-1">
                    {/* Client Logo Upload */}
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body text-center">
                            <div className="h-32 w-32 bg-base-300 animate-pulse rounded-full mx-auto mb-4"></div>
                            <div className="h-8 w-28 bg-base-300 animate-pulse rounded-lg mx-auto"></div>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="h-6 w-24 bg-base-300 animate-pulse rounded mb-4"></div>
                            <div className="space-y-4">
                                {[...Array(4)].map((_, index) => (
                                    <div key={index} className="flex justify-between">
                                        <div className="h-4 w-20 bg-base-300 animate-pulse rounded"></div>
                                        <div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Contact Info */}
                    <div className="card bg-base-100 shadow-sm mb-6">
                        <div className="card-body">
                            <div className="flex justify-between items-center mb-4">
                                <div className="h-6 w-32 bg-base-300 animate-pulse rounded"></div>
                                <div className="h-8 w-20 bg-base-300 animate-pulse rounded-lg"></div>
                            </div>

                            <div className="space-y-4">
                                {[...Array(2)].map((_, index) => (
                                    <div key={index} className="border-b pb-4">
                                        <div className="h-5 w-28 bg-base-300 animate-pulse rounded mb-2"></div>
                                        <div className="h-4 w-24 bg-base-300 animate-pulse rounded mb-1"></div>
                                        <div className="h-4 w-36 bg-base-300 animate-pulse rounded mb-1"></div>
                                        <div className="h-4 w-32 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Notes Section */}
                    <div className="card bg-base-100 shadow-sm">
                        <div className="card-body">
                            <div className="h-6 w-16 bg-base-300 animate-pulse rounded mb-4"></div>
                            <div className="space-y-2">
                                <div className="h-4 w-full bg-base-300 animate-pulse rounded"></div>
                                <div className="h-4 w-3/4 bg-base-300 animate-pulse rounded"></div>
                                <div className="h-4 w-1/2 bg-base-300 animate-pulse rounded"></div>
                            </div>
                            <div className="h-8 w-20 bg-base-300 animate-pulse rounded-lg mt-4"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
