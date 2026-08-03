import type { Metadata } from 'next'
import Link from 'next/link'
import SafeCatalogImage from '@/components/SafeCatalogImage'
import ProductCard, { type CatalogItem } from '@/components/ProductCard'
import { EBAY_URL, WHATNOT_URL } from '@/components/SiteHeader'
import { getNewestItems, listDepartments } from '@/catalog/catalog.mjs'

export const metadata: Metadata = {
  title: 'Vintage finds, collectibles & oddities',
  description: 'Shop WhataGoodealTX vintage treasures, collectibles, music, toys, home finds, and oddities on eBay and Whatnot.',
  alternates: { canonical: '/' },
}

export default function Home() {
  const newest = getNewestItems(8) as Array<CatalogItem>
  const departments = listDepartments() as { name: string; itemCount: number }[]
  const totalItems = departments.reduce((total, department) => total + department.itemCount, 0)
  const collage = newest.slice(0, 5)

  return (
    <main id="main-content">
      <section className="hero section-shell" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="ribbon-label">Curated in Texas · Shipped with care</p>
          <h1 id="hero-title">Good finds deserve a second life.</h1>
          <p className="hero-lede">Vintage treasures, collectibles, music, toys, home finds, and wonderfully unexpected oddities—chosen one good find at a time.</p>
          <div className="hero-actions" aria-label="Choose where to shop">
            <a className="button button--red" href={EBAY_URL} target="_blank" rel="noopener noreferrer">Shop the eBay store <span aria-hidden="true">↗</span></a>
            <a className="button button--navy" href={WHATNOT_URL} target="_blank" rel="noopener noreferrer">Join us on Whatnot <span aria-hidden="true">↗</span></a>
          </div>
          <Link className="shop-catalog-link" href="/shop">Or browse our full eBay catalog here <span aria-hidden="true">→</span></Link>
        </div>
        <div className="hero-collage" aria-label="A selection of our newest finds">
          {collage.map((item, index) => (
            <a key={item.item_id} className={`collage-item collage-item--${index + 1}`} href={item.listing_url} target="_blank" rel="noopener noreferrer">
              <SafeCatalogImage src={item.thumbnail_url} alt={item.title} sizes="(max-width: 800px) 42vw, 240px" priority={index < 2} />
            </a>
          ))}
          <span className="collage-sticker" aria-hidden="true">Fresh finds!</span>
        </div>
      </section>

      <section className="departments section-shell" aria-labelledby="departments-title">
        <div className="section-heading">
          <div><p className="eyebrow">Something for every collector</p><h2 id="departments-title">Shop by department</h2></div>
          <Link className="text-link" href="/shop">Browse all {totalItems.toLocaleString()} finds <span aria-hidden="true">→</span></Link>
        </div>
        <div className="department-grid">
          {departments.map((department, index) => (
            <Link key={department.name} className="department-card" href={`/shop?department=${encodeURIComponent(department.name)}`}>
              <span className="department-number">{String(index + 1).padStart(2, '0')}</span>
              <span><strong>{department.name}</strong><small>{department.itemCount} finds</small></span>
              <span aria-hidden="true">→</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="newest section-shell" aria-labelledby="newest-title">
        <div className="section-heading">
          <div><p className="eyebrow">Just unpacked</p><h2 id="newest-title">Newly listed finds</h2></div>
          <Link className="text-link" href="/shop?sort=newest">See what’s new <span aria-hidden="true">→</span></Link>
        </div>
        <div className="product-grid">
          {newest.map((item) => <ProductCard key={item.item_id} item={item} />)}
        </div>
      </section>

      <section className="trust-strip" aria-label="Why shop with WhataGoodealTX">
        <div className="section-shell trust-grid">
          <div><span aria-hidden="true">★</span><p><strong>Selling on eBay since 2006</strong><br />Years of treasure hunting and happy mail days.</p></div>
          <div><span aria-hidden="true">✓</span><p><strong>Carefully inspected & described</strong><br />Clear details help every find reach the right home.</p></div>
          <div><span aria-hidden="true">⌂</span><p><strong>Packed with care</strong><br />Thoughtful wrapping for the journey from us to you.</p></div>
        </div>
      </section>

      <section className="platforms section-shell" aria-labelledby="platform-title">
        <div className="section-heading section-heading--center"><div><p className="eyebrow">Two ways to treasure hunt</p><h2 id="platform-title">Meet us where you love to shop</h2></div></div>
        <div className="platform-grid">
          <article className="platform-panel platform-panel--ebay">
            <p className="platform-kicker">Browse anytime</p>
            <h3>Our eBay store</h3>
            <p>Search the full collection, compare the details, and discover recently listed pieces at your own pace.</p>
            <a className="button button--cream" href={EBAY_URL} target="_blank" rel="noopener noreferrer">Shop on eBay <span aria-hidden="true">↗</span></a>
          </article>
          <article className="platform-panel platform-panel--whatnot">
            <p className="platform-kicker">Shop together</p>
            <h3>Live on Whatnot</h3>
            <p>Join the room for live finds, a little good-natured fun, and the thrill of seeing what comes up next.</p>
            <a className="button button--cream" href={WHATNOT_URL} target="_blank" rel="noopener noreferrer">Join us on Whatnot <span aria-hidden="true">↗</span></a>
          </article>
        </div>
      </section>
    </main>
  )
}
