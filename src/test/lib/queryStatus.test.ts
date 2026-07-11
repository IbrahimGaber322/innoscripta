import { describe, expect, it } from 'vitest'
import { isBackgroundRefetching } from '@/lib/queryStatus'

describe('isBackgroundRefetching', () => {
  it('is true when refetching with content already on screen', () => {
    expect(
      isBackgroundRefetching({
        isFetching: true,
        isPending: false,
        isFetchingNextPage: false,
      }),
    ).toBe(true)
  })

  it('is false on the first load (that shows a skeleton instead)', () => {
    expect(
      isBackgroundRefetching({
        isFetching: true,
        isPending: true,
        isFetchingNextPage: false,
      }),
    ).toBe(false)
  })

  it('is false while appending the next infinite-scroll page', () => {
    expect(
      isBackgroundRefetching({
        isFetching: true,
        isPending: false,
        isFetchingNextPage: true,
      }),
    ).toBe(false)
  })

  it('is false when idle', () => {
    expect(
      isBackgroundRefetching({
        isFetching: false,
        isPending: false,
        isFetchingNextPage: false,
      }),
    ).toBe(false)
  })
})
