import { useState } from 'react'
import { ArticleCardSkeleton } from '../components/articles/ArticleCardSkeleton'
import { ArticleGrid } from '../components/articles/ArticleGrid'
import { EmptyState } from '../components/articles/EmptyState'
import { LeadArticle } from '../components/articles/LeadArticle'
import { LoadMoreButton } from '../components/articles/LoadMoreButton'
import { SourceStatusBanner } from '../components/articles/SourceStatusBanner'
import { CategoryTabs } from '../components/search/CategoryTabs'
import { FiltersPanel } from '../components/search/FiltersPanel'
import { SearchBar } from '../components/search/SearchBar'
import { useArticleSearch } from '../hooks/useArticleSearch'
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
            <LeadArticle article={articles[0]} />
          </div>
          {articles.length > 1 && (
            <div className="mt-12">
              <ArticleGrid articles={articles.slice(1)} />
            </div>
          )}
          {query.hasNextPage && (
            <div className="mt-10">
              <LoadMoreButton
                onClick={() => query.fetchNextPage()}
                loading={query.isFetchingNextPage}
              />
            </div>
          )}
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
