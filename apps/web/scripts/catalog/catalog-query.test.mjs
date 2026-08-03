import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import Database from 'better-sqlite3'

const directory = await mkdtemp(path.join(os.tmpdir(), 'wgdtx-query-'))
const databasePath = path.join(directory, 'catalog.sqlite')
const db = new Database(databasePath)
db.exec(`CREATE TABLE catalog_items (
  item_id TEXT PRIMARY KEY, title TEXT, sku TEXT, quantity INTEGER, price_cents INTEGER, currency TEXT,
  format TEXT, variation INTEGER, start_date TEXT, end_date TEXT, condition TEXT, ebay_category TEXT,
  department TEXT, listing_url TEXT, thumbnail_url TEXT
)`)
const insert = db.prepare("INSERT INTO catalog_items VALUES (@id,@title,@sku,1,@price,'USD','FixedPrice',0,@date,'','Used','',@department,@url,@image)")
for (let index = 1; index <= 30; index += 1) {
  const id = String(327000000000 + index)
  insert.run({ id, title: index === 3 ? 'Rare Blue Radio' : `Item ${String(index).padStart(2, '0')}`, sku: `sku-${index}`, price: index * 100, date: `2026-01-${String(Math.min(index, 28)).padStart(2, '0')}`, department: index % 2 ? 'Electronics' : 'Other', url: `https://www.ebay.com/itm/${id}`, image: `https://i.ebayimg.com/${id}.jpg` })
}
db.close()
process.env.CATALOG_DATABASE_PATH = databasePath
const { normalizeCatalogParams, queryCatalog } = await import('../../src/catalog/catalog.mjs')

test.after(async () => rm(directory, { recursive: true }))

test('validates and bounds query parameters', () => {
  assert.deepEqual(normalizeCatalogParams({ sort: 'DROP TABLE', page: '-4' }), { q: '', department: '', sort: 'newest', page: 1 })
  assert.equal(normalizeCatalogParams({ page: '999999' }).page, 10_000)
})

test('search and department filtering use prepared bindings', () => {
  const result = queryCatalog({ q: 'Blue Radio', department: 'Electronics' })
  assert.equal(result.total, 1)
  assert.equal(result.items[0].title, 'Rare Blue Radio')
  assert.equal(queryCatalog({ department: 'Not real' }).params.department, '')
})

test('sort order, pagination, and empty results are stable', () => {
  const ascending = queryCatalog({ sort: 'price-asc' })
  assert.equal(ascending.items[0].price_cents, 100)
  assert.equal(ascending.items.length, 24)
  const pageTwo = queryCatalog({ sort: 'price-desc', page: '2' })
  assert.equal(pageTwo.items.length, 6)
  assert.equal(pageTwo.items[0].price_cents, 600)
  assert.equal(queryCatalog({ q: 'no such treasure' }).total, 0)
})
