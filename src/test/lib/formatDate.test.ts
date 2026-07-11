import { describe, expect, it } from 'vitest'
import { formatDate } from '@/lib/formatDate'

describe('formatDate', () => {
  it('formats an ISO timestamp in UTC, matching the UTC-based date filter', () => {
    // An evening-UTC date must not roll to the next day for readers ahead of
    // UTC (e.g. GMT+2), or it would appear to fall outside a "to" filter it
    // actually honors. This assertion is timezone-independent.
    expect(formatDate('2026-02-14T23:49:17Z')).toBe('Feb 14, 2026')
    expect(formatDate('2026-07-03T12:00:00Z')).toBe('Jul 3, 2026')
  })

  it('falls back to the raw string for an unparsable value', () => {
    expect(formatDate('not-a-date')).toBe('not-a-date')
  })
})
