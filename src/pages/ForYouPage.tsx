import { Link } from 'react-router-dom'
import { ArticleCardSkeleton } from '../components/articles/ArticleCardSkeleton'
import { ArticleGrid } from '../components/articles/ArticleGrid'
import { EmptyState } from '../components/articles/EmptyState'
import { FeedFooter } from '../components/articles/FeedFooter'
import { SourceStatusBanner } from '../components/articles/SourceStatusBanner'
import { TopPick } from '../components/articles/TopPick'
import { PersonaChips } from '../components/preferences/PersonaChips'
import { useForYouFeed } from '../hooks/useForYouFeed'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { usePreferences } from '../hooks/usePreferences'
import { formatToday, greeting } from '../lib/formatDate'

export function ForYouPage() {
  const { preferences } = usePreferences()
  const {
    isPending,
    followed,
    rest,
    errors,
    isDefaultFeed,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useForYouFeed()

  const sentinelRef = useInfiniteScroll<HTMLDivElement>(fetchNextPage, {
    enabled: hasNextPage && !isFetchingNextPage,
  })

  // The most relevant story leads; a followed author outranks the rest.
  const topPick = followed[0] ?? rest[0]
  const followedRail = followed.filter((article) => article.id !== topPick?.id)
  const feedRest = rest.filter((article) => article.id !== topPick?.id)

  return (
    <div>
      <div className="text-[13px] text-stone-500">{formatToday()}</div>
      <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
        {greeting()}
      </h1>
      <div className="mt-3.5 flex flex-wrap items-center gap-2.5 text-[13.5px] text-stone-500">
        <span>Your briefing, built from</span>
        <PersonaChips preferences={preferences} />
        <Link
          to="/settings"
          className="hover:text-ink underline underline-offset-3 transition-colors"
        >
          edit
        </Link>
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
      ) : !topPick ? (
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
          <div className="mt-10">
            <TopPick article={topPick} />
          </div>

          {followedRail.length > 0 && (
            <section className="mt-14">
              <h2 className="mb-6 border-t border-stone-200 pt-3.5 font-serif text-[27px] font-medium tracking-tight">
                From authors you follow
              </h2>
              <ArticleGrid articles={followedRail} />
            </section>
          )}

          {feedRest.length > 0 && (
            <section className="mt-14">
              <h2 className="mb-6 border-t border-stone-200 pt-3.5 font-serif text-[27px] font-medium tracking-tight">
                More from your feed
              </h2>
              <ArticleGrid articles={feedRest} />
            </section>
          )}

          <div ref={sentinelRef} className="h-px" aria-hidden="true" />
          <FeedFooter
            isLoadingMore={isFetchingNextPage}
            hasMore={hasNextPage}
            hasItems={Boolean(topPick)}
            loadingLabel="Personalizing more stories"
            doneLabel="That's everything from your sources today"
          />
        </>
      )}
    </div>
  )
}
