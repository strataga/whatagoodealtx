import { readFile, rename, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import Database from 'better-sqlite3'
import { XMLParser } from 'fast-xml-parser'
import { isUnexpired, validateItemId, validateThumbnailUrl } from './catalog-core.mjs'

const COMPATIBILITY_LEVEL = '1193'
const PAGE_SIZE = 200
const MAX_SELLING_PAGES = 1_000
const PROVIDER_TIMEOUT_MS = 30_000
const OAUTH_SCOPES = [
  'https://api.ebay.com/oauth/api_scope',
  'https://api.ebay.com/oauth/api_scope/sell.inventory',
  'https://api.ebay.com/oauth/api_scope/sell.account.readonly',
]

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
  removeNSPrefix: true,
  parseTagValue: false,
  trimValues: true,
  isArray: (_name, jpath) => jpath.endsWith('.Item') || jpath.endsWith('.CustomCategory'),
})

function array(value) {
  if (value == null) return []
  return Array.isArray(value) ? value : [value]
}

function text(value) {
  if (value == null) return ''
  if (typeof value === 'object' && '#text' in value) return String(value['#text']).trim()
  return String(value).trim()
}

function responseRoot(xml, name) {
  const parsed = parser.parse(xml)
  const root = parsed[`${name}Response`]
  if (!root) throw new Error(`${name} returned malformed XML.`)
  const ack = text(root.Ack)
  if (ack && ack !== 'Success' && ack !== 'Warning') {
    const errors = array(root.Errors).map((error) => text(error.LongMessage || error.ShortMessage)).filter(Boolean)
    throw new Error(`${name} returned ${ack}${errors.length ? `: ${errors.join('; ')}` : '.'}`)
  }
  return root
}

async function providerFetch(fetchImpl, url, init, operation) {
  try {
    return await fetchImpl(url, {
      ...init,
      signal: AbortSignal.timeout(PROVIDER_TIMEOUT_MS),
    })
  } catch (error) {
    if (error?.name === 'AbortError' || error?.name === 'TimeoutError') {
      throw new Error(`${operation} timed out; retry catalog sync.`)
    }
    throw error
  }
}

export function parseOptionalLiveThumbnail(value) {
  const url = text(value)
  if (!url) return ''
  try {
    return validateThumbnailUrl(url)
  } catch {
    return ''
  }
}

export function selectFirstValidThumbnail(...candidates) {
  for (const candidate of candidates) {
    try {
      return validateThumbnailUrl(candidate)
    } catch {
      // Try the next provider-owned candidate before declaring the image unavailable.
    }
  }
  return ''
}

export function parseSellingPage(xml) {
  const root = responseRoot(xml, 'GetMyeBaySelling')
  const active = root.ActiveList ?? {}
  const items = array(active.ItemArray?.Item).map((item) => ({
    itemId: validateItemId(text(item.ItemID)),
    thumbnailUrl: parseOptionalLiveThumbnail(item.PictureDetails?.GalleryURL),
    storeCategoryId: text(item.Storefront?.StoreCategoryID),
  }))
  const pageCount = text(active.PaginationResult?.TotalNumberOfPages)
  const totalPages = pageCount ? Number(pageCount) : 1
  if (!Number.isSafeInteger(totalPages) || totalPages < 1 || totalPages > MAX_SELLING_PAGES) {
    throw new Error(`GetMyeBaySelling returned an invalid page count (maximum ${MAX_SELLING_PAGES}).`)
  }
  return { items, totalPages }
}

function flattenCategories(nodes, parentId = '', output = []) {
  for (const node of array(nodes)) {
    const categoryId = text(node.CategoryID)
    const name = text(node.Name)
    if (categoryId && name) {
      output.push({
        categoryId,
        parentCategoryId: parentId,
        name,
        displayOrder: Number(text(node.Order)) || output.length,
      })
      flattenCategories(node.ChildCategory, categoryId, output)
    }
  }
  return output
}

export function parseStoreCategories(xml) {
  const root = responseRoot(xml, 'GetStore')
  return flattenCategories(root.Store?.CustomCategories?.CustomCategory)
}

