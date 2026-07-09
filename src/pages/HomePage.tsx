import { useState } from 'react'
import { ArticleCardSkeleton } from '../components/articles/ArticleCardSkeleton'
import { ArticleGrid } from '../components/articles/ArticleGrid'
import { EmptyState } from '../components/articles/EmptyState'
import { FeedFooter } from '../components/articles/FeedFooter'
import { LeadArticle } from '../components/articles/LeadArticle'
import { SourceStatusBanner } from '../components/articles/SourceStatusBanner'
import { TopStories } from '../components/articles/TopStories'
import { CategoryTabs } from '../components/search/CategoryTabs'
import { FiltersPanel } from '../components/search/FiltersPanel'
import { SearchBar } from '../components/search/SearchBar'
import { useArticleSearch } from '../hooks/useArticleSearch'
import { useInfiniteScroll } from '../hooks/useInfiniteScroll'
import { useSearchFilters } from '../hooks/useSearchFilters'
import { formatToday } from '../lib/formatDate'

export function HomePage() {
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useSearchFilters()
  const query = useArticleSearch(filters)

  const panelFilterCount =
    filters.sourceIds.length + (filters.fromDate ? 1 : 0) + (filters.toDate ? 1 : 0)
  // Open on arrival when a shared or restored URL already refines by
  // source or date, so the active controls are visible.
  const [filtersOpen, setFiltersOpen] = useState(panelFilterCount > 0)

  const articles = query.data?.pages.flatMap((page) => page.articles) ?? []
  // Per-source skip/failure status only changes between filter changes,
  // so the first page's errors describe the whole result set.
  const sourceErrors = query.data?.pages[0]?.errors ?? []

  const sentinelRef = useInfiniteScroll<HTMLDivElement>(() => query.fetchNextPage(), {
    enabled: query.hasNextPage && !query.isFetchingNextPage,
  })

  // Browsing the front page gets the lead-story package; an active keyword
  // search gets a flat, relevance-first list instead.
  const showPackage = !filters.keyword && articles.length >= 4
  const gridArticles = showPackage ? articles.slice(5) : articles.slice(1)

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="font-serif text-4xl font-medium tracking-tight sm:text-5xl">
          {filters.keyword ? `Results for “${filters.keyword}”` : 'Latest news'}
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

      {query.isPending ? (
        <div className="mt-12">
          <ArticleCardSkeleton />
        </div>
      ) : articles.length > 0 ? (
        <>
          <div className="mt-12">
            {showPackage ? (
              <TopStories lead={articles[0]} latest={articles.slice(1, 5)} />
            ) : (
              <LeadArticle article={articles[0]} />
            )}
          </div>
          {gridArticles.length > 0 && (
            <section className="mt-14">
              {showPackage && (
                <h2 className="mb-6 border-t border-stone-200 pt-3.5 font-serif text-[27px] font-medium tracking-tight">
                  More stories
                </h2>
              )}
              <ArticleGrid articles={gridArticles} />
            </section>
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
            message="Try a different keyword, widen the date range, or check that your API keys are configured in .env."
          />
        </div>
      )}
    </section>
  )
}
