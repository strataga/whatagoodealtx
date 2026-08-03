import { parse } from 'csv-parse/sync'

export const REQUIRED_HEADERS = [
  'Item number',
  'Title',
  'Variation details',
  'Custom label (SKU)',
  'Available quantity',
  'Format',
  'Currency',
  'Start price',
  'Current price',
  'Start date',
  'End date',
  'eBay category 1 name',
  'Condition',
]

export function parseMoneyToCents(value, field = 'money') {
  const normalized = String(value ?? '').trim()
  if (!/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/.test(normalized)) {
    throw new Error(`${field} must be a non-negative amount with at most two decimal places.`)
  }
  const [whole, fraction = ''] = normalized.split('.')
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(cents)) {
    throw new Error(`${field} is outside the supported range.`)
  }
  return cents
}

export function validateItemId(value) {
  const itemId = String(value ?? '').trim()
  if (!/^\d{9,19}$/.test(itemId)) {
    throw new Error(`Malformed eBay item ID: ${itemId || '(empty)'}.`)
  }
  return itemId
}

export function listingUrlFor(itemId) {
  return `https://www.ebay.com/itm/${validateItemId(itemId)}`
}

export function validateThumbnailUrl(value) {
  let url
  try {
    url = new URL(String(value ?? '').trim())
  } catch {
    throw new Error('Thumbnail URL is not a valid URL.')
  }
  if (url.protocol !== 'https:' || url.hostname !== 'i.ebayimg.com') {
    throw new Error('Thumbnail URL must use HTTPS on exactly i.ebayimg.com.')
  }
  url.username = ''
  url.password = ''
  url.hash = ''
  return url.toString()
}

export function isUnexpired(expiresAt, now = new Date()) {
  if (!expiresAt) return false
  const expiry = new Date(expiresAt)
  return !Number.isNaN(expiry.valueOf()) && expiry.valueOf() > now.valueOf()
}

export function parseCatalogCsv(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length < 3 || !buffer.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))) {
    throw new Error('Catalog CSV must be UTF-8 with a BOM.')
  }
  const records = parse(buffer.subarray(3), {
    bom: false,
    columns: true,
    skip_empty_lines: true,
    relax_column_count: false,
  })
  const headers = records.length > 0 ? Object.keys(records[0]) : []
  for (const header of REQUIRED_HEADERS) {
    if (!headers.includes(header)) throw new Error(`Catalog CSV is missing required header: ${header}.`)
  }
  return records
}

export function collapseCatalogRows(rows, mediaItems) {
  const mediaById = new Map(mediaItems.map((item) => [validateItemId(item.itemId), item]))
  const groups = new Map()
  for (const row of rows) {
    const itemId = validateItemId(row['Item number'])
    const group = groups.get(itemId) ?? []
    group.push(row)
    groups.set(itemId, group)
  }

  return [...groups.entries()]
    .map(([itemId, group]) => {
      const isVariation = group.length > 1
      const parentRows = group.filter((row) => String(row['Current price'] ?? '').trim() !== '')
      if (isVariation && parentRows.length !== 1) {
        throw new Error(`Variation listing ${itemId} must contain exactly one aggregate parent row.`)
      }
      const row = isVariation ? parentRows[0] : group[0]
      const media = mediaById.get(itemId)
      if (!media) throw new Error(`Active listing ${itemId} has no media mapping.`)
      const rawPrice = String(row['Current price'] ?? '').trim() || String(row['Start price'] ?? '').trim()
      if (!rawPrice) throw new Error(`Listing ${itemId} has no current or start price.`)
      const quantity = Number(String(row['Available quantity'] ?? '').trim())
      if (!Number.isSafeInteger(quantity) || quantity < 0) {
        throw new Error(`Listing ${itemId} has malformed available quantity.`)
      }
      const title = String(row.Title ?? '').trim()
      if (!title) throw new Error(`Listing ${itemId} has no title.`)

      return {
        itemId,
        title,
        sku: String(row['Custom label (SKU)'] ?? '').trim(),
        quantity,
        priceCents: parseMoneyToCents(rawPrice, `Listing ${itemId} price`),
        currency: String(row.Currency ?? '').trim() || 'USD',
        format: String(row.Format ?? '').trim(),
        variation: isVariation,
        startDate: String(row['Start date'] ?? '').trim(),
        endDate: String(row['End date'] ?? '').trim(),
        condition: String(row.Condition ?? '').trim(),
        ebayCategory: String(row['eBay category 1 name'] ?? '').trim(),
        storeCategoryId: String(media.storeCategoryId ?? '').trim(),
        department: String(media.categoryName ?? '').trim() || 'Other',
        listingUrl: listingUrlFor(itemId),
        thumbnailUrl: validateThumbnailUrl(media.thumbnailUrl),
      }
    })
    .sort((a, b) => a.itemId.localeCompare(b.itemId))
}