export async function readEnvFile(envPath) {
  const content = await readFile(envPath, 'utf8')
  const env = {}
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue
    const separator = trimmed.indexOf('=')
    const key = trimmed.slice(0, separator).trim()
    const value = trimmed.slice(separator + 1).trim().replace(/^(['"])(.*)\1$/, '$2')
    env[key] = value
  }
  for (const key of ['EBAY_CLIENT_ID', 'EBAY_CLIENT_SECRET', 'EBAY_REFRESH_TOKEN']) {
    if (!env[key]) throw new Error(`${key} is missing from the external eBay configuration.`)
  }
  return env
}

function providerBase(environment) {
  return environment === 'sandbox' ? 'https://api.sandbox.ebay.com' : 'https://api.ebay.com'
}

export async function fetchAccessToken(env, fetchImpl = fetch) {
  const environment = String(env.EBAY_ENVIRONMENT ?? 'production').toLowerCase() === 'sandbox' ? 'sandbox' : 'production'
  const endpoint = `${providerBase(environment)}/identity/v1/oauth2/token`
  const request = async (includeScope) => {
    const body = new URLSearchParams({ grant_type: 'refresh_token', refresh_token: env.EBAY_REFRESH_TOKEN })
    if (includeScope) body.set('scope', OAUTH_SCOPES.join(' '))
    return providerFetch(fetchImpl, endpoint, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Authorization: `Basic ${Buffer.from(`${env.EBAY_CLIENT_ID}:${env.EBAY_CLIENT_SECRET}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    }, 'eBay OAuth refresh')
  }
  let response = await request(true)
  let payload = await response.json().catch(() => ({}))
  if (!response.ok && payload.error === 'invalid_scope') {
    response = await request(false)
    payload = await response.json().catch(() => ({}))
  }
  if (!response.ok || !payload.access_token) {
    throw new Error(`eBay OAuth refresh failed with HTTP ${response.status}.`)
  }
  return { accessToken: payload.access_token, environment }
}

function sellingRequest(page) {
  return `<GetMyeBaySellingRequest xmlns="urn:ebay:apis:eBLBaseComponents"><Version>${COMPATIBILITY_LEVEL}</Version><DetailLevel>ReturnAll</DetailLevel><ActiveList><Include>true</Include><Pagination><EntriesPerPage>${PAGE_SIZE}</EntriesPerPage><PageNumber>${page}</PageNumber></Pagination></ActiveList></GetMyeBaySellingRequest>`
}

function storeRequest() {
  return `<GetStoreRequest xmlns="urn:ebay:apis:eBLBaseComponents"><Version>${COMPATIBILITY_LEVEL}</Version><CategoryStructureOnly>true</CategoryStructureOnly></GetStoreRequest>`
}

async function tradingCall(environment, accessToken, callName, body, fetchImpl) {
  const response = await providerFetch(fetchImpl, `${providerBase(environment)}/ws/api.dll`, {
    method: 'POST',
    headers: {
      Accept: 'text/xml',
      'Content-Type': 'text/xml',
      'X-EBAY-API-CALL-NAME': callName,
      'X-EBAY-API-COMPATIBILITY-LEVEL': COMPATIBILITY_LEVEL,
      'X-EBAY-API-IAF-TOKEN': accessToken,
      'X-EBAY-API-SITEID': '0',
    },
    body: body.trimStart().startsWith('<?xml')
      ? body
      : `<?xml version="1.0" encoding="utf-8"?>${body}`,
  }, callName)
  const xml = await response.text()
  if (!response.ok) throw new Error(`${callName} failed with HTTP ${response.status}.`)
  return xml
}

export async function fetchLiveMedia(environment, accessToken, fetchImpl = fetch) {
  const items = []
  let totalPages = 1
  for (let page = 1; page <= totalPages; page += 1) {
    const result = parseSellingPage(await tradingCall(environment, accessToken, 'GetMyeBaySelling', sellingRequest(page), fetchImpl))
    items.push(...result.items)
    totalPages = result.totalPages
  }
  const categories = parseStoreCategories(await tradingCall(environment, accessToken, 'GetStore', storeRequest(), fetchImpl))
  return { items, categories }
}

export function loadDatabaseFallbacks(databasePath, now = new Date()) {
  const db = new Database(databasePath, { readonly: true, fileMustExist: true })
  try {
    const mediaRows = db.prepare(`
      SELECT inventory.ebay_item_id AS itemId,
             hosted.max_dimension_image_url AS maximumThumbnailCandidate,
             hosted.image_url AS standardThumbnailCandidate,
             hosted.expiration_date AS expiresAt
      FROM inventory_items AS inventory
      JOIN image_assets AS asset ON asset.listing_id = inventory.listing_id
      JOIN hosted_images AS hosted ON hosted.image_asset_id = asset.id
      WHERE inventory.ebay_item_id IS NOT NULL
        AND hosted.status = 'hosted'
        AND hosted.expiration_date IS NOT NULL
      ORDER BY inventory.updated_at DESC, hosted.updated_at DESC
    `).all()
    const byId = new Map()
    for (const row of mediaRows) {
      if (!isUnexpired(row.expiresAt, now)) continue
      try {
        const itemId = validateItemId(row.itemId)
        const thumbnailUrl = selectFirstValidThumbnail(
          row.maximumThumbnailCandidate,
          row.standardThumbnailCandidate,
        )
        if (!thumbnailUrl) continue
        if (!byId.has(itemId)) byId.set(itemId, {})
        const value = byId.get(itemId)
        if (!value.thumbnailUrl) value.thumbnailUrl = thumbnailUrl
      } catch {
        // Ignore legacy provider data that does not satisfy the public allowlist.
      }
    }
    const categoryRows = db.prepare(`
      SELECT inventory.ebay_item_id AS itemId,
             draft.store_category_id AS storeCategoryId
      FROM inventory_items AS inventory
      JOIN listing_drafts AS draft ON draft.id = inventory.listing_draft_id
      WHERE inventory.ebay_item_id IS NOT NULL
        AND draft.store_category_id IS NOT NULL
        AND TRIM(draft.store_category_id) != ''
      ORDER BY inventory.updated_at DESC
    `).all()
    for (const row of categoryRows) {
      try {
        const itemId = validateItemId(row.itemId)
        if (!byId.has(itemId)) byId.set(itemId, {})
        const value = byId.get(itemId)
        if (!value.storeCategoryId && /^\d+$/.test(row.storeCategoryId)) value.storeCategoryId = row.storeCategoryId
      } catch {
        // Ignore malformed legacy rows from the external read-only database.
      }
    }
    return byId
  } finally {
    db.close()
  }
}

export function loadOptionalDatabaseFallbacks(databasePath, now = new Date(), warn = console.warn) {
  try {
    return loadDatabaseFallbacks(databasePath, now)
  } catch (error) {
    const storageUnavailable = error instanceof Database.SqliteError
      || ['SQLITE_CANTOPEN', 'ENOENT', 'EACCES'].includes(error?.code)
    if (storageUnavailable) {
      warn('Catalog fallback database is unavailable; continuing with live eBay media.')
      return new Map()
    }
    throw error
  }
}

export function redactError(error, secrets = []) {
  let message = error instanceof Error ? error.message : String(error)
  for (const secret of secrets.filter(Boolean)) message = message.split(secret).join('[REDACTED]')
  return message
}

export async function atomicWriteJson(destination, value, hooks = {}) {
  const temporary = `${destination}.tmp-${process.pid}-${Date.now()}`
  try {
    await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { encoding: 'utf8', mode: 0o644 })
    await hooks.beforeRename?.(temporary)
    await rename(temporary, destination)
  } catch (error) {
    await rm(temporary, { force: true }).catch(() => {})
    throw error
  }
}

