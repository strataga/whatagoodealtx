import type { Metadata } from 'next'
import Link from 'next/link'
import ProductCard, { type CatalogItem } from '@/components/ProductCard'
import { listDepartments, queryCatalog } from '@/catalog/catalog.mjs'

export const metadata: Metadata = {
  title: 'Shop the eBay catalog',
  description: 'Browse current WhataGoodealTX eBay listings by keyword, department, newest finds, title, or price.',
  alternates: { canonical: '/shop' },
}

type ShopSearchParams = Promise<Record<string, string | string[] | undefined>>

function pageHref(params: { q: string; department: string; sort: string }, page: number) {
  const query = new URLSearchParams()
  if (params.q) query.set('q', params.q)
  if (params.department) query.set('department', params.department)
  if (params.sort !== 'newest') query.set('sort', params.sort)
  if (page > 1) query.set('page', String(page))
  const suffix = query.toString()
  return suffix ? `/shop?${suffix}` : '/shop'
}

export default async function ShopPage({ searchParams }: { searchParams: ShopSearchParams }) {
  const result = queryCatalog(await searchParams) as {
    items: CatalogItem[]
    total: number
    totalPages: number
    params: { q: string; department: string; sort: string; page: number }
  }
  const departments = listDepartments() as { name: string; itemCount: number }[]
  const firstResult = result.total === 0 ? 0 : (result.params.page - 1) * 24 + 1
  const lastResult = Math.min(result.params.page * 24, result.total)
  const itemListSchema = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'WhataGoodealTX eBay catalog results',
    numberOfItems: result.items.length,
    itemListElement: result.items.map((item, index) => ({
      '@type': 'ListItem',
      position: firstResult + index,
      url: item.listing_url,
      name: item.title,
      image: item.thumbnail_url,
    })),
  }

  return (
    <main id="main-content" className="shop-page section-shell">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema).replaceAll('<', '\\u003c') }} />
      <header className="shop-intro">
        <p className="eyebrow">The current eBay shelves</p>
        <h1>Find your kind of good deal.</h1>
        <p>Every listing shown here comes from our WhataGoodealTX eBay store. Search and sort the catalog here, then head to eBay for complete details and checkout.</p>
      </header>

      <form className="catalog-filters" action="/shop" method="get" role="search">
        <div className="filter-field filter-field--search">
          <label htmlFor="catalog-search">Search the catalog</label>
          <input id="catalog-search" name="q" type="search" defaultValue={result.params.q} maxLength={100} placeholder="Try records, Pyrex, toys…" />
        </div>
        <div className="filter-field">
          <label htmlFor="department">Department</label>
          <select id="department" name="department" defaultValue={result.params.department}>
            <option value="">All departments</option>
            {departments.map((department) => <option key={department.name} value={department.name}>{department.name} ({department.itemCount})</option>)}
          </select>
        </div>
        <div className="filter-field">
          <label htmlFor="sort">Sort by</label>
          <select id="sort" name="sort" defaultValue={result.params.sort}>
            <option value="newest">Newest listed</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="title">Title: A to Z</option>
          </select>
        </div>
        <button className="button button--red" type="submit">Show finds</button>
      </form>

      <div className="results-heading" aria-live="polite" aria-atomic="true">
        <p><strong>{result.total.toLocaleString()} {result.total === 1 ? 'find' : 'finds'}</strong>{result.total > 0 && ` · Showing ${firstResult}–${lastResult}`}</p>
        {(result.params.q || result.params.department || result.params.sort !== 'newest') && <Link className="text-link" href="/shop">Reset search & filters</Link>}
      </div>

      {result.items.length > 0 ? (
        <div className="product-grid product-grid--catalog">
          {result.items.map((item) => <ProductCard key={item.item_id} item={item} />)}
        </div>
      ) : (
        <section className="empty-state" aria-labelledby="empty-title">
          <span aria-hidden="true">◇</span>
          <h2 id="empty-title">That shelf is empty—for now.</h2>
          <p>Try a broader keyword or browse every department. New finds arrive often.</p>
          <Link className="button button--navy" href="/shop">Reset and browse all</Link>
        </section>
      )}

      {result.totalPages > 1 && (
        <nav className="pagination" aria-label="Catalog pages">
          {result.params.page > 1 ? <Link href={pageHref(result.params, result.params.page - 1)} rel="prev">← Previous</Link> : <span aria-disabled="true">← Previous</span>}
          <span>Page {result.params.page} of {result.totalPages}</span>
          {result.params.page < result.totalPages ? <Link href={pageHref(result.params, result.params.page + 1)} rel="next">Next →</Link> : <span aria-disabled="true">Next →</span>}
        </nav>
      )}
    </main>
  )
}
