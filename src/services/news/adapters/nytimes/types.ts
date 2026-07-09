/**
 * Raw shapes returned by the NYT Article Search API.
 * The multimedia field changed shape in the 2024 schema revision, so both
 * variants are modeled and handled.
 */

/** Legacy schema: an array of media entries with relative URLs. */
export interface NytLegacyMultimedia {
  url: string
  subtype?: string
  type?: string
}

/** 2024+ schema: a single object with absolute URLs. */
export interface NytModernMultimedia {
  caption?: string
  credit?: string
  default?: { url: string; height?: number; width?: number }
  thumbnail?: { url: string; height?: number; width?: number }
}

export interface NytDoc {
  _id: string
  web_url: string
  snippet?: string
  abstract?: string
  headline: { main: string }
  pub_date: string
  byline?: { original?: string | null }
  news_desk?: string
  section_name?: string
  multimedia?: NytLegacyMultimedia[] | NytModernMultimedia
}

export interface NytResponse {
  status: string
  response: {
    docs: NytDoc[]
    meta: { hits: number; offset: number }
  }
}
