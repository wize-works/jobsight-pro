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

      <div className="overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th className="h-10 w-1/5 bg-base-300 animate-pulse rounded"></th>
              <th className="h-10 w-1/5 bg-base-300 animate-pulse rounded"></th>
              <th className="h-10 w-1/5 bg-base-300 animate-pulse rounded"></th>
              <th className="h-10 w-1/5 bg-base-300 animate-pulse rounded"></th>
              <th className="h-10 w-1/5 bg-base-300 animate-pulse rounded"></th>
            </tr>
          </thead>
          <tbody>
            {[...Array(5)].map((_, i) => (
              <tr key={i}>
                <td className="h-16 bg-base-300 animate-pulse rounded"></td>
                <td className="h-16 bg-base-300 animate-pulse rounded"></td>
                <td className="h-16 bg-base-300 animate-pulse rounded"></td>
                <td className="h-16 bg-base-300 animate-pulse rounded"></td>
                <td className="h-16 bg-base-300 animate-pulse rounded"></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
