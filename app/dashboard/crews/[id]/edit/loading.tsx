export default function CrewEditLoading() {
    return (
        <div>
            <div className="flex items-center gap-4 mb-6">
                <div className="skeleton w-16 h-8"></div>
                <div className="skeleton h-8 w-64"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col space-y-4 col-span-2">
                    <div className="card bg-base-300 shadow-sm p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="skeleton h-8 w-48"></div>
                            <div className="skeleton h-10 w-32"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="skeleton h-4 w-24 mb-2"></div>
                                <div className="skeleton h-12 w-full"></div>
                            </div>
                            <div>
                                <div className="skeleton h-4 w-24 mb-2"></div>
                                <div className="skeleton h-12 w-full"></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 mt-4">
                            <div>
                                <div className="skeleton h-4 w-24 mb-2"></div>
                                <div className="skeleton h-12 w-full"></div>
                            </div>
                            <div>
                                <div className="skeleton h-4 w-24 mb-2"></div>
                                <div className="skeleton h-12 w-full"></div>
                            </div>
                        </div>
                    </div>

                    <div className="card bg-base-300 shadow-sm p-6">
                        <div className="skeleton h-8 w-24 mb-4"></div>
                        <div className="skeleton h-32 w-full"></div>
                    </div>
                </div>

                <div className="flex flex-col space-y-4">
                    <div className="card bg-base-300 shadow-sm">
                        <div className="card-body">
                            <div className="skeleton h-8 w-36 mb-4"></div>
                            <div className="skeleton h-12 w-full mb-4"></div>
                            <div className="flex flex-wrap gap-2">
                                <div className="skeleton h-8 w-24"></div>
                                <div className="skeleton h-8 w-32"></div>
                                <div className="skeleton h-8 w-28"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
