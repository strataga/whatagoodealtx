import type { Metadata } from 'next'
import './globals.css'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'WhataGoodDealTX - Vintage & Antique Treasures from the 1950s',
  description: 'Discover authentic vintage clothing, retro electronics, antiques, and collectibles from the golden age. Shop unique treasures live on Whatnot with WhataGoodDealTX.',
  keywords: ['vintage', 'antiques', 'collectibles', 'retro', '1950s', 'vintage clothing', 'whatnot', 'live shopping', 'texas antiques'],
  authors: [{ name: 'WhataGoodDealTX' }],
  creator: 'WhataGoodDealTX',
  publisher: 'WhataGoodDealTX',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://whatagoodealtx.com'),
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'WhataGoodDealTX - Vintage & Antique Treasures from the 1950s',
    description: 'Discover authentic vintage clothing, retro electronics, antiques, and collectibles from the golden age. Shop unique treasures live on Whatnot.',
    url: 'https://whatagoodealtx.com',
    siteName: 'WhataGoodDealTX',
    images: [
      {
        url: '/logo.png',
        width: 400,
        height: 400,
        alt: 'WhataGoodDealTX Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WhataGoodDealTX - Vintage & Antique Treasures',
    description: 'Discover authentic vintage clothing, retro electronics, antiques, and collectibles from the golden age.',
    images: ['/logo.png'],
    creator: '@whatagoodealtx',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add verification codes when available
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
    // bing: 'your-bing-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'WhataGoodDealTX',
    description: 'Vintage and antique treasures from the 1950s golden age',
    url: 'https://whatagoodealtx.com',
    logo: 'https://whatagoodealtx.com/logo.png',
    sameAs: [
      'https://www.whatnot.com/user/whatagoodealtx',
      'https://www.instagram.com/whatagoodealtx/',
      'https://www.facebook.com/profile.php?id=61583154290122',
      'https://www.tiktok.com/@whatagoodealtx',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      availableLanguage: 'English',
    },
  }

  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Satisfy&family=Indie+Flower&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Script
          id="json-ld"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  )
}
