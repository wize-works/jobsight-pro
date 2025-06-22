export default function ProfileLoading() {
    return (
        <div className="max-w-6xl mx-auto space-y-8 p-6">
            {/* Header skeleton */}
            <div className="flex justify-between items-center">
                <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>

            {/* Profile Photo & Personal Information skeleton */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <div className="flex flex-col lg:flex-row gap-8">
                        {/* Avatar section skeleton */}
                        <div className="lg:w-1/3 flex flex-col items-center">
                            <div className="flex items-center space-x-6 mb-8">
                                <div className="relative">
                                    <div className="w-24 h-24 bg-gray-200 rounded-full animate-pulse"></div>
                                    <div className="w-8 h-8 bg-gray-300 rounded-full absolute bottom-0 right-0 animate-pulse"></div>
                                </div>
                                <div>
                                    <div className="h-6 bg-gray-200 rounded w-24 animate-pulse mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-40 animate-pulse mb-1"></div>
                                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse mb-4"></div>
                                    <div className="h-8 bg-gray-200 rounded w-24 animate-pulse"></div>
                                </div>
                            </div>
                        </div>

                        {/* Personal information form skeleton */}
                        <div className="lg:w-2/3">
                            <div className="h-6 bg-gray-200 rounded w-40 animate-pulse mb-6"></div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {[...Array(6)].map((_, i) => (
                                    <div key={i} className="form-control">
                                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse mb-2"></div>
                                        <div className="h-12 bg-gray-200 rounded animate-pulse"></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Notification Preferences skeleton */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-6"></div>

                    {/* Global preferences skeleton */}
                    <div className="space-y-4 mb-8">
                        <div className="h-5 bg-gray-200 rounded w-40 animate-pulse mb-4"></div>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-base-200 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                                </div>
                                <div className="w-12 h-6 bg-gray-200 rounded-full animate-pulse"></div>
                            </div>
                        ))}
                    </div>

                    {/* Notification types skeleton */}
                    <div className="space-y-6">
                        <div className="h-5 bg-gray-200 rounded w-48 animate-pulse mb-4"></div>
                        {[...Array(4)].map((_, typeIndex) => (
                            <div key={typeIndex} className="border border-base-300 rounded-lg p-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-5 h-5 bg-gray-200 rounded animate-pulse"></div>
                                    <div className="h-5 bg-gray-200 rounded w-32 animate-pulse"></div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    {[...Array(3)].map((_, channelIndex) => (
                                        <div key={channelIndex} className="flex justify-between items-center">
                                            <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                                            <div className="w-10 h-5 bg-gray-200 rounded-full animate-pulse"></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Security Settings skeleton */}
            <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                    <div className="h-6 bg-gray-200 rounded w-36 animate-pulse mb-6"></div>

                    <div className="space-y-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="flex justify-between items-center p-4 bg-base-200 rounded-lg">
                                <div>
                                    <div className="h-5 bg-gray-200 rounded w-40 animate-pulse mb-2"></div>
                                    <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
                                </div>
                                <div className="h-9 bg-gray-200 rounded w-24 animate-pulse"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Additional sections skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {[...Array(2)].map((_, i) => (
                    <div key={i} className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse mb-4"></div>
                            <div className="space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                            </div>
                            <div className="flex gap-3 mt-6">
                                <div className="h-9 bg-gray-200 rounded w-20 animate-pulse"></div>
                                <div className="h-9 bg-gray-200 rounded w-16 animate-pulse"></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
