/** Error thrown for failed HTTP requests, carrying the response status. */
export class ApiError extends Error {
  readonly status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export type QueryParams = Record<string, string | number | undefined>

/** Builds a URL, skipping params whose value is undefined or empty. */
export function buildUrl(base: string, params: QueryParams = {}): string {
  const url = new URL(base)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

/** Fetches JSON from a URL, normalizing failures into ApiError. */
export async function getJson<T>(
  url: string,
  options: { headers?: Record<string, string>; signal?: AbortSignal } = {},
): Promise<T> {
  let response: Response
  try {
    response = await fetch(url, {
      headers: options.headers,
      signal: options.signal,
    })
  } catch (error) {
    // Let query cancellation propagate; wrap real network failures.
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw error
    }
    throw new ApiError('Network error while contacting the news provider')
  }

  if (!response.ok) {
    throw new ApiError(`Request failed with status ${response.status}`, response.status)
  }

  return response.json() as Promise<T>
}
