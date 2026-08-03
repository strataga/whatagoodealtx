'use client'

import Link from 'next/link'

export default function ShopError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main-content" className="shop-page section-shell">
      <section className="empty-state" role="alert">
        <span aria-hidden="true">!</span>
        <h1>We couldn’t open the catalog.</h1>
        <p>The eBay store is still available while we straighten the shelves here.</p>
        <div className="hero-actions">
          <button className="button button--red" type="button" onClick={reset}>Try again</button>
          <Link className="button button--navy" href="/">Return home</Link>
        </div>
      </section>
    </main>
  )
}
