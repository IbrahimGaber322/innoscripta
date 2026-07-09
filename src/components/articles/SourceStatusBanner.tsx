import type { SourceError } from '../../services/news/NewsSource'

interface SourceStatusBannerProps {
  errors: SourceError[]
}

/**
 * Failing or skipped sources degrade visibly instead of silently: the rest
 * of the page keeps rendering while each problem source gets a chip here.
 */
export function SourceStatusBanner({ errors }: SourceStatusBannerProps) {
  if (errors.length === 0) {
    return null
  }

  return (
    <div
      role="status"
      className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900"
    >
      <p className="font-medium">Some sources are unavailable</p>
      <ul className="mt-1 flex flex-wrap gap-2">
        {errors.map((error) => (
          <li
            key={error.sourceId}
            className="rounded-full border border-amber-300 bg-white px-3 py-1 text-xs"
          >
            <span className="font-semibold">{error.sourceName}:</span> {error.message}
          </li>
        ))}
      </ul>
    </div>
  )
}
