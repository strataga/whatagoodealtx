import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import Database from 'better-sqlite3'
import { isUnexpired, validateThumbnailUrl } from './catalog-core.mjs'
import { atomicWriteJson, fetchAccessToken, loadDatabaseFallbacks, parseOptionalLiveThumbnail, parseSellingPage, parseStoreCategories, redactError, selectFirstValidThumbnail } from './sync-support.mjs'

test('parses Trading pagination, gallery URLs, and Storefront categories', () => {
  const page = parseSellingPage(`
    <GetMyeBaySellingResponse><Ack>Success</Ack><ActiveList><ItemArray><Item>
      <ItemID>327123456789</ItemID><PictureDetails><GalleryURL>https://i.ebayimg.com/images/g/abc/s-l500.jpg</GalleryURL></PictureDetails>
      <Storefront><StoreCategoryID>24336127015</StoreCategoryID></Storefront>
    </Item></ItemArray><PaginationResult><TotalNumberOfPages>3</TotalNumberOfPages></PaginationResult></ActiveList></GetMyeBaySellingResponse>
  `)
  assert.equal(page.totalPages, 3)
  assert.equal(page.items[0].storeCategoryId, '24336127015')
  const categories = parseStoreCategories(`
    <GetStoreResponse><Ack>Success</Ack><Store><CustomCategories>
      <CustomCategory><CategoryID>1</CategoryID><Name>Other</Name><Order>0</Order></CustomCategory>
      <CustomCategory><CategoryID>2</CategoryID><Name>Toys &amp; Games</Name><Order>1</Order></CustomCategory>
    </CustomCategories></Store></GetStoreResponse>
  `)
  assert.equal(categories[1].name, 'Toys & Games')
})

test('OAuth refresh retries invalid scope without exposing credentials', async () => {
  const requests = []
  const fakeFetch = async (_url, init) => {
    requests.push(init)
    return requests.length === 1
      ? new Response(JSON.stringify({ error: 'invalid_scope' }), { status: 400 })
      : new Response(JSON.stringify({ access_token: 'temporary-access' }), { status: 200 })
  }
  const result = await fetchAccessToken({ EBAY_CLIENT_ID: 'client', EBAY_CLIENT_SECRET: 'secret', EBAY_REFRESH_TOKEN: 'refresh' }, fakeFetch)
  assert.equal(result.accessToken, 'temporary-access')
  assert.equal(requests.length, 2)
  assert.equal(requests.every((request) => request.signal instanceof AbortSignal), true)
  assert.equal(String(requests[1].body).includes('scope='), false)
  assert.equal(redactError(new Error('failed secret refresh temporary-access'), ['secret', 'refresh', 'temporary-access']), 'failed [REDACTED] [REDACTED] [REDACTED]')
})

test('provider timeouts surface a retryable error', async () => {
  const timedOutFetch = async () => {
    const error = new Error('provider stalled')
    error.name = 'TimeoutError'
    throw error
  }
  await assert.rejects(
    fetchAccessToken({ EBAY_CLIENT_ID: 'client', EBAY_CLIENT_SECRET: 'secret', EBAY_REFRESH_TOKEN: 'refresh' }, timedOutFetch),
    /timed out; retry catalog sync/,
  )
})

test('Trading pagination rejects unsafe provider-controlled page counts', () => {
  assert.throws(
    () => parseSellingPage(`
      <GetMyeBaySellingResponse><Ack>Success</Ack><ActiveList>
        <PaginationResult><TotalNumberOfPages>1001</TotalNumberOfPages></PaginationResult>
      </ActiveList></GetMyeBaySellingResponse>
    `),
    /invalid page count/,
  )
})

test('thumbnail allowlist rejects lookalike hosts and non-HTTPS URLs', () => {
  assert.equal(validateThumbnailUrl('https://i.ebayimg.com/images/g/a/s-l500.jpg'), 'https://i.ebayimg.com/images/g/a/s-l500.jpg')
  assert.throws(() => validateThumbnailUrl('http://i.ebayimg.com/a.jpg'), /HTTPS/)
  assert.throws(() => validateThumbnailUrl('https://i.ebayimg.com.example.com/a.jpg'), /exactly i.ebayimg.com/)
})

