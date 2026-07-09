/** Raw shapes returned by the NewsAPI.org v2 endpoints. */

export interface NewsApiArticle {
  source: { id: string | null; name: string }
  author: string | null
  title: string | null
  description: string | null
  url: string | null
  urlToImage: string | null
  publishedAt: string | null
  content: string | null
}

export interface NewsApiResponse {
  status: 'ok' | 'error'
  totalResults: number
  articles: NewsApiArticle[]
}
