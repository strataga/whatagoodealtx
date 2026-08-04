import Image from 'next/image'
import Link from 'next/link'

const EBAY_URL = 'https://www.ebay.com/usr/whatagoodealtx'
const WHATNOT_URL = 'https://www.whatnot.com/invite/whatagoodealtx'

export default function SiteHeader() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" href="/" aria-label="WhataGoodealTX home">
          <span className="brand-logo" aria-hidden="true">
            <Image src="/logo.png" alt="" width={72} height={72} priority />
          </span>
          <span>WhataGoodealTX</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/shop">Shop</Link>
          <a href={EBAY_URL} target="_blank" rel="noopener noreferrer">eBay</a>
          <a href={WHATNOT_URL} target="_blank" rel="noopener noreferrer">Whatnot</a>
          <a href="#connect">Connect</a>
        </nav>
      </div>
    </header>
  )
}

export { EBAY_URL, WHATNOT_URL }
