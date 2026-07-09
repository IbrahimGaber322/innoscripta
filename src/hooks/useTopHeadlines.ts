import { useQuery } from '@tanstack/react-query'
import { canFetchTopHeadlines, fetchTopHeadlines } from '../services/news/topHeadlines'

/** Loads the ranked "top headlines" list, when the NewsAPI key is present. */
export function useTopHeadlines(enabled: boolean) {
  return useQuery({
    queryKey: ['top-headlines'],
    queryFn: ({ signal }) => fetchTopHeadlines(6, signal),
    enabled: enabled && canFetchTopHeadlines(),
    staleTime: 10 * 60 * 1000,
  })
}
