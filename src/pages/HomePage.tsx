import { useMemo, useState } from 'react'
import { ArticleCardSkeleton } from '../components/articles/ArticleCardSkeleton'
import { ArticleGrid } from '../components/articles/ArticleGrid'
import { CategorySection } from '../components/articles/CategorySection'
import { EmptyState } from '../components/articles/EmptyState'
import { FeedFooter } from '../components/articles/FeedFooter'
import { LeadArticle } from '../components/articles/LeadArticle'
import { SourceStatusBanner } from '../components/articles/SourceStatusBanner'
import { TopHeadlines } from '../components/articles/TopHeadlines'
import { TopStories } from '../components/articles/TopStories'
import { CategoryTabs } from '../components/search/CategoryTabs'
import { FiltersPanel } from '../components/search/FiltersPanel'
import { SearchBar } from '../components/search/SearchBar'
import { LoadingBar } from '../components/ui/LoadingBar'
import { CATEGORY_LABELS } from '../domain/category'
import { useArticleSearch } from '../hooks/useArticleSearch'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { useSearchFilters, type SearchFilters } from '../hooks/useSearchFilters'
import { useTopHeadlines } from '../hooks/useTopHeadlines'
import { buildCategorySections } from '../lib/categorySections'
import { formatDate, formatToday } from '../lib/formatDate'
import { isBackgroundRefetching } from '../lib/queryStatus'

/** A heading that reflects the active filters, so it's never misleading. */
function buildHeading(filters: SearchFilters): string {
  if (filters.keyword) return `Results for “${filters.keyword}”`

  const { fromDate, toDate, categories, sourceIds } = filters
  const subject =
    categories.length > 0
      ? categories.map((category) => CATEGORY_LABELS[category]).join(' · ')
      : 'News'

  let dateText = ''
  if (fromDate && toDate) {
    dateText = ` from ${formatDate(fromDate)} – ${formatDate(toDate)}`
  } else if (fromDate) {
    dateText = ` since ${formatDate(fromDate)}`
  } else if (toDate) {
    dateText = ` up to ${formatDate(toDate)}`
  }

  if (categories.length > 0 || fromDate || toDate) return subject + dateText
  if (sourceIds.length > 0) return 'Filtered news'
  return 'Latest news'
}

