import { useQuery } from '@tanstack/react-query'
import type { Article } from '../domain/article'
import { fetchAggregated } from '../services/news/aggregator'
import { ALL_SOURCES } from '../services/news/registry'

/**
 * Fetches a few "more like this" stories from the article's category,
 * excluding the article itself. Only runs when the article has a category.
 */
export function useRelatedArticles(article: Article | undefined, limit = 2) {
  return useQuery({
    queryKey: ['related', article?.category, article?.id],
    enabled: Boolean(article?.category),
    staleTime: 30 * 60 * 1000,
    queryFn: async ({ signal }) => {
      const page = await fetchAggregated(
        { category: article!.category, page: 1, pageSize: 6 },
        ALL_SOURCES,
        signal,
      )
      return page.articles.filter((entry) => entry.id !== article!.id).slice(0, limit)
    },
  })
}
