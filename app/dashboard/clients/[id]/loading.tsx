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
          <div className="h-8 w-8 bg-base-300 animate-pulse rounded"></div>
        </div>
      </div>

      <div className="h-10 w-full bg-base-300 animate-pulse rounded mb-6"></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="flex flex-col items-center mb-4">
                <div className="w-24 h-24 rounded-full bg-base-300 animate-pulse"></div>
                <div className="h-6 w-48 bg-base-300 animate-pulse rounded mt-4"></div>
                <div className="h-4 w-32 bg-base-300 animate-pulse rounded mt-2"></div>
                <div className="h-6 w-24 bg-base-300 animate-pulse rounded mt-2"></div>
              </div>

              <div className="h-1 w-full bg-base-300 animate-pulse rounded my-4"></div>

              <div className="h-6 w-48 bg-base-300 animate-pulse rounded mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 w-full bg-base-300 animate-pulse rounded"></div>
                <div className="h-4 w-full bg-base-300 animate-pulse rounded"></div>
                <div className="h-4 w-full bg-base-300 animate-pulse rounded"></div>
                <div className="h-4 w-full bg-base-300 animate-pulse rounded"></div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="h-32 bg-base-300 animate-pulse rounded"></div>
            <div className="h-32 bg-base-300 animate-pulse rounded"></div>
            <div className="h-32 bg-base-300 animate-pulse rounded"></div>
          </div>

          <div className="card bg-base-100 shadow-sm mb-6">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <div className="h-6 w-32 bg-base-300 animate-pulse rounded"></div>
                <div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div>
              </div>
              <div className="h-64 w-full bg-base-300 animate-pulse rounded"></div>
            </div>
          </div>

          <div className="card bg-base-100 shadow-sm">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <div className="h-6 w-40 bg-base-300 animate-pulse rounded"></div>
                <div className="h-4 w-16 bg-base-300 animate-pulse rounded"></div>
              </div>
              <div className="h-64 w-full bg-base-300 animate-pulse rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
