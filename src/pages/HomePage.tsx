import { ArticleCardSkeleton } from '../components/articles/ArticleCardSkeleton'
import { ArticleGrid } from '../components/articles/ArticleGrid'
import { EmptyState } from '../components/articles/EmptyState'
import { LoadMoreButton } from '../components/articles/LoadMoreButton'
import { SourceStatusBanner } from '../components/articles/SourceStatusBanner'
import { FilterBar } from '../components/search/FilterBar'
import { SearchBar } from '../components/search/SearchBar'
import { useArticleSearch } from '../hooks/useArticleSearch'
import { useSearchFilters } from '../hooks/useSearchFilters'

export function HomePage() {
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useSearchFilters()
  const query = useArticleSearch(filters)

  const articles = query.data?.pages.flatMap((page) => page.articles) ?? []
  // Per-source skip/failure status only changes between filter changes,
  // so the first page's errors describe the whole result set.
  const sourceErrors = query.data?.pages[0]?.errors ?? []

  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">
        {filters.keyword ? `Results for "${filters.keyword}"` : 'Latest news'}
      </h1>

      <SearchBar
        value={filters.keyword}
        onChange={(keyword) => updateFilters({ keyword }, { replace: true })}
      />

      <FilterBar
        filters={filters}
        onChange={updateFilters}
        onClear={clearFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <SourceStatusBanner errors={sourceErrors} />

      {query.isPending ? (
        <ArticleCardSkeleton />
      ) : articles.length > 0 ? (
        <>
          <ArticleGrid articles={articles} />
          {query.hasNextPage && (
            <LoadMoreButton
              onClick={() => query.fetchNextPage()}
              loading={query.isFetchingNextPage}
            />
          )}
        </>
      ) : (
        <EmptyState
          title="No articles found"
          message="Try a different keyword, widen the date range, or check that your API keys are configured in .env."
        />
      )}
    </section>
  )
}
