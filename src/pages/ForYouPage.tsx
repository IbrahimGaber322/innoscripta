import { Link } from 'react-router-dom'
import { ArticleCardSkeleton } from '../components/articles/ArticleCardSkeleton'
import { ArticleGrid } from '../components/articles/ArticleGrid'
import { EmptyState } from '../components/articles/EmptyState'
import { SourceStatusBanner } from '../components/articles/SourceStatusBanner'
import { useForYouFeed } from '../hooks/useForYouFeed'

export function ForYouPage() {
  const { isPending, followed, rest, errors, isDefaultFeed } = useForYouFeed()

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">
          For you
        </h1>
        <div className="text-[13px] text-stone-500">
          Curated from your sources &amp; topics —{' '}
          <Link
            to="/settings"
            className="hover:text-accent underline underline-offset-3 transition-colors"
          >
            edit
          </Link>
        </div>
      </div>

      {isDefaultFeed && (
        <div className="bg-panel mt-8 rounded-lg px-5 py-4 text-sm text-stone-600">
          Showing the latest headlines.{' '}
          <Link
            to="/settings"
            className="text-accent hover:text-ink font-semibold transition-colors"
          >
            Personalize your feed
          </Link>{' '}
          by picking preferred sources, categories, and authors.
        </div>
      )}

      <div className="mt-6">
        <SourceStatusBanner errors={errors} />
      </div>

      {isPending ? (
        <div className="mt-12">
          <ArticleCardSkeleton />
        </div>
      ) : followed.length === 0 && rest.length === 0 ? (
        <div className="mt-12">
          <EmptyState
            title="Nothing to show yet"
            message="No articles matched your preferences. Try adding more categories or sources in Settings, and make sure your API keys are configured."
          >
            <Link
              to="/settings"
              className="bg-ink text-paper hover:bg-accent inline-block rounded-full px-6 py-2.5 text-sm font-semibold transition-colors"
            >
              Open Settings
            </Link>
          </EmptyState>
        </div>
      ) : (
        <>
          {followed.length > 0 && (
            <section className="mt-12">
              <h2 className="font-serif text-2xl font-medium">From authors you follow</h2>
              <div className="mt-6 border-b border-stone-200 pb-12">
                <ArticleGrid articles={followed} />
              </div>
            </section>
          )}
          {rest.length > 0 && (
            <section className="mt-12">
              {followed.length > 0 && (
                <h2 className="mb-6 font-serif text-2xl font-medium">
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