export function resolveCategoryName(categoryId, categories) {
  const byId = new Map(categories.map((category) => [category.categoryId, category]))
  const visited = new Set()
  let current = byId.get(categoryId)
  for (let depth = 0; current?.parentCategoryId && byId.has(current.parentCategoryId); depth += 1) {
    if (depth >= categories.length || visited.has(current.categoryId)) return 'Other'
    visited.add(current.categoryId)
    current = byId.get(current.parentCategoryId)
  }
  return current?.name || 'Other'
}

export function mergeActiveCatalogMedia(activeIds, live, fallbacks) {
  const liveById = new Map(live.items.map((item) => [item.itemId, item]))
  return [...activeIds].sort().map((itemId) => {
    const current = liveById.get(itemId)
    if (!current) throw new Error(`CSV listing ${itemId} is not present in the active eBay response.`)
    const fallback = fallbacks.get(itemId)
    const thumbnailUrl = current.thumbnailUrl || fallback?.thumbnailUrl
    if (!thumbnailUrl) throw new Error(`Active CSV listing ${itemId} has no valid current thumbnail.`)
    const storeCategoryId = current.storeCategoryId || fallback?.storeCategoryId || '1'
    return {
      itemId,
      thumbnailUrl,
      storeCategoryId,
      categoryName: resolveCategoryName(storeCategoryId, live.categories),
    }
  })
}

export function defaultExternalPaths(homeDirectory) {
  return {
    databasePath: path.join(homeDirectory, 'Library', 'Application Support', 'com.strataga.ebay-inserter', 'ebay-inserter.sqlite'),
    envPath: path.join(homeDirectory, 'projects', 'ebay-inserter', '.env.local'),
  }
}
