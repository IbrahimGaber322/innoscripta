/** Raw shapes returned by the Guardian Open Platform content API. */

export interface GuardianTag {
  type: string
  webTitle: string
}

export interface GuardianArticle {
  id: string
  sectionId?: string
  sectionName?: string
  webPublicationDate: string
  webTitle: string
  webUrl: string
  fields?: {
    trailText?: string
    thumbnail?: string
    byline?: string
  }
  tags?: GuardianTag[]
}

export interface GuardianResponse {
  response: {
    status: string
    total: number
    pages: number
    currentPage: number
    results: GuardianArticle[]
  }
}
