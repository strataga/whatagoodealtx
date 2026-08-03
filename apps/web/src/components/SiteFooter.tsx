import Image from 'next/image'
import Link from 'next/link'
import { EBAY_URL, WHATNOT_URL } from './SiteHeader'

const socialLinks = [
  ['eBay', EBAY_URL],
  ['Whatnot', WHATNOT_URL],
  ['Instagram', 'https://www.instagram.com/whatagoodealtx/'],
  ['Facebook', 'https://www.facebook.com/profile.php?id=61583154290122'],
  ['TikTok', 'https://www.tiktok.com/@whatagoodealtx'],
]

export default function SiteFooter() {
  return (
    <footer className="site-footer" id="connect">
      <div className="footer-inner">
        <div className="footer-story">
          <Image src="/logo.png" alt="WhataGoodealTX" width={92} height={92} />
          <div>
            <p className="script-accent">Good finds, good homes.</p>
            <p>We uncover character-rich pieces and connect them with people who will enjoy their next chapter.</p>
          </div>
        </div>
        <div>
          <h2>Find your next treasure</h2>
          <nav aria-label="Footer navigation">
            <Link href="/shop">Browse the shop</Link>
            {socialLinks.map(([name, href]) => <a key={name} href={href} target="_blank" rel="noopener noreferrer">{name}</a>)}
            <a href="mailto:jen@whatagoodealtx.com">Email us</a>
          </nav>
        </div>
      </div>
      <p className="copyright">© {new Date().getFullYear()} WhataGoodealTX. Shopping purchases are completed securely on eBay or Whatnot.</p>
    </footer>
  )
}