export function HomePage() {
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useSearchFilters()
  const query = useArticleSearch(filters)

  // A filter change keeps the previous results on screen while the new page
  // loads (keepPreviousData), so show a top progress bar and dim the list to
  // signal the update — otherwise the page looks frozen until results swap in.
  const isRefreshing = isBackgroundRefetching(query)

  const panelFilterCount =
    filters.sourceIds.length + (filters.fromDate ? 1 : 0) + (filters.toDate ? 1 : 0)
  // Open on arrival when a shared or restored URL already refines by
  // source or date, so the active controls are visible.
  const [filtersOpen, setFiltersOpen] = useState(panelFilterCount > 0)

  const pages = query.data?.pages
  const articles = useMemo(() => pages?.flatMap((page) => page.articles) ?? [], [pages])
  // Per-source skip/failure status only changes between filter changes,
  // so the first page's errors describe the whole result set.
  const sourceErrors = pages?.[0]?.errors ?? []

  // Only dim and mark-busy the results when there is content to keep visible: a
  // refetch that currently has no articles would otherwise dim the empty state.
  // The top bar still signals the refetch globally in that case.
  const isRefreshingContent = isRefreshing && articles.length > 0

  const sentinelRef = useInfiniteScroll<HTMLDivElement>(() => query.fetchNextPage(), {
    enabled: query.hasNextPage && !query.isFetchingNextPage,
  })

  // The magazine layout (lead package, category sections, "earlier this week")
  // shows on the front page and when the only refinement is a source filter,
  // which still fans out across topics. A keyword, category, or date filter
  // collapses to a flat, filter-appropriate list.
  const showPackage =
    !filters.keyword &&
    filters.categories.length === 0 &&
    !filters.fromDate &&
    !filters.toDate &&
    articles.length >= 4
  const heading = buildHeading(filters)

  // Split the browse feed into the package, the category sections (a glimpse
  // of each topic), and the remainder shown under "Earlier this week".
  const { sections, earlier } = useMemo(() => {
    const pool = articles.slice(5)
    const grouped = showPackage ? buildCategorySections(pool) : []
    const usedIds = new Set(
      grouped.flatMap((section) => section.articles.map((article) => article.id)),
    )
    return { sections: grouped, earlier: pool.filter((a) => !usedIds.has(a.id)) }
  }, [articles, showPackage])

  // The dark "Top headlines" box is a separate query from one fixed source that
  // ignores the source filter, so it only appears on the true front page —
  // never while a source is selected, or it would surface a filtered-out
  // source's stories. Drop any story already shown in the feed above (matched by
  // URL, since the same story can carry a different id per source).
  const showTopHeadlines = showPackage && filters.sourceIds.length === 0
  const shownUrls = new Set(articles.map((article) => article.url.split('?')[0]))
  const topHeadlines = (useTopHeadlines(showTopHeadlines).data ?? []).filter(
    (article) => !shownUrls.has(article.url.split('?')[0]),
  )

  return (
    <section>
      <LoadingBar active={isRefreshing} />
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">
          {heading}
        </h1>
        <div className="text-[13px] text-stone-500">{formatToday()}</div>
      </div>

      <SearchBar
        value={filters.keyword}
        onChange={(keyword) => updateFilters({ keyword }, { replace: true })}
        filtersOpen={filtersOpen}
        onToggleFilters={() => setFiltersOpen((open) => !open)}
        filterCount={panelFilterCount}
      />

      <CategoryTabs
        value={filters.categories}
        onChange={(categories) => updateFilters({ categories })}
      />

      {filtersOpen && (
        <FiltersPanel
          filters={filters}
          onChange={updateFilters}
          onClear={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />
      )}

      <div className="mt-6">
        <SourceStatusBanner errors={sourceErrors} />
      </div>

      <div
        className={`transition-opacity duration-200 ${isRefreshingContent ? 'opacity-60' : ''}`}
        aria-busy={isRefreshingContent}
      >
        {query.isPending ? (
          <div className="mt-12">
            <ArticleCardSkeleton />
          </div>
        ) : articles.length > 0 ? (
          <>
            {showPackage ? (
              <>
                <div className="mt-12">
                  <TopStories lead={articles[0]} latest={articles.slice(1, 5)} />
                </div>
                {sections.map((section) => (
                  <CategorySection
                    key={section.category}
                    category={section.category}
                    articles={section.articles}
                  />
                ))}
                <TopHeadlines articles={topHeadlines} />
                {earlier.length > 0 && (
                  <section className="mt-14">
                    <h2 className="mb-6 border-t border-stone-200 pt-3.5 font-serif text-[27px] font-medium tracking-tight">
                      Earlier this week
                    </h2>
                    <ArticleGrid articles={earlier} />
                  </section>
                )}
              </>
            ) : (
              <>
                <div className="mt-12">
                  <LeadArticle article={articles[0]} />
                </div>
                {articles.length > 1 && (
                  <section className="mt-14">
                    <ArticleGrid articles={articles.slice(1)} />
                  </section>
                )}
              </>
            )}
            <div ref={sentinelRef} className="h-px" aria-hidden="true" />
            <FeedFooter
              isLoadingMore={query.isFetchingNextPage}
              hasMore={query.hasNextPage}
              hasItems={articles.length > 0}
              loadingLabel="Loading more stories"
              doneLabel="You're all caught up"
            />
          </>
        ) : (
          <div className="mt-12">
            <EmptyState
              title="No articles found"
              message="Try a different keyword, widen the date range."
            />
          </div>
        )}
      </div>
    </section>
  )
}
