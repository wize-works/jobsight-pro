export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <div className="h-8 w-48 bg-base-300 animate-pulse rounded"></div>
          <div className="h-4 w-32 bg-base-300 animate-pulse rounded mt-2"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 bg-base-300 animate-pulse rounded"></div>
          <div className="h-8 w-32 bg-base-300 animate-pulse rounded"></div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm mb-6">
        <div className="card-body">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <div className="h-5 w-24 bg-base-300 animate-pulse rounded mb-2"></div>
                <div className="h-5 w-32 bg-base-300 animate-pulse rounded"></div>
              </div>
            ))}
          </div>
          <div className="mt-4">
            <div className="h-5 w-32 bg-base-300 animate-pulse rounded mb-2"></div>
            <div className="flex flex-wrap gap-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-6 w-20 bg-base-300 animate-pulse rounded"></div>
              ))}
            </div>
          </div>
          <div className="mt-4">
            <div className="h-5 w-16 bg-base-300 animate-pulse rounded mb-2"></div>
            <div className="h-16 w-full bg-base-300 animate-pulse rounded"></div>
          </div>
        </div>
      </div>

      <div className="h-10 w-full bg-base-300 animate-pulse rounded mb-6"></div>

      <div className="overflow-x-auto">
        <div className="h-64 w-full bg-base-300 animate-pulse rounded"></div>
      </div>
    </div>
  )
}
