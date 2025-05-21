export default function NewInvoiceLoading() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-40 bg-base-300 rounded animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-base-300 rounded-lg shadow-sm mb-6 h-64 animate-pulse"></div>
          <div className="bg-base-300 rounded-lg shadow-sm mb-6 h-96 animate-pulse"></div>
          <div className="bg-base-300 rounded-lg shadow-sm mb-6 h-48 animate-pulse"></div>
        </div>
        <div>
          <div className="bg-base-300 rounded-lg shadow-sm mb-6 h-80 animate-pulse"></div>
          <div className="bg-base-300 rounded-lg shadow-sm mb-6 h-48 animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-10 w-full bg-base-300 rounded animate-pulse"></div>
            <div className="h-10 w-full bg-base-300 rounded animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
