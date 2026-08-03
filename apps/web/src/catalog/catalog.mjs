import path from 'node:path'
import Database from 'better-sqlite3'

export const PAGE_SIZE = 24
export const SORTS = new Set(['newest', 'price-asc', 'price-desc', 'title'])

const ORDER_BY = {
  newest: 'start_date DESC, item_id DESC',
  'price-asc': 'price_cents ASC, item_id ASC',
  'price-desc': 'price_cents DESC, item_id DESC',
  title: 'title COLLATE NOCASE ASC, item_id ASC',
}

function databasePath() {
  return process.env.CATALOG_DATABASE_PATH || path.join(process.cwd(), 'data', 'catalog.sqlite')
}

function openCatalog() {
  return new Database(databasePath(), { readonly: true, fileMustExist: true })
}

function first(value) {
  return Array.isArray(value) ? value[0] : value
}

export function normalizeCatalogParams(input = {}) {
  const q = String(first(input.q) ?? '').trim().slice(0, 100)
  const department = String(first(input.department) ?? '').trim().slice(0, 80)
  const requestedSort = String(first(input.sort) ?? 'newest')
  const sort = SORTS.has(requestedSort) ? requestedSort : 'newest'
  const requestedPage = Number.parseInt(String(first(input.page) ?? '1'), 10)
  const page = Number.isSafeInteger(requestedPage) ? Math.min(Math.max(requestedPage, 1), 10_000) : 1
  return { q, department, sort, page }
}

function escapeLike(value) {
  return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')
}

export function listDepartments() {
  const db = openCatalog()
  try {
    return db.prepare(`
      SELECT department AS name, COUNT(*) AS itemCount
      FROM catalog_items
      GROUP BY department
      ORDER BY CASE department
        WHEN 'Music & Media' THEN 1 WHEN 'Vintage & Collectibles' THEN 2
        WHEN 'Toys & Games' THEN 3 WHEN 'Books & Paper' THEN 4
        WHEN 'Electronics' THEN 5 WHEN 'Jewelry & Watches' THEN 6
        WHEN 'Home & Decor' THEN 7 WHEN 'Parts & Accessories' THEN 8
        WHEN 'Crafts & Sewing' THEN 9 WHEN 'Odds & Ends' THEN 10
        ELSE 11 END, department COLLATE NOCASE
    `).all()
  } finally {
    db.close()
  }
}

export function getNewestItems(limit = 8) {
  const safeLimit = Math.min(Math.max(Number(limit) || 8, 1), 24)
  const db = openCatalog()
  try {
    return db.prepare('SELECT * FROM catalog_items ORDER BY start_date DESC, item_id DESC LIMIT ?').all(safeLimit)
  } finally {
    db.close()
  }
}

export function queryCatalog(rawParams = {}) {
  const params = normalizeCatalogParams(rawParams)
  const db = openCatalog()
  try {
    const knownDepartments = new Set(
      db.prepare('SELECT DISTINCT department FROM catalog_items').all().map((row) => row.department),
    )
    const department = knownDepartments.has(params.department) ? params.department : ''
    const conditions = []
    const bindings = {}
    if (params.q) {
      conditions.push("(title LIKE @query ESCAPE '\\' COLLATE NOCASE OR sku LIKE @query ESCAPE '\\' COLLATE NOCASE)")
      bindings.query = `%${escapeLike(params.q)}%`
    }
    if (department) {
      conditions.push('department = @department')
      bindings.department = department
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const total = db.prepare(`SELECT COUNT(*) AS count FROM catalog_items ${where}`).get(bindings).count
    const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))
    const page = Math.min(params.page, totalPages)
    const items = db.prepare(`
      SELECT * FROM catalog_items ${where}
      ORDER BY ${ORDER_BY[params.sort]}
      LIMIT @limit OFFSET @offset
    `).all({ ...bindings, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE })
    return { items, total, totalPages, params: { ...params, department, page } }
  } finally {
    db.close()
  }
}
