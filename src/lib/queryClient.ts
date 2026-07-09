import { QueryClient } from '@tanstack/react-query'

/**
 * Query cache defaults double as rate-limit protection: the NYT free tier
 * allows ~5 requests/minute, so repeated views of the same filters are
 * served from cache for five minutes instead of hitting the providers.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})
