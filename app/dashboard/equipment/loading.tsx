export default function Loading() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-48 bg-base-300 animate-pulse rounded"></div>
        <div className="h-10 w-32 bg-base-300 animate-pulse rounded"></div>
      </div>

      <div className="card bg-base-100 shadow-sm mb-6">
        <div className="card-body">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="h-10 w-full bg-base-300 animate-pulse rounded"></div>
            <div className="h-10 w-40 bg-base-300 animate-pulse rounded"></div>
            <div className="h-10 w-40 bg-base-300 animate-pulse rounded"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow-sm">
            <div className="h-48 w-full bg-base-300 animate-pulse rounded-t-xl"></div>
            <div className="card-body">
              <div className="flex justify-between items-start">
                <div className="h-6 w-32 bg-base-300 animate-pulse rounded mb-4"></div>
                <div className="h-6 w-20 bg-base-300 animate-pulse rounded"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 w-full bg-base-300 animate-pulse rounded"></div>
                <div className="h-4 w-3/4 bg-base-300 animate-pulse rounded"></div>
                <div className="h-4 w-1/2 bg-base-300 animate-pulse rounded"></div>
              </div>
              <div className="flex justify-end mt-4">
                <div className="h-8 w-24 bg-base-300 animate-pulse rounded"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
