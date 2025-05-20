export default function DailyLogDetailLoading() {
  return (
    <div className="container mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-base-300 rounded animate-pulse"></div>
            <div className="h-8 bg-base-300 rounded w-40 animate-pulse"></div>
            <div className="h-6 bg-base-300 rounded w-20 animate-pulse"></div>
          </div>
          <div className="h-4 bg-base-300 rounded w-64 animate-pulse mt-2"></div>
        </div>
        <div className="flex gap-2 mt-4 md:mt-0">
          <div className="h-8 bg-base-300 rounded w-20 animate-pulse"></div>
          <div className="h-8 bg-base-300 rounded w-20 animate-pulse"></div>
          <div className="h-8 bg-base-300 rounded w-20 animate-pulse"></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs tabs-boxed mb-6">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-10 bg-base-300 rounded w-24 animate-pulse mx-1"></div>
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="h-6 bg-base-300 rounded w-40 animate-pulse mb-2"></div>
              <div className="divider my-2"></div>

              <div className="h-5 bg-base-300 rounded w-32 animate-pulse mt-4 mb-2"></div>
              <div className="h-4 bg-base-300 rounded w-full animate-pulse mb-1"></div>
              <div className="h-4 bg-base-300 rounded w-full animate-pulse mb-4"></div>

              <div className="h-5 bg-base-300 rounded w-32 animate-pulse mt-4 mb-2"></div>
              <div className="h-4 bg-base-300 rounded w-full animate-pulse mb-1"></div>
              <div className="h-4 bg-base-300 rounded w-full animate-pulse mb-4"></div>

              <div className="h-5 bg-base-300 rounded w-32 animate-pulse mt-4 mb-2"></div>
              <div className="h-4 bg-base-300 rounded w-full animate-pulse mb-1"></div>
              <div className="h-4 bg-base-300 rounded w-3/4 animate-pulse mb-4"></div>

              <div className="h-5 bg-base-300 rounded w-32 animate-pulse mt-4 mb-2"></div>
              <div className="h-4 bg-base-300 rounded w-full animate-pulse mb-1"></div>
              <div className="h-4 bg-base-300 rounded w-full animate-pulse"></div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-lg mt-6">
            <div className="card-body">
              <div className="h-6 bg-base-300 rounded w-40 animate-pulse mb-2"></div>
              <div className="divider my-2"></div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex flex-col items-center">
                    <div className="h-12 w-12 bg-base-300 rounded-full animate-pulse mb-2"></div>
                    <div className="h-4 bg-base-300 rounded w-20 animate-pulse"></div>
                  </div>
                ))}
              </div>

              <div className="h-4 bg-base-300 rounded w-3/4 animate-pulse mt-4 mx-auto"></div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="h-6 bg-base-300 rounded w-40 animate-pulse mb-2"></div>
              <div className="divider my-2"></div>

              <div className="flex flex-col gap-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-5 bg-base-300 rounded w-full animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="h-6 bg-base-300 rounded w-40 animate-pulse mb-2"></div>
              <div className="divider my-2"></div>

              <div className="h-5 bg-base-300 rounded w-full animate-pulse mb-2"></div>

              <div className="h-5 bg-base-300 rounded w-32 animate-pulse mt-4 mb-2"></div>
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="h-4 bg-base-300 rounded w-full animate-pulse"></div>
                ))}
              </div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-lg">
            <div className="card-body">
              <div className="h-6 bg-base-300 rounded w-40 animate-pulse mb-2"></div>
              <div className="divider my-2"></div>

              <div className="space-y-3">
                {[...Array(2)].map((_, i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-10 bg-base-300 rounded w-32 animate-pulse"></div>
                    <div className="h-6 bg-base-300 rounded w-20 animate-pulse"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
