export default function InvoiceDetailLoading() {
    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="h-8 w-40 bg-base-300 rounded animate-pulse"></div>
                <div className="flex gap-2">
                    <div className="h-10 w-24 bg-base-300 rounded animate-pulse"></div>
                    <div className="h-10 w-24 bg-base-300 rounded animate-pulse"></div>
                    <div className="h-10 w-24 bg-base-300 rounded animate-pulse"></div>
                </div>
            </div>

            <div className="bg-base-300 p-6 rounded-lg shadow-sm mb-6 h-[800px] animate-pulse"></div>
        </div>
    )
}
