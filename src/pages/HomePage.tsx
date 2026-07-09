import { ArticleCardSkeleton } from '../components/articles/ArticleCardSkeleton'
import { ArticleGrid } from '../components/articles/ArticleGrid'
import { EmptyState } from '../components/articles/EmptyState'
import { FilterBar } from '../components/search/FilterBar'
import { SearchBar } from '../components/search/SearchBar'
import { useArticleSearch } from '../hooks/useArticleSearch'
import { useSearchFilters } from '../hooks/useSearchFilters'

export function HomePage() {
  const { filters, updateFilters, clearFilters, hasActiveFilters } = useSearchFilters()
  const query = useArticleSearch(filters)

  const articles = query.data?.pages.flatMap((page) => page.articles) ?? []

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

      {query.isPending ? (
        <ArticleCardSkeleton />
      ) : articles.length > 0 ? (
        <ArticleGrid articles={articles} />
      ) : (
        <EmptyState
          title="No articles found"
          message="Try a different keyword, widen the date range, or check that your API keys are configured in .env."
        />
      )}
    </section>
  )
}
