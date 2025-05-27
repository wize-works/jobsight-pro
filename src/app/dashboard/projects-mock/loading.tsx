export default function ProjectsLoading() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-8 bg-base-300 rounded w-32 mb-2"></div>
          <div className="h-4 bg-base-300 rounded w-64"></div>
        </div>
        <div className="h-10 bg-base-300 rounded w-32"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="flex items-center">
                <div className="rounded-full bg-base-300 h-12 w-12 mr-4"></div>
                <div>
                  <div className="h-4 bg-base-300 rounded w-16 mb-2"></div>
                  <div className="h-6 bg-base-300 rounded w-10"></div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="card bg-base-100 shadow-sm mb-6">
        <div className="card-body p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="h-10 bg-base-300 rounded"></div>
            <div className="h-10 bg-base-300 rounded"></div>
            <div className="h-10 bg-base-300 rounded"></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="card bg-base-100 shadow-sm">
            <div className="card-body p-4">
              <div className="h-6 bg-base-300 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-base-300 rounded w-1/2 mb-4"></div>
              <div className="h-4 bg-base-300 rounded w-full mb-2"></div>
              <div className="h-4 bg-base-300 rounded w-full mb-2"></div>
              <div className="h-4 bg-base-300 rounded w-3/4 mb-4"></div>
              <div className="h-2 bg-base-300 rounded w-full mb-1"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
