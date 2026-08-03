#!/usr/bin/env node
import { mkdir, readFile, rename, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import Database from 'better-sqlite3'
import { collapseCatalogRows, parseCatalogCsv } from './catalog-core.mjs'

export async function buildCatalog({
  csvPath = path.resolve('data/ebay-listings.csv'),
  mediaPath = path.resolve('data/catalog-media.json'),
  outputPath = path.resolve('data/catalog.sqlite'),
} = {}) {
  const rows = parseCatalogCsv(await readFile(csvPath))
  const snapshot = JSON.parse(await readFile(mediaPath, 'utf8'))
  if (snapshot.version !== 1 || !Array.isArray(snapshot.items)) throw new Error('Catalog media snapshot is invalid.')
  const items = collapseCatalogRows(rows, snapshot.items)
  const temporary = `${outputPath}.tmp-${process.pid}-${Date.now()}`
  await mkdir(path.dirname(outputPath), { recursive: true })
  try {
    const db = new Database(temporary)
    try {
      db.pragma('journal_mode = DELETE')
      db.pragma('synchronous = FULL')
      db.exec(`
      CREATE TABLE catalog_items (
        item_id TEXT PRIMARY KEY CHECK(item_id GLOB '[0-9]*'),
        title TEXT NOT NULL,
        sku TEXT NOT NULL,
        quantity INTEGER NOT NULL CHECK(quantity >= 0),
        price_cents INTEGER NOT NULL CHECK(price_cents >= 0),
        currency TEXT NOT NULL,
        format TEXT NOT NULL,
        variation INTEGER NOT NULL CHECK(variation IN (0, 1)),
        start_date TEXT NOT NULL,
        end_date TEXT NOT NULL,
        condition TEXT NOT NULL,
        ebay_category TEXT NOT NULL,
        department TEXT NOT NULL,
        listing_url TEXT NOT NULL,
        thumbnail_url TEXT NOT NULL
      );
      CREATE INDEX idx_catalog_department_newest ON catalog_items(department, start_date DESC, item_id DESC);
      CREATE INDEX idx_catalog_price ON catalog_items(price_cents, item_id);
      CREATE INDEX idx_catalog_title ON catalog_items(title COLLATE NOCASE, item_id);
    `)
      const insert = db.prepare(`
      INSERT INTO catalog_items (
        item_id, title, sku, quantity, price_cents, currency, format, variation,
        start_date, end_date, condition, ebay_category, department, listing_url, thumbnail_url
      ) VALUES (
        @itemId, @title, @sku, @quantity, @priceCents, @currency, @format, @variation,
        @startDate, @endDate, @condition, @ebayCategory, @department, @listingUrl, @thumbnailUrl
      )
    `)
      db.transaction((records) => records.forEach((item) => insert.run({ ...item, variation: item.variation ? 1 : 0 })))(items)
      db.pragma('user_version = 1')
    } finally {
      db.close()
    }
    await rename(temporary, outputPath)
    return items
  } catch (error) {
    await rm(temporary, { force: true }).catch(() => {})
    throw error
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))) {
  buildCatalog()
    .then((items) => console.log(`Catalog database built atomically with ${items.length} unique listings.`))
    .catch((error) => {
      console.error(`Catalog build failed: ${error.message}`)
      process.exitCode = 1
    })
}
