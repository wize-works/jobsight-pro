export default function MediaUploadLoading() {
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 bg-base-300 animate-pulse rounded"></div>
          <div className="h-8 w-48 bg-base-300 animate-pulse rounded"></div>
        </div>
      </div>

      <div className="card bg-base-100 shadow-sm">
        <div className="card-body">
          <div className="h-40 bg-base-300 animate-pulse rounded-lg mb-6"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div className="h-20 bg-base-300 animate-pulse rounded"></div>
            <div className="h-20 bg-base-300 animate-pulse rounded"></div>
          </div>

          <div className="h-32 bg-base-300 animate-pulse rounded mt-4"></div>

          <div className="h-10 bg-base-300 animate-pulse rounded mt-4"></div>

          <div className="flex justify-end gap-2 mt-6">
            <div className="h-10 w-24 bg-base-300 animate-pulse rounded"></div>
            <div className="h-10 w-32 bg-base-300 animate-pulse rounded"></div>
          </div>
        </div>
      </div>
    </div>
  )
}
