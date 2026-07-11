#!/usr/bin/env node
// Scaffolds and wires a new news source: creates the adapter (source + mapper +
// types) and a test stub, then edits the registry, env example, Dockerfile,
// compose file, and Vite env types. Everything is validated first and only
// written if every edit anchor resolves — a failed run changes nothing.
//
//   npm run new:source -- <id> "<Display Name>" [ENV_TOKEN] [registrationUrl]
//   npm run new:source            # prompts for anything missing (in a TTY)

import { existsSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline/promises'
import { stdin, stdout, argv, exit } from 'node:process'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const rel = (...s) => join(ROOT, ...s)
const readLF = (path) => readFileSync(path, 'utf8').replace(/\r\n/g, '\n')
const writeLF = (path, content) =>
  writeFileSync(path, content.replace(/\r\n/g, '\n'), 'utf8')

function fail(message) {
  console.error(`\n✖ ${message}\n`)
  exit(1)
}

const USAGE = `Usage: npm run new:source -- <id> "<Display Name>" [ENV_TOKEN] [registrationUrl]
  id     lowercase letters/digits, starting with a letter (e.g. npr)
  name   display name, quoted (e.g. "NPR")
  token  env-var token; defaults to the id uppercased (e.g. npr -> VITE_NPR_API_KEY)
Run with no args inside a terminal to be prompted.`

// ----------------------------------------------------------------------------
// 1. Gather inputs (positional args, with an interactive fallback in a TTY)
// ----------------------------------------------------------------------------

let [id, name, token, url] = argv.slice(2)
let interactive = false

if (!id || !name) {
  if (!stdin.isTTY) {
    console.error(USAGE)
    exit(1)
  }
  interactive = true
  const rl = createInterface({ input: stdin, output: stdout })
  id = (id || (await rl.question('Source id (lowercase, e.g. npr): '))).trim()
  name = (name || (await rl.question('Display name (e.g. NPR): '))).trim()
  const tokenDefault = id.toUpperCase()
  token =
    (token || (await rl.question(`Env token [${tokenDefault}]: `))).trim() || tokenDefault
  url = (url || (await rl.question('Registration URL (optional): '))).trim()
  rl.close()
}

id = (id || '').toLowerCase()
name = (name || '').trim()
// Normalise the token to just the distinctive part: the env var is always
// VITE_<TOKEN>_API_KEY, so strip a stray VITE_ prefix or _API_KEY suffix a
// user may include (e.g. "PUB_NEWSDATA_API_KEY" -> "PUB_NEWSDATA").
token = (token || id.toUpperCase())
  .toUpperCase()
  .replace(/^VITE_/, '')
  .replace(/_API_KEY$/, '')
url = (url || '').trim()

if (!/^[a-z][a-z0-9]*$/.test(id)) {
  fail(
    `Invalid id "${id}". Use lowercase letters/digits starting with a letter.\n\n${USAGE}`,
  )
}
if (!name) fail(`A display name is required.\n\n${USAGE}`)
if (!/^[A-Z][A-Z0-9_]*$/.test(token)) {
  fail(`Invalid env token "${token}". Use uppercase letters/digits/underscores.`)
}

// Derived identifiers
const Pascal = id.charAt(0).toUpperCase() + id.slice(1)
const Class = `${Pascal}Source`
const envVar = `VITE_${token}_API_KEY`
const registrationUrl = url || 'TODO: add registration URL'

// ----------------------------------------------------------------------------
// 2. Paths + preflight (abort before writing anything)
// ----------------------------------------------------------------------------

const adapterDir = rel('src/services/news/adapters', id)
const sourcePath = join(adapterDir, `${id}Source.ts`)
const mapPath = join(adapterDir, 'mapArticle.ts')
const typesPath = join(adapterDir, 'types.ts')
const testPath = rel('src/test/services/news/adapters', `${id}Source.test.ts`)

const registryPath = rel('src/services/news/registry.ts')
const viteEnvPath = rel('src/vite-env.d.ts')
const envExamplePath = rel('.env.example')
const dockerfilePath = rel('Dockerfile')
const composePath = rel('docker-compose.yml')

if (existsSync(adapterDir)) fail(`Source "${id}" already exists (${adapterDir}).`)

const registrySrc = readLF(registryPath)
const viteEnvSrc = readLF(viteEnvPath)
const envExampleSrc = readLF(envExamplePath)
const dockerfileSrc = readLF(dockerfilePath)
const composeSrc = readLF(composePath)

if (registrySrc.includes(`new ${Class}(`))
  fail(`registry.ts already references ${Class}.`)
if (viteEnvSrc.includes(envVar) || registrySrc.includes(envVar)) {
  fail(`Env token "${token}" is already in use (${envVar}). Pass a different token.`)
}

// ----------------------------------------------------------------------------
// 3. Compute the five edits (throws if an anchor is missing — nothing written)
// ----------------------------------------------------------------------------

function lastIndexMatching(lines, re) {
  for (let i = lines.length - 1; i >= 0; i -= 1) if (re.test(lines[i])) return i
  return -1
}

function editRegistry(src) {
  const importMarker = "import type { NewsSource } from './NewsSource'"
  if (!src.includes(importMarker)) {
    throw new Error('registry.ts: could not find the NewsSource import anchor')
  }
  const importLine = `import { ${Class} } from './adapters/${id}/${id}Source'\n`
  let out = src.replace(importMarker, importLine + importMarker)

  const arrayRe = /(export const ALL_SOURCES: NewsSource\[\] = \[\n)([\s\S]*?)(\n\])/
  if (!arrayRe.test(out)) {
    throw new Error('registry.ts: could not find the ALL_SOURCES array anchor')
  }
  const entry = `  new ${Class}(readKey(import.meta.env.${envVar})),`
  out = out.replace(
    arrayRe,
    (_m, open, body, close) => `${open}${body}\n${entry}${close}`,
  )
  return out
}

function editViteEnv(src) {
  const re = /(interface ImportMetaEnv \{\n)([\s\S]*?)(\n\})/
  if (!re.test(src))
    throw new Error('vite-env.d.ts: could not find the ImportMetaEnv block')
  const line = `  readonly ${envVar}?: string`
  return src.replace(re, (_m, open, body, close) => `${open}${body}\n${line}${close}`)
}

function editEnvExample(src) {
  const base = src.endsWith('\n') ? src : `${src}\n`
  return `${base}\n# ${name} — register at ${registrationUrl}\n${envVar}=\n`
}

function editDockerfile(src) {
  const lines = src.split('\n')
  const argIdx = lastIndexMatching(lines, /^ARG VITE_\w+_API_KEY$/)
  if (argIdx === -1)
    throw new Error('Dockerfile: could not find an ARG VITE_*_API_KEY anchor')
  lines.splice(argIdx + 1, 0, `ARG ${envVar}`)
  const envIdx = lastIndexMatching(lines, /VITE_\w+_API_KEY=\$VITE_\w+_API_KEY/)
  if (envIdx === -1) throw new Error('Dockerfile: could not find the ENV VITE_* block')
  lines.splice(envIdx + 1, 0, `ENV ${envVar}=$${envVar}`)
  return lines.join('\n')
}

function editCompose(src) {
  const lines = src.split('\n')
  const re = /^(\s*)VITE_\w+_API_KEY: \$\{VITE_\w+_API_KEY:-\}$/
  const idx = lastIndexMatching(lines, re)
  if (idx === -1)
    throw new Error('docker-compose.yml: could not find the build args anchor')
  const indent = lines[idx].match(/^(\s*)/)[1]
  lines.splice(idx + 1, 0, `${indent}${envVar}: \${${envVar}:-}`)
  return lines.join('\n')
}

let edits
try {
  edits = {
    [registryPath]: editRegistry(registrySrc),
    [viteEnvPath]: editViteEnv(viteEnvSrc),
    [envExamplePath]: editEnvExample(envExampleSrc),
    [dockerfilePath]: editDockerfile(dockerfileSrc),
    [composePath]: editCompose(composeSrc),
  }
} catch (error) {
  fail(`${error.message}\nNo files were changed.`)
}

// ----------------------------------------------------------------------------
// 4. Templates for the four new files
// ----------------------------------------------------------------------------

const fill = (t) =>
  t
    .replaceAll('%PASCAL%', Pascal)
    .replaceAll('%CLASS%', Class)
    .replaceAll('%ENV%', envVar)
    .replaceAll('%NAME%', name)
    .replaceAll('%ID%', id)

const typesTemplate =
  fill(`/** Raw shapes returned by the %NAME% API. TODO: match the real response. */

export interface %PASCAL%RawArticle {
  // TODO: replace with the provider's real article fields.
  title: string
  url: string
  publishedAt: string
  description?: string
  imageUrl?: string
  author?: string
}

export interface %PASCAL%Response {
  // TODO: match the provider's envelope (e.g. { response: { results } }).
  articles: %PASCAL%RawArticle[]
  total?: number
}
`)

const mapTemplate = fill(`import type { Article } from '../../../../domain/article'
import type { Category } from '../../../../domain/category'
import type { %PASCAL%RawArticle } from './types'

/**
 * Maps a raw %NAME% article into the domain Article shape.
 * TODO: adjust the field mapping and any provider quirks (HTML stripping,
 * relative image URLs, byline normalization, dropped placeholder entries).
 */
export function map%PASCAL%Article(
  raw: %PASCAL%RawArticle,
  fallbackCategory?: Category,
): Article {
  return {
    id: \`%ID%:\${raw.url}\`,
    sourceId: '%ID%',
    sourceName: '%NAME%',
    title: raw.title,
    description: raw.description,
    url: raw.url,
    imageUrl: raw.imageUrl,
    author: raw.author,
    category: fallbackCategory,
    publishedAt: raw.publishedAt,
  }
}
`)

const sourceTemplate =
  fill(`import type { ArticlePage, ArticleQuery } from '../../../../domain/article'
import { CATEGORIES } from '../../../../domain/category'
import { buildUrl } from '../../http'
import { HttpNewsSource, type SourceRequest } from '../../HttpNewsSource'
import type { SourceCapabilities } from '../../NewsSource'
import { map%PASCAL%Article } from './mapArticle'
import type { %PASCAL%Response } from './types'

// TODO: point this at the real API base URL.
const BASE_URL = 'https://api.example.com'

/**
 * Builds the request URL for a query, without the API key. Exported for tests.
 * TODO: translate ArticleQuery into the provider's real query parameters.
 */
export function build%PASCAL%RequestUrl(query: ArticleQuery): string {
  return buildUrl(BASE_URL, {
    q: query.keyword,
    page: query.page,
    pageSize: query.pageSize,
  })
}

export class %CLASS% extends HttpNewsSource<%PASCAL%Response> {
  readonly id = '%ID%'
  readonly name = '%NAME%'
  // TODO: declare what this source can actually filter on. If the provider
  // paginates by an opaque token instead of a page number (e.g. Newsdata),
  // add \`pagination: 'cursor'\` here, read \`query.cursor\` in buildRequest, and
  // return \`nextCursor\` from parseResponse (see the newsdata adapter).
  readonly capabilities: SourceCapabilities = {
    categories: CATEGORIES,
    dateFilter: false,
    dateFilterWithCategory: false,
  }

  protected buildRequest(query: ArticleQuery): SourceRequest {
    const requestUrl = new URL(build%PASCAL%RequestUrl(query))
    // TODO: if the provider takes the key as a header instead, return:
    //   { url: build%PASCAL%RequestUrl(query), headers: { 'X-Api-Key': this.apiKey ?? '' } }
    requestUrl.searchParams.set('api-key', this.apiKey ?? '')
    return { url: requestUrl.toString() }
  }

  protected parseResponse(data: %PASCAL%Response, query: ArticleQuery): ArticlePage {
    return {
      articles: data.articles.map((raw) => map%PASCAL%Article(raw, query.category)),
      totalResults: data.total ?? data.articles.length,
      // Offset pagination: more pages while we haven't reached the total. For a
      // cursor source, use \`hasMore: Boolean(data.nextPage)\` + \`nextCursor\`.
      hasMore: query.page * query.pageSize < (data.total ?? 0),
    }
  }
}
`)

const testTemplate = fill(`import { describe, expect, it } from 'vitest'
import {
  build%PASCAL%RequestUrl,
  %CLASS%,
} from '@/services/news/adapters/%ID%/%ID%Source'

describe('build%PASCAL%RequestUrl', () => {
  it('never includes the API key', () => {
    expect(build%PASCAL%RequestUrl({ page: 1, pageSize: 20 })).not.toContain('api-key')
  })
})

describe('%CLASS%', () => {
  it('is unconfigured without an API key', () => {
    expect(new %CLASS%(undefined).isConfigured()).toBe(false)
  })

  it('is configured with an API key', () => {
    expect(new %CLASS%('test-key').isConfigured()).toBe(true)
  })

  it.todo('maps a raw article into the domain shape')
  it.todo('parses a response page (totalResults + hasMore)')
})
`)

// ----------------------------------------------------------------------------
// 5. Confirm (interactive only), then write transactionally
// ----------------------------------------------------------------------------

console.log(`\nScaffolding a news source:
  id        ${id}
  name      ${name}
  class     ${Class}
  env var   ${envVar}
  adapter   src/services/news/adapters/${id}/
  test      src/test/services/news/adapters/${id}Source.test.ts`)

if (interactive) {
  const rl = createInterface({ input: stdin, output: stdout })
  const answer = (await rl.question('\nProceed? [Y/n] ')).trim().toLowerCase()
  rl.close()
  if (answer && answer !== 'y' && answer !== 'yes')
    fail('Aborted. No files were changed.')
}

const newFiles = {
  [typesPath]: typesTemplate,
  [mapPath]: mapTemplate,
  [sourcePath]: sourceTemplate,
  [testPath]: testTemplate,
}

try {
  // New files first, so a mid-write crash never leaves the registry importing a
  // module that does not exist yet.
  mkdirSync(adapterDir, { recursive: true })
  mkdirSync(dirname(testPath), { recursive: true })
  for (const [path, content] of Object.entries(newFiles)) writeLF(path, content)
  for (const [path, content] of Object.entries(edits)) writeLF(path, content)
} catch (error) {
  // Roll back: restore the five originals and remove the new files.
  writeLF(registryPath, registrySrc)
  writeLF(viteEnvPath, viteEnvSrc)
  writeLF(envExamplePath, envExampleSrc)
  writeLF(dockerfilePath, dockerfileSrc)
  writeLF(composePath, composeSrc)
  rmSync(adapterDir, { recursive: true, force: true })
  rmSync(testPath, { force: true })
  fail(`Write failed; reverted. ${error.message}`)
}

// ----------------------------------------------------------------------------
// 6. Format the Prettier-managed files (required — format:check is a gate)
// ----------------------------------------------------------------------------

const prettier = await import('prettier')
const toFormat = [...Object.keys(newFiles), registryPath, viteEnvPath, composePath]
try {
  for (const path of toFormat) {
    const config = await prettier.resolveConfig(path)
    const formatted = await prettier.format(readFileSync(path, 'utf8'), {
      ...config,
      filepath: path,
    })
    writeLF(path, formatted)
  }
} catch (error) {
  fail(
    `Files were written but Prettier failed on them: ${error.message}\n` +
      `Run "npm run format" and inspect the generated files.`,
  )
}

// ----------------------------------------------------------------------------
// 7. Report
// ----------------------------------------------------------------------------

console.log(`
✓ Created  src/services/news/adapters/${id}/{${id}Source,mapArticle,types}.ts
✓ Created  src/test/services/news/adapters/${id}Source.test.ts
✓ Wired    registry.ts, vite-env.d.ts, .env.example, Dockerfile, docker-compose.yml
✓ Formatted the generated + edited TypeScript/YAML files

Next steps:
  1. types.ts        — define the provider's real response shape
  2. ${id}Source.ts  — set BASE_URL + build the request (buildRequest)
  3. mapArticle.ts   — map the raw fields to the domain Article
  4. Add your key to .env:  ${envVar}=your_key
  5. Verify:  npm run build && npm test

The source is inert until ${envVar} is set, so the app keeps working now.
`)
