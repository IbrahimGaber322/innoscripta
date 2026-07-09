import { Link } from 'react-router-dom'
import { ArticleCardSkeleton } from '../components/articles/ArticleCardSkeleton'
import { ArticleGrid } from '../components/articles/ArticleGrid'
import { EmptyState } from '../components/articles/EmptyState'
import { SourceStatusBanner } from '../components/articles/SourceStatusBanner'
import { useForYouFeed } from '../hooks/useForYouFeed'

export function ForYouPage() {
  const { isPending, followed, rest, errors, isDefaultFeed } = useForYouFeed()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">For You</h1>

      {isDefaultFeed && (
        <div className="rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          Showing the latest headlines.{' '}
          <Link to="/settings" className="font-semibold underline hover:text-sky-700">
            Personalize your feed
          </Link>{' '}
          by picking preferred sources, categories, and authors.
        </div>
      )}

      <SourceStatusBanner errors={errors} />

      {isPending ? (
        <ArticleCardSkeleton />
      ) : followed.length === 0 && rest.length === 0 ? (
        <EmptyState
          title="Nothing to show yet"
          message="No articles matched your preferences. Try adding more categories or sources in Settings, and make sure your API keys are configured."
        >
          <Link
            to="/settings"
            className="inline-block rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
          >
            Open Settings
          </Link>
        </EmptyState>
      ) : (
        <>
          {followed.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-lg font-semibold text-slate-900">
                From authors you follow
              </h2>
              <ArticleGrid articles={followed} />
              <hr className="border-slate-200" />
            </section>
          )}
          {rest.length > 0 && (
            <section className="space-y-3">
              {followed.length > 0 && (
                <h2 className="text-lg font-semibold text-slate-900">
                  More from your feed
                </h2>
              )}
              <ArticleGrid articles={rest} />
            </section>
          )}
        </>
      )}
    </div>
  )
}
