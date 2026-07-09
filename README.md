# News Aggregator

A news aggregator built with **React + TypeScript** that pulls articles from
**NewsAPI.org**, **The Guardian**, and **The New York Times** and presents them
in a clean, mobile-friendly interface.

## Features

| Requirement                                                                     | Where it lives                                                                                                                                                                                                                     |
| ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Search & filtering** — keyword search with date, category, and source filters | Home page. Categories are multi-select tabs; sources and dates live in an expandable Filters panel. Filter state lives in the URL, so searches are shareable, survive refreshes, and the back button walks through filter history. |
| **Personalized feed** — preferred sources, categories, and followed authors     | _For You_ page, configured on the _Settings_ page. Preferences persist in `localStorage`. Articles by followed authors are pinned to the top of the feed.                                                                          |
| **Mobile-responsive design**                                                    | Tailwind CSS throughout: the article grid collapses 3 → 2 → 1 columns and the header switches to a hamburger menu on small screens.                                                                                                |

Additional behavior worth knowing about:

- **Editorial front page** — browsing (no keyword) is laid out like a
  newspaper: a lead-story package (a large story beside a rail of latest
  headlines), then per-category sections under coloured rules, a dark "Top
  headlines" box (the day's biggest stories from NewsAPI), and the rest under
  "Earlier this week". An active search collapses to a flat, relevance-first
  list.
- **Personalized For You** — a time-of-day greeting, persona chips showing
  what the feed is built from, a highlighted top pick, a "Because you follow X"
  topic spotlight, and per-source digests — all shaped by your preferences.
- **Infinite scroll** — both the Home and For You feeds load more as you
  approach the bottom (an `IntersectionObserver` sentinel drives
  `fetchNextPage`), with a spinner while loading and an "all caught up" divider
  at the end. No "load more" button.
- **In-app reader** — clicking an article opens a centred reader page with a
  byline avatar, a wide figure, and a "more like this" rail of same-topic
  stories. Guardian articles render their full body (fetched by content id and
  sanitized with DOMPurify); the other providers' APIs only share summaries, so
  those pages show everything available plus a link to the original story.
- **Graceful degradation** — every source is fetched independently
  (`Promise.allSettled`). A provider that is down, rate limited, or missing an
  API key becomes a warning chip; the rest of the page still renders.
- **Cross-source dedupe** — NewsAPI indexes `theguardian.com` and
  `nytimes.com`, so the same story can arrive twice. Duplicates are dropped by
  URL and title before rendering.
- **Rate-limit friendly** — searches are debounced (400 ms) and results are
  cached for 5 minutes (TanStack Query), which matters for the NYT free tier
  (~5 requests/minute).

## Choice of data sources

The challenge lists seven sources and asks for at least three. Three of the
seven have free, self-service public APIs, and those are the three used here:

