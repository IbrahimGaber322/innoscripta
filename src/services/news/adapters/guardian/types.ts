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
    /** Full article body as HTML; only requested on the item endpoint. */
    body?: string
  }
  tags?: GuardianTag[]
}

/** Response of the single-item endpoint (content.guardianapis.com/{id}). */
export interface GuardianItemResponse {
  response: {
    status: string
    content?: GuardianArticle
  }
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
