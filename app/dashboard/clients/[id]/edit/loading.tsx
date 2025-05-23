export default function ClientEditLoading() {
    return (
        <div className="container mx-auto p-6 max-w-4xl">
            <div className="flex items-center gap-4 mb-6">
                <div className="skeleton w-16 h-8"></div>
                <div className="skeleton h-8 w-64"></div>
            </div>

            <div className="card bg-base-100 shadow-xl">
                <div className="card-body">
                    <div className="skeleton h-6 w-48 mb-6"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="form-control">
                            <div className="skeleton h-4 w-24 mb-2"></div>
                            <div className="skeleton h-12 w-full"></div>
                        </div>
                        <div className="form-control">
                            <div className="skeleton h-4 w-24 mb-2"></div>
                            <div className="skeleton h-12 w-full"></div>
                        </div>
                    </div>

                    <div className="divider"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="form-control">
                            <div className="skeleton h-4 w-32 mb-2"></div>
                            <div className="skeleton h-12 w-full"></div>
                        </div>
                        <div className="form-control">
                            <div className="skeleton h-4 w-24 mb-2"></div>
                            <div className="skeleton h-12 w-full"></div>
                        </div>
                        <div className="form-control">
                            <div className="skeleton h-4 w-28 mb-2"></div>
                            <div className="skeleton h-12 w-full"></div>
                        </div>
                        <div className="form-control">
                            <div className="skeleton h-4 w-16 mb-2"></div>
                            <div className="skeleton h-12 w-full"></div>
                        </div>
                    </div>

                    <div className="form-control mb-6">
                        <div className="skeleton h-4 w-20 mb-2"></div>
                        <div className="skeleton h-20 w-full"></div>
                    </div>

                    <div className="form-control mb-6">
                        <div className="skeleton h-4 w-20 mb-2"></div>
                        <div className="skeleton h-12 w-full"></div>
                    </div>

                    <div className="divider"></div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div className="form-control">
                            <div className="skeleton h-4 w-20 mb-2"></div>
                            <div className="skeleton h-12 w-full"></div>
                        </div>
                        <div className="form-control">
                            <div className="skeleton h-4 w-16 mb-2"></div>
                            <div className="skeleton h-12 w-full"></div>
                        </div>
                        <div className="form-control">
                            <div className="skeleton h-4 w-36 mb-2"></div>
                            <div className="skeleton h-12 w-full"></div>
                        </div>
                        <div className="form-control">
                            <div className="skeleton h-4 w-32 mb-2"></div>
                            <div className="skeleton h-12 w-full"></div>
                        </div>
                    </div>

                    <div className="form-control mb-6">
                        <div className="skeleton h-4 w-28 mb-2"></div>
                        <div className="skeleton h-20 w-full"></div>
                    </div>

                    <div className="divider"></div>

                    <div className="form-control mb-6">
                        <div className="skeleton h-4 w-16 mb-2"></div>
                        <div className="skeleton h-24 w-full"></div>
                    </div>

                    <div className="card-actions justify-end gap-2">
                        <div className="skeleton h-12 w-20"></div>
                        <div className="skeleton h-12 w-32"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
