import { Link } from 'react-router-dom'
import { ArticleCardSkeleton } from '../components/articles/ArticleCardSkeleton'
import { ArticleGrid } from '../components/articles/ArticleGrid'
import { CategorySection } from '../components/articles/CategorySection'
import { EmptyState } from '../components/articles/EmptyState'
import { FeedFooter } from '../components/articles/FeedFooter'
import { SourceDigest } from '../components/articles/SourceDigest'
import { SourceStatusBanner } from '../components/articles/SourceStatusBanner'
import { TopPick } from '../components/articles/TopPick'
import { PersonaChips } from '../components/preferences/PersonaChips'
import { CATEGORY_LABELS } from '../domain/category'
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

  // A spotlight on the first preferred topic that has stories in the feed.
  const topicCategory = preferences.categories.find((category) =>
    feedRest.some((article) => article.category === category),
  )
  const topicArticles = topicCategory
    ? feedRest.filter((article) => article.category === topicCategory).slice(0, 3)
    : []
  const topicIds = new Set(topicArticles.map((article) => article.id))

  // Short digests from the first couple of followed sources.
  const afterTopic = feedRest.filter((article) => !topicIds.has(article.id))
  const digests = preferences.sources
    .slice(0, 2)
    .map((sourceId) => ({
      sourceId,
      items: afterTopic.filter((article) => article.sourceId === sourceId).slice(0, 3),
    }))
    .filter((digest) => digest.items.length > 0)
  const digestIds = new Set(digests.flatMap((digest) => digest.items.map((a) => a.id)))

  // Everything else flows into the infinite-scrolling remainder.
  const moreArticles = afterTopic.filter((article) => !digestIds.has(article.id))

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

          {topicCategory && topicArticles.length > 0 && (
            <CategorySection
              category={topicCategory}
              articles={topicArticles}
              title={`Because you follow ${CATEGORY_LABELS[topicCategory]}`}
              actionLabel="Manage topics"
              actionTo="/settings"
            />
          )}

          {digests.length > 0 && (
            <div className="mt-14 grid grid-cols-1 gap-x-16 gap-y-12 md:grid-cols-2">
              {digests.map((digest) => (
                <SourceDigest
                  key={digest.sourceId}
                  sourceId={digest.sourceId}
                  articles={digest.items}
                />
              ))}
            </div>
          )}

          {moreArticles.length > 0 && (
            <section className="mt-14">
              <h2 className="mb-6 border-t border-stone-200 pt-3.5 font-serif text-[27px] font-medium tracking-tight">
                More from your interests
              </h2>
              <ArticleGrid articles={moreArticles} />
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
