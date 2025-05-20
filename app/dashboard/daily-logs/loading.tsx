export default function DailyLogsLoading() {
  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="h-8 bg-base-300 rounded w-40 animate-pulse mb-2"></h1>
          <div className="h-4 bg-base-300 rounded w-64 animate-pulse"></div>
        </div>
        <div className="h-10 bg-base-300 rounded w-32 animate-pulse mt-4 md:mt-0"></div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="stat bg-base-100 shadow">
            <div className="h-6 bg-base-300 rounded w-24 animate-pulse mb-2"></div>
            <div className="h-8 bg-base-300 rounded w-16 animate-pulse mb-2"></div>
            <div className="h-4 bg-base-300 rounded w-20 animate-pulse"></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-base-100 p-4 rounded-lg shadow mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="form-control">
              <div className="h-4 bg-base-300 rounded w-16 animate-pulse mb-2"></div>
              <div className="h-10 bg-base-300 rounded w-full animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Logs List */}
      <div className="grid grid-cols-1 gap-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="flex flex-col md:flex-row justify-between">
                <div>
                  <div className="h-6 bg-base-300 rounded w-64 animate-pulse mb-2"></div>
                  <div className="h-4 bg-base-300 rounded w-80 animate-pulse mb-2"></div>
                </div>
                <div className="h-8 bg-base-300 rounded w-24 animate-pulse mt-2 md:mt-0"></div>
              </div>

              <div className="divider my-2"></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="h-4 bg-base-300 rounded w-32 animate-pulse mb-2"></div>
                  <div className="h-4 bg-base-300 rounded w-full animate-pulse mb-4"></div>
                  <div className="h-4 bg-base-300 rounded w-full animate-pulse mb-1"></div>

                  <div className="h-4 bg-base-300 rounded w-32 animate-pulse mt-4 mb-2"></div>
                  <div className="h-4 bg-base-300 rounded w-full animate-pulse"></div>
                </div>

                <div>
                  <div className="h-4 bg-base-300 rounded w-32 animate-pulse mb-2"></div>
                  <div className="h-4 bg-base-300 rounded w-full animate-pulse mb-1"></div>
                  <div className="h-4 bg-base-300 rounded w-3/4 animate-pulse mb-4"></div>

                  <div className="h-4 bg-base-300 rounded w-32 animate-pulse mt-4 mb-2"></div>
                  <div className="h-4 bg-base-300 rounded w-full animate-pulse mb-1"></div>
                  <div className="h-4 bg-base-300 rounded w-3/4 animate-pulse"></div>
                </div>
              </div>

              <div className="h-4 bg-base-300 rounded w-32 animate-pulse mt-4 mb-2"></div>
              <div className="h-4 bg-base-300 rounded w-full animate-pulse"></div>

              <div className="mt-4">
                <div className="h-4 bg-base-300 rounded w-32 animate-pulse mb-2"></div>
                <div className="flex flex-wrap gap-2">
                  {[...Array(3)].map((_, j) => (
                    <div key={j} className="h-24 w-32 bg-base-300 rounded animate-pulse"></div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end mt-4">
                <div className="h-4 bg-base-300 rounded w-32 animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
