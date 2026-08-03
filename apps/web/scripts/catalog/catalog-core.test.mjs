import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { collapseCatalogRows, parseCatalogCsv, parseEbayDateToIso, parseMoneyToCents, validateCurrency, validateItemId } from './catalog-core.mjs'

const headers = [
  'Item number','Title','Variation details','Custom label (SKU)','Available quantity','Format','Currency',
  'Start price','Auction Buy It Now price','Reserve price','Current price','Sold quantity','Watchers','Bids',
  'Start date','End date','eBay category 1 name','eBay category 1 number','eBay category 2 name','eBay category 2 number','Condition',
]

function csv(lines) {
  return Buffer.from(`\ufeff${headers.join(',')}\n${lines.join('\n')}\n`)
}

function media(itemId) {
  return { itemId, thumbnailUrl: `https://i.ebayimg.com/images/g/${itemId}/s-l500.jpg`, storeCategoryId: '1', categoryName: 'Other' }
}

test('parses BOM CSV and quoted commas', () => {
  const records = parseCatalogCsv(csv(['"327123456789","A title, with comma",,sku,2,FixedPrice,USD,10.50,,,10.50,,,,Jan-01-26 00:00:00 PST,Dec-01-26 00:00:00 PST,Collectibles,1,,,Used']))
  assert.equal(records[0].Title, 'A title, with comma')
})

test('selects the aggregate variation parent and labels it as variation data', () => {
  const rows = parseCatalogCsv(csv([
    '327123456789,Parent,Color=Red;Blue,parent,3,FixedPrice,USD,10.00,,,10.00,,,,Feb-01-26 00:00:00 PST,Dec-01-26 00:00:00 PST,Toys,1,,,Used',
    '327123456789,Parent,Color=Red,child,1,FixedPrice,USD,12.00,,,,,,,Feb-01-26 00:00:00 PST,Dec-01-26 00:00:00 PST,Toys,1,,,Used',
  ]))
  const [item] = collapseCatalogRows(rows, [media('327123456789')])
  assert.equal(item.variation, true)
  assert.equal(item.sku, 'parent')
  assert.equal(item.quantity, 3)
  assert.equal(item.priceCents, 1000)
  assert.equal(item.startDate, '2026-02-01T08:00:00.000Z')
})

test('money conversion is exact and malformed input fails closed', () => {
  assert.equal(parseMoneyToCents('69.0'), 6900)
  assert.equal(parseMoneyToCents('0.99'), 99)
  assert.throws(() => parseMoneyToCents('12.345'), /at most two decimal/)
  assert.throws(() => parseMoneyToCents('$12.00'), /non-negative amount/)
  assert.throws(() => validateItemId('327abc'), /Malformed eBay item ID/)
  assert.equal(validateCurrency('usd'), 'USD')
  assert.throws(() => validateCurrency('US dollars'), /three-letter currency/)
})

test('eBay timestamps normalize to chronological ISO values', () => {
  assert.equal(parseEbayDateToIso('Apr-01-26 10:08:36 PDT'), '2026-04-01T17:08:36.000Z')
  assert.equal(parseEbayDateToIso('Dec-31-26 23:30:00 PST'), '2027-01-01T07:30:00.000Z')
  assert.throws(() => parseEbayDateToIso('Feb-31-26 10:00:00 PST'), /invalid calendar date/)
})

test('imports are deterministic and the supplied export collapses 975 rows to 860 listings', async () => {
  const source = await readFile(new URL('../../data/ebay-listings.csv', import.meta.url))
  const snapshot = JSON.parse(await readFile(new URL('../../data/catalog-media.json', import.meta.url), 'utf8'))
  const rows = parseCatalogCsv(source)
  const first = collapseCatalogRows(rows, snapshot.items)
  const second = collapseCatalogRows(rows, snapshot.items)
  assert.equal(rows.length, 975)
  assert.equal(first.length, 860)
  assert.deepEqual(first, second)
})

test('variation groups without one aggregate parent fail closed', () => {
  const rows = parseCatalogCsv(csv([
    '327123456789,Parent,Color=Red,a,1,FixedPrice,USD,10.00,,,,,,,Feb-01-26 00:00:00 PST,Dec-01-26 00:00:00 PST,Toys,1,,,Used',
    '327123456789,Parent,Color=Blue,b,1,FixedPrice,USD,10.00,,,,,,,Feb-01-26 00:00:00 PST,Dec-01-26 00:00:00 PST,Toys,1,,,Used',
  ]))
  assert.throws(() => collapseCatalogRows(rows, [media('327123456789')]), /exactly one aggregate parent/)
})
