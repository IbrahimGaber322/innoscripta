interface ArticleCardSkeletonProps {
  count?: number
}

export function ArticleCardSkeleton({ count = 6 }: ArticleCardSkeletonProps) {
  return (
    <div
      className="grid grid-cols-1 gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-3"
      role="status"
      aria-label="Loading articles"
    >
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="animate-pulse">
          <div className="aspect-3/2 rounded bg-stone-200" />
          <div className="mt-4 h-3 w-24 rounded bg-stone-200" />
          <div className="mt-3 h-5 rounded bg-stone-200" />
          <div className="mt-2 h-5 w-2/3 rounded bg-stone-200" />
          <div className="mt-3 h-3 w-1/2 rounded bg-stone-200" />
        </div>
      ))}
    </div>
  )
}
