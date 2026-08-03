'use client'

import { EBAY_URL, WHATNOT_URL } from '@/components/SiteHeader'

export default function HomeError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main id="main-content" className="shop-page section-shell">
      <section className="empty-state" role="alert">
        <span aria-hidden="true">!</span>
        <h1>We couldn’t unpack the newest finds.</h1>
        <p>You can still shop directly with us while we straighten the shelves here.</p>
        <div className="hero-actions">
          <button className="button button--red" type="button" onClick={reset}>Try again</button>
          <a className="button button--navy" href={EBAY_URL} target="_blank" rel="noopener noreferrer">Shop on eBay <span aria-hidden="true">↗</span></a>
          <a className="button button--navy" href={WHATNOT_URL} target="_blank" rel="noopener noreferrer">Join us on Whatnot <span aria-hidden="true">↗</span></a>
        </div>
      </section>
    </main>
  )
}