test('missing or malformed live thumbnails remain eligible for stored fallback', () => {
  assert.equal(parseOptionalLiveThumbnail(''), '')
  assert.equal(parseOptionalLiveThumbnail('https://i.ebayimg.com.example.com/a.jpg'), '')
  const page = parseSellingPage(`
    <GetMyeBaySellingResponse><Ack>Success</Ack><ActiveList><ItemArray><Item>
      <ItemID>327123456789</ItemID><Storefront><StoreCategoryID>1</StoreCategoryID></Storefront>
    </Item></ItemArray></ActiveList></GetMyeBaySellingResponse>
  `)
  assert.equal(page.items[0].thumbnailUrl, '')
})

test('thumbnail candidate policy selects the first independently valid URL', () => {
  assert.equal(
    selectFirstValidThumbnail(
      'https://i.ebayimg.com.example.com/unsafe.jpg',
      'https://i.ebayimg.com/images/g/safe/s-l500.jpg',
    ),
    'https://i.ebayimg.com/images/g/safe/s-l500.jpg',
  )
  assert.equal(selectFirstValidThumbnail('', 'http://i.ebayimg.com/unsafe.jpg'), '')
})

test('stored image fallbacks require a valid future expiration', () => {
  const now = new Date('2026-08-03T12:00:00Z')
  assert.equal(isUnexpired('2026-08-04T12:00:00Z', now), true)
  assert.equal(isUnexpired('2026-08-02T12:00:00Z', now), false)
  assert.equal(isUnexpired('', now), false)
  assert.equal(isUnexpired('not-a-date', now), false)
})

test('stored fallback uses the standard image when the preferred URL is blank or invalid', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'wgdtx-fallback-'))
  const databasePath = path.join(directory, 'catalog.sqlite')
  const db = new Database(databasePath)
  db.exec(`
    CREATE TABLE inventory_items (listing_id INTEGER, ebay_item_id TEXT, listing_draft_id INTEGER, updated_at TEXT);
    CREATE TABLE image_assets (id INTEGER, listing_id INTEGER);
    CREATE TABLE hosted_images (image_asset_id INTEGER, max_dimension_image_url TEXT, image_url TEXT, expiration_date TEXT, status TEXT, updated_at TEXT);
    CREATE TABLE listing_drafts (id INTEGER, store_category_id TEXT);
    INSERT INTO inventory_items VALUES (1, '327123456789', 1, '2026-08-03T00:00:00Z');
    INSERT INTO image_assets VALUES (1, 1);
    INSERT INTO hosted_images VALUES (1, '   ', 'https://i.ebayimg.com/images/g/fallback/s-l500.jpg', '2026-08-05T00:00:00Z', 'hosted', '2026-08-03T00:00:00Z');
    INSERT INTO listing_drafts VALUES (1, '1');
    INSERT INTO inventory_items VALUES (2, '327123456790', 2, '2026-08-03T00:00:00Z');
    INSERT INTO image_assets VALUES (2, 2);
    INSERT INTO hosted_images VALUES (2, 'https://i.ebayimg.com.example.com/unsafe.jpg', 'https://i.ebayimg.com/images/g/safe/s-l500.jpg', '2026-08-05T00:00:00Z', 'hosted', '2026-08-03T00:00:00Z');
    INSERT INTO listing_drafts VALUES (2, '1');
  `)
  db.close()
  try {
    const fallbacks = loadDatabaseFallbacks(databasePath, new Date('2026-08-03T12:00:00Z'))
    assert.equal(fallbacks.get('327123456789').thumbnailUrl, 'https://i.ebayimg.com/images/g/fallback/s-l500.jpg')
    assert.equal(fallbacks.get('327123456790').thumbnailUrl, 'https://i.ebayimg.com/images/g/safe/s-l500.jpg')
  } finally {
    await rm(directory, { recursive: true })
  }
})

test('atomic snapshot failure preserves the previous file', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'wgdtx-sync-'))
  const destination = path.join(directory, 'snapshot.json')
  await writeFile(destination, '{"version":"old"}\n')
  await assert.rejects(
    atomicWriteJson(destination, { version: 'new' }, { beforeRename: async () => { throw new Error('simulated interruption') } }),
    /simulated interruption/,
  )
  assert.equal(await readFile(destination, 'utf8'), '{"version":"old"}\n')
  await rm(directory, { recursive: true })
})
