export default function EquipmentDetailLoading() {
    return (
        <div>
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between mb-6">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-10 w-36 bg-base-300 animate-pulse rounded-lg"></div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <div className="h-10 w-20 bg-base-300 animate-pulse rounded-lg"></div>
                    <div className="h-10 w-24 bg-base-300 animate-pulse rounded-lg"></div>
                </div>
            </div>

            {/* Main Content Grid - 1:2 split (sidebar:main) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 md:gap-6">
                {/* Left Sidebar - Equipment Card */}
                <div className="flex flex-col gap-6 col-span-1">
                    <div className="card bg-base-100 shadow-lg">
                        {/* Equipment Image */}
                        <figure className="px-4 pt-4 relative">
                            <div className="w-full h-48 bg-base-300 animate-pulse rounded-xl"></div>
                            <div className="absolute top-2 right-2">
                                <div className="h-8 w-8 bg-base-300 animate-pulse rounded-full"></div>
                            </div>
                        </figure>

                        <div className="card-body">
                            {/* Equipment Name & Title */}
                            <div className="h-8 w-48 bg-base-300 animate-pulse rounded mb-4"></div>
                            <div className="h-6 w-32 bg-base-300 animate-pulse rounded mb-4"></div>

                            {/* Current Status Section */}
                            <div className="space-y-3">
                                {[...Array(5)].map((_, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <div className="h-4 w-20 bg-base-300 animate-pulse rounded"></div>
                                        <div className="h-5 w-24 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                ))}
                            </div>

                            {/* Location Section */}
                            <div className="mb-4">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div>
                                    <div className="flex items-center gap-2">
                                        <div className="h-8 w-32 bg-base-300 animate-pulse rounded-lg"></div>
                                        <div className="h-6 w-6 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <div className="h-6 w-24 bg-base-300 animate-pulse rounded"></div>
                                    <div className="h-6 w-24 bg-base-300 animate-pulse rounded"></div>
                                    <div className="h-6 w-24 bg-base-300 animate-pulse rounded"></div>
                                </div>
                            </div>

                            <div className="divider"></div>

                            {/* Financial Section */}
                            <div className="h-6 w-20 bg-base-300 animate-pulse rounded mb-4"></div>
                            <div className="space-y-3">
                                {[...Array(4)].map((_, index) => (
                                    <div key={index} className="flex justify-between items-center">
                                        <div className="h-4 w-24 bg-base-300 animate-pulse rounded"></div>
                                        <div className="h-4 w-20 bg-base-300 animate-pulse rounded"></div>
                                    </div>
                                ))}
                            </div>

                            <div className="divider"></div>

                            {/* Documents Section */}
                            <div className="h-6 w-24 bg-base-300 animate-pulse rounded mb-4"></div>
                            <div className="space-y-2">
                                {[...Array(3)].map((_, index) => (
                                    <div key={index} className="h-4 w-32 bg-base-300 animate-pulse rounded"></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Main Content Area */}
                <div className="flex flex-col gap-6 col-span-2">
                    {/* Tabs */}
                    <div role="tablist" className="tabs tabs-box">
                        {[...Array(6)].map((_, index) => (
                            <div key={index} className="tab">
                                <div className="h-5 w-20 bg-base-300 animate-pulse rounded"></div>
                            </div>
                        ))}
                    </div>

                    {/* Tab Content Card */}
                    <div className="card bg-base-100 shadow-lg">
                        <div className="card-body">
                            <div className="h-6 w-16 bg-base-300 animate-pulse rounded mb-4"></div>
                            <div className="h-4 w-64 bg-base-300 animate-pulse rounded mb-6"></div>

                            {/* Specifications Section */}
                            <div className="h-5 w-28 bg-base-300 animate-pulse rounded mb-4"></div>
                            <div className="overflow-x-auto">
                                <table className="table table-zebra w-full">
                                    <tbody>
                                        {[...Array(6)].map((_, index) => (
                                            <tr key={index}>
                                                <td>
                                                    <div className="h-4 w-24 bg-base-300 animate-pulse rounded"></div>
                                                </td>
                                                <td>
                                                    <div className="h-4 w-32 bg-base-300 animate-pulse rounded"></div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* QR Code Section */}
                            <div className="flex justify-start items-center mt-6">
                                <div className="bg-base-200 p-4 rounded-lg">
                                    <div className="h-24 w-24 bg-base-300 animate-pulse rounded"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}