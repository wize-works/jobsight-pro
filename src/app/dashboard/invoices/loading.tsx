export default function InvoicesLoading() {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="h-8 w-40 bg-base-300 rounded animate-pulse"></div>
                <div className="h-10 w-32 bg-base-300 rounded animate-pulse"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="stats shadow bg-base-300 animate-pulse h-24"></div>
                ))}
            </div>

            <div className="bg-base-300 p-4 rounded-lg shadow-sm mb-6 h-16 animate-pulse"></div>

            <div className="bg-base-300 rounded-lg shadow-sm h-96 animate-pulse"></div>
        </div>
    )
}
