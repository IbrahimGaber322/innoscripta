const formatter = new Intl.DateTimeFormat('en', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
})

/** "2026-07-03T12:00:00Z" → "Jul 3, 2026"; falls back to the raw string. */
export function formatDate(isoDate: string): string {
  const timestamp = Date.parse(isoDate)
  return Number.isNaN(timestamp) ? isoDate : formatter.format(timestamp)
}
