interface ArticleCardSkeletonProps {
  count?: number
}

export function ArticleCardSkeleton({ count = 6 }: ArticleCardSkeletonProps) {
  return (
    <div
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-label="Loading articles"
    >
      {Array.from({ length: count }, (_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-xl border border-slate-200 bg-white"
        >
          <div className="h-44 bg-slate-200" />
          <div className="space-y-3 p-4">
            <div className="h-4 w-24 rounded-full bg-slate-200" />
            <div className="h-5 rounded bg-slate-200" />
            <div className="h-5 w-2/3 rounded bg-slate-200" />
            <div className="h-4 w-1/2 rounded bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  )
}