| Source                                  | Why                                                                                                                                            |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **NewsAPI.org**                         | Aggregates 150k+ outlets; supports keyword, date, and category queries. (The list's "NewsAPI" and "NewsAPI.org" entries are the same product.) |
| **The Guardian** (Open Platform)        | The best-behaved API of the set — keyword, section, and date filters all compose in a single request.                                          |
| **The New York Times** (Article Search) | Full-archive keyword search with date and news-desk filtering.                                                                                 |

The remaining options were ruled out deliberately: **OpenNews** is a journalism
community, not an article API; **NewsCred** is an enterprise product with no
self-service access; **BBC News** has no official public API.

## Getting started

### 1. Get API keys (all free)

| Provider       | Where                                           | Notes                                                                                                                             |
| -------------- | ----------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| NewsAPI.org    | <https://newsapi.org/register>                  | The free _Developer_ plan only allows browser requests **from localhost** — fine for this project run locally or in local Docker. |
| The Guardian   | <https://open-platform.theguardian.com/access/> | Register for a _developer_ key; it arrives by email.                                                                              |
| New York Times | <https://developer.nytimes.com/get-started>     | Create an app and **enable the "Article Search API"** for it.                                                                     |

The app runs with any subset of keys — sources without a key are skipped and
flagged in the UI — but three keys give the full experience.

### 2. Configure the environment

```bash
cp .env.example .env
# then fill in the three VITE_* keys
```

### 3a. Run locally

Requires Node 20+.

```bash
npm install
npm run dev          # http://localhost:5173
```

### 3b. Run with Docker

```bash
docker compose up --build     # http://localhost:8080
```

Compose reads the keys from `.env` automatically. Without compose:

```bash
docker build -t news-aggregator \
  --build-arg VITE_NEWSAPI_API_KEY=your_key \
  --build-arg VITE_GUARDIAN_API_KEY=your_key \
  --build-arg VITE_NYT_API_KEY=your_key .

docker run --rm -p 8080:80 news-aggregator
```

The image is a multi-stage build: Node compiles the app, nginx serves the
static bundle (~93 MB final image) with an SPA fallback so deep links like
`/for-you` work on hard refresh.

### Other scripts

```bash
npm run test          # unit tests (Vitest + React Testing Library)
npm run lint          # oxlint
npm run format        # Prettier
npm run build         # type-check + production build
```

## Architecture

```
                          ┌──────────────────────────────┐
  UI (pages, hooks)  ───► │  aggregator.fetchAggregated  │
                          └──────────────┬───────────────┘
                                         │ fans out via Promise.allSettled,
                                         │ merges + dedupes + sorts,
                                         │ isolates per-source failures
              ┌──────────────────────────┼──────────────────────────┐
              ▼                          ▼                          ▼
   ┌───────────────────┐     ┌───────────────────┐      ┌───────────────────┐
   │  NewsApiSource    │     │  GuardianSource   │      │  NytimesSource    │
   │  (adapter)        │     │  (adapter)        │      │  (adapter)        │
   └─────────┬─────────┘     └─────────┬─────────┘      └─────────┬─────────┘
             ▼                         ▼                          ▼
        NewsAPI.org              The Guardian                NYT Article
      /everything +             Open Platform                 Search API
      /top-headlines
```

- **`src/domain/`** — provider-agnostic types: `Article`, `ArticleQuery`,
  the `Category` vocabulary, and `Preferences`. The UI only ever sees these.
- **`src/services/news/`** — the data layer:
  - `NewsSource.ts` defines the contract every provider adapter implements,
    including a **capability declaration** (which categories it supports,
    whether date filters combine with category filters) so the aggregator
    handles provider differences honestly instead of guessing.
  - `adapters/<provider>/` — one folder per provider: request building
    (`*Source.ts`), a pure response-to-domain mapper (`mapArticle.ts`), and
    raw response types (`types.ts`). Mappers absorb every provider quirk:
    NewsAPI's `[Removed]` ghost entries, Guardian's HTML trail text, NYT's
    relative image URLs and `"By "` bylines.
  - `aggregator.ts` — fans a query out to eligible sources, merges the
    results, and turns failures into per-source errors.
  - `registry.ts` — the list of installed sources.
- **`src/services/preferences/`** — validated `localStorage` persistence for
  user preferences.
- **`src/context/`** — the `PreferencesProvider` React context that holds
  preference state and mirrors changes to storage.
- **`src/hooks/`** — `useSearchFilters` (URL ↔ filter state),
  `useArticleSearch` and `useForYouFeed` (paginated infinite queries over the
  aggregator, both fanning out per category via `fetchAcrossCategories`),
  `useInfiniteScroll` (sentinel that drives the next page), `usePreferences`.
- **`src/components/`** / **`src/pages/`** — presentational layer only.
- **`src/test/`** — all unit tests (mirroring the `src` layout via the `@`
  import alias) plus realistic provider response fixtures.

**Adding a fourth source is one adapter folder plus one line in
`registry.ts`** — no changes to the aggregator, hooks, or UI (open–closed
principle). Dependency inversion is the other pillar: consumers depend on the
`NewsSource` interface, never on a concrete provider.

### Design decisions

- **URL-driven filter state** over component state: shareable links, working
  back button, refresh-proof searches — and one source of truth.
- **TanStack Query** for server state (caching, cancellation, pagination,
  request dedup) and a small React context over `localStorage` for
  preferences. No global store — nothing here needs one (KISS).
- **Author preferences partition rather than filter.** None of the free tiers
  supports querying by author, and any single result page rarely contains a
  specific byline, so a hard filter would usually render an empty feed.
  Instead, articles by followed authors are pinned in a highlighted section
  above the rest of the feed.
- **Per-provider capabilities, not a lowest common denominator.** NewsAPI
  cannot combine date and category filters (they live on different endpoints)
  and supports fewer categories than the Guardian or NYT. Sources declare what
  they support, and the aggregator only sends queries a source can honor.
- **Build-time API keys.** Vite inlines `VITE_*` variables into the bundle, so
  the keys are visible in the shipped JavaScript. That is acceptable for a
  take-home running free-tier keys locally; a production deployment would put
  a thin proxy in front of the providers so keys stay server-side (this also
  lifts NewsAPI's localhost-only browser restriction).

### Tests

`npm run test` covers the parts with real logic:

- each adapter's mapper against realistic response fixtures (including the
  quirks: removed entries, HTML stripping, image URL prefixing, byline
  normalization, both NYT multimedia schemas),
- each adapter's request building (endpoint selection, date reformatting,
  pagination conversion, no key leakage into URLs),
- the aggregator (merging, sorting, dedupe, capability skipping, failure
  isolation),
- preferences storage (round-trip, corruption fallback, invalid-entry
  filtering),
- URL filter state (parsing, validation, round-trip serialization) and
  followed-author matching,
- key components (article card rendering, app routing).

## Known limitations

- **NewsAPI free tier is localhost-only in browsers** — it works in local dev
  and local Docker, but a deployed build would need the proxy described above.
  Free-tier articles also arrive with a ~24 h delay.
- **NYT rate limits are tight** (~5 requests/minute). The 5-minute cache and
  debounced search absorb normal usage; hammering filters can still surface a
  "rate limited" chip for a minute.
- **Category vocabularies differ per provider** and are mapped to a unified
  set; the mapping is intentionally approximate in places (e.g. Guardian
  `society` → _Health_, NYT `Arts` section → _Entertainment_).
- **NewsAPI date-only filtering** falls back to a broad keyword because its
  `/everything` endpoint requires a query term.
- **Selecting many categories multiplies requests** (one per category per
  source), so a large selection can briefly trip the NYT rate limit — it
  degrades to a warning chip while the other sources keep rendering.
