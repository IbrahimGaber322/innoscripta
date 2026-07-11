import { expect, test, type Page } from '@playwright/test'

/** One deterministic Guardian article, shaped like the real search response. */
const GUARDIAN_RESPONSE = {
  response: {
    status: 'ok',
    total: 1,
    pages: 1,
    currentPage: 1,
    results: [
      {
        id: 'technology/2026/feb/10/newshub-smoke-test',
        sectionId: 'technology',
        sectionName: 'Technology',
        webPublicationDate: '2026-02-10T09:00:00Z',
        webTitle: 'NewsHub smoke-test headline',
        webUrl: 'https://www.theguardian.com/technology/2026/feb/10/newshub-smoke-test',
        fields: {
          trailText: 'A deterministic article served to the end-to-end smoke test.',
          byline: 'Alex Hern',
        },
      },
    ],
  },
}

/**
 * Serve the Guardian article and stub the other providers, so the smoke test
 * exercises the real app end-to-end without depending on live news APIs, real
 * keys, or network access. Aborted providers simply degrade to warning chips.
 */
async function stubNews(page: Page) {
  await page.route(/content\.guardianapis\.com/, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(GUARDIAN_RESPONSE),
    }),
  )
  await page.route(/newsapi\.org|api\.nytimes\.com|newsdata\.io/, (route) =>
    route.abort(),
  )
}

test.beforeEach(async ({ page }) => {
  await stubNews(page)
})

test('loads the front page and opens an article in the reader', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('link', { name: 'NewsHub' }).first()).toBeVisible()
  await expect(page.getByRole('heading', { level: 1, name: 'Latest news' })).toBeVisible()

  const headline = page.getByRole('link', { name: 'NewsHub smoke-test headline' })
  await expect(headline).toBeVisible()

  await headline.click()
  await expect(page).toHaveURL(/\/article\//)
  await expect(
    page.getByRole('heading', { name: 'NewsHub smoke-test headline' }),
  ).toBeVisible()
})

test('navigates the main sections and searches by keyword', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('link', { name: 'For You' }).click()
  await expect(page).toHaveURL(/\/for-you/)
  await expect(page.getByText('Your briefing, built from')).toBeVisible()

  await page.getByRole('link', { name: 'Settings' }).click()
  await expect(page).toHaveURL(/\/settings/)
  await expect(page.getByRole('heading', { level: 1, name: 'Settings' })).toBeVisible()

  await page.getByRole('link', { name: 'Home' }).click()
  await page.getByRole('searchbox', { name: 'Search articles' }).fill('climate')
  await expect(page).toHaveURL(/[?&]q=climate/)
  await expect(page.getByRole('heading', { level: 1, name: /Results for/ })).toBeVisible()
})
