import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, Roboto_Slab, Satisfy, Source_Sans_3 } from 'next/font/google'
import SiteFooter from '@/components/SiteFooter'
import SiteHeader from '@/components/SiteHeader'
import './globals.css'

const bodyFont = Source_Sans_3({ subsets: ['latin'], variable: '--font-body', display: 'swap' })
const headingFont = Roboto_Slab({ subsets: ['latin'], variable: '--font-heading', display: 'swap' })
const labelFont = Barlow_Condensed({ subsets: ['latin'], variable: '--font-label', display: 'swap', weight: ['500', '600', '700'] })
const scriptFont = Satisfy({ subsets: ['latin'], variable: '--font-script', display: 'swap', weight: '400' })

export const metadata: Metadata = {
  metadataBase: new URL('https://www.whatagoodealtx.com'),
  title: { default: 'WhataGoodealTX | Vintage finds & collectibles', template: '%s | WhataGoodealTX' },
  description: 'Vintage treasures, collectibles, music, toys, home finds, and oddities from WhataGoodealTX. Shop our current finds on eBay and Whatnot.',
  keywords: ['vintage', 'antiques', 'collectibles', 'music', 'toys', 'Texas vintage shop', 'eBay', 'Whatnot'],
  authors: [{ name: 'WhataGoodealTX' }],
  creator: 'WhataGoodealTX',
  publisher: 'WhataGoodealTX',
  formatDetection: { email: false, address: false, telephone: false },
  icons: { icon: '/logo.png', shortcut: '/logo.png', apple: '/logo.png' },
  manifest: '/manifest.json',
  openGraph: {
    title: 'WhataGoodealTX | Good finds deserve a second life',
    description: 'Vintage treasures, collectibles, music, toys, home finds, and oddities—chosen one good find at a time.',
    url: '/',
    siteName: 'WhataGoodealTX',
    images: [{ url: '/logo.png', width: 400, height: 400, alt: 'WhataGoodealTX round logo' }],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WhataGoodealTX | Good finds deserve a second life',
    description: 'Browse vintage treasures, collectibles, toys, home finds, and oddities.',
    images: ['/logo.png'],
  },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 } },
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1 }

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'WhataGoodealTX',
  description: 'Vintage treasures, collectibles, and local finds sold through eBay and Whatnot.',
  url: 'https://www.whatagoodealtx.com',
  logo: 'https://www.whatagoodealtx.com/logo.png',
  sameAs: [
    'https://www.ebay.com/usr/whatagoodealtx',
    'https://www.whatnot.com/invite/whatagoodealtx',
    'https://www.instagram.com/whatagoodealtx/',
    'https://www.facebook.com/profile.php?id=61583154290122',
    'https://www.tiktok.com/@whatagoodealtx',
  ],
  email: 'jen@whatagoodealtx.com',
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${headingFont.variable} ${labelFont.variable} ${scriptFont.variable}`}>
      <body>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema).replaceAll('<', '\\u003c') }} />
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  )
}
