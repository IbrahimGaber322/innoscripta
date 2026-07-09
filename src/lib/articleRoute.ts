import type { Article } from '../domain/article'

/**
 * Article ids contain slashes, colons, and full URLs (query strings
 * included), which break URL path segments — so the reader route carries
 * them base64url-encoded.
 */
export function encodeArticleId(id: string): string {
  const bytes = new TextEncoder().encode(id)
  return btoa(String.fromCharCode(...bytes))
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '')
}

/** Reverses encodeArticleId; null for values that don't decode. */
export function decodeArticleId(encoded: string): string | null {
  try {
    const base64 = encoded.replaceAll('-', '+').replaceAll('_', '/')
    const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
    return new TextDecoder().decode(bytes)
  } catch {
    return null
  }
}

/** In-app reader path for an article. */
export function articlePath(article: Article): string {
  return `/article/${encodeArticleId(article.id)}`
}
