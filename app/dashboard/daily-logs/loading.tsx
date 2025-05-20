export default function DailyLogsLoading() {
  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="h-8 bg-base-300 rounded w-48 mb-2 animate-pulse"></div>
          <div className="h-4 bg-base-300 rounded w-64 animate-pulse"></div>
        </div>
        <div className="h-10 bg-base-300 rounded w-32 mt-4 md:mt-0 animate-pulse"></div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card bg-base-100 shadow-md">
            <div className="card-body p-4">
              <div className="flex items-center">
                <div className="rounded-full bg-base-300 h-12 w-12 mr-4 animate-pulse"></div>
                <div className="space-y-2">
                  <div className="h-5 bg-base-300 rounded w-24 animate-pulse"></div>
                  <div className="h-8 bg-base-300 rounded w-16 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="card bg-base-100 shadow-md mb-6">
        <div className="card-body p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="h-10 bg-base-300 rounded w-full animate-pulse"></div>
            <div className="h-10 bg-base-300 rounded w-full md:w-64 animate-pulse"></div>
            <div className="h-10 bg-base-300 rounded w-full md:w-64 animate-pulse"></div>
          </div>
        </div>
      </div>

      {/* Table skeleton */}
      <div className="card bg-base-100 shadow-md overflow-x-auto">
        <div className="card-body p-0">
          <div className="h-10 bg-base-300 w-full animate-pulse"></div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-base-200 w-full animate-pulse mt-1"></div>
          ))}
        </div>
      </div>
    </div>
  )
}
