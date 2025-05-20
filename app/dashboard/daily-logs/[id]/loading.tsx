export default function DailyLogDetailLoading() {
  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 bg-base-300 rounded animate-pulse"></div>
            <div className="h-8 bg-base-300 rounded w-48 animate-pulse"></div>
          </div>
          <div className="h-4 bg-base-300 rounded w-64 animate-pulse"></div>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <div className="h-10 bg-base-300 rounded w-24 animate-pulse"></div>
          <div className="h-10 bg-base-300 rounded w-24 animate-pulse"></div>
        </div>
      </div>

      {/* Tabs skeleton */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 bg-base-300 rounded w-24 animate-pulse"></div>
        ))}
      </div>

      {/* Content skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="h-6 bg-base-300 rounded w-32 mb-4 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-base-300 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-base-300 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-base-300 rounded w-3/4 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card bg-base-100 shadow-md">
              <div className="card-body">
                <div className="h-6 bg-base-300 rounded w-32 mb-4 animate-pulse"></div>
                <div className="space-y-3">
                  <div className="h-20 bg-base-300 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-base-300 rounded w-full animate-pulse"></div>
                  <div className="h-4 bg-base-300 rounded w-full animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
