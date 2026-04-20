export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-20 bg-gray-200 rounded mb-3"></div>
      <div className="h-10 bg-gray-200 rounded"></div>
    </div>
  )
}

export function SkeletonTable({ rows = 3 }) {
  return (
    <div className="animate-pulse">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-16 bg-gray-100 rounded mb-2"></div>
      ))}
    </div>
  )
}