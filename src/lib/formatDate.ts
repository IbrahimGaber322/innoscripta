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

const fullFormatter = new Intl.DateTimeFormat('en', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

/** Today as "Wednesday, July 9, 2026" for the page masthead. */
export function formatToday(): string {
  return fullFormatter.format(new Date())
}

/** A time-of-day greeting for the personalized feed header. */
export function greeting(now: Date = new Date()): string {
  const hour = now.getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
