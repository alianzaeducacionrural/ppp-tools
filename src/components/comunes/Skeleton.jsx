export function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl border border-[#e8dcca] p-5 animate-pulse">
      <div className="h-3.5 bg-[#e8dcca] rounded-full w-3/4 mb-4" />
      <div className="h-16 bg-[#f5efe6] rounded-xl mb-3" />
      <div className="h-3 bg-[#e8dcca] rounded-full w-1/2" />
    </div>
  )
}

export function SkeletonTable({ rows = 3 }) {
  return (
    <div className="animate-pulse space-y-2">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="h-14 bg-[#f5efe6] rounded-xl border border-[#e8dcca]" />
      ))}
    </div>
  )
}

export function SkeletonList({ rows = 4 }) {
  return (
    <div className="animate-pulse space-y-3">
      {[...Array(rows)].map((_, i) => (
        <div key={i} className="flex items-center gap-3 bg-white rounded-2xl border border-[#e8dcca] p-4">
          <div className="w-10 h-10 rounded-full bg-[#e8dcca] flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="h-3 bg-[#e8dcca] rounded-full w-1/2" />
            <div className="h-2.5 bg-[#f5efe6] rounded-full w-3/4" />
          </div>
        </div>
      ))}
    </div>
  )
}
