import type { Metadata, Viewport } from 'next'
import './globals.css'
import Script from 'next/script'
import { Indie_Flower, Satisfy } from 'next/font/google'

const satisfy = Satisfy({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-satisfy',
  display: 'swap',
})

const indieFlower = Indie_Flower({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-indie-flower',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'WhataGoodealTX - Vintage & Antique Treasures',
  description: 'Discover authentic vintage clothing, retro electronics, antiques, and collectibles from the golden age. Shop unique treasures live on Whatnot with WhataGoodealTX.',
  keywords: ['vintage', 'antiques', 'collectibles', 'retro', 'vintage clothing', 'whatnot', 'live shopping', 'texas antiques'],
  authors: [{ name: 'WhataGoodealTX' }],
  creator: 'WhataGoodealTX',
  publisher: 'WhataGoodealTX',
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
    title: 'WhataGoodealTX - Vintage & Antique Treasures',
    description: 'Discover authentic vintage clothing, retro electronics, antiques, and collectibles from the golden age. Shop unique treasures live on Whatnot.',
    url: 'https://whatagoodealtx.com',
    siteName: 'WhataGoodealTX',
    images: [
      {
        url: '/logo.png',
        width: 400,
        height: 400,
        alt: 'WhataGoodealTX Logo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'WhataGoodealTX - Vintage & Antique Treasures',
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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'WhataGoodealTX',
    description: 'Vintage and antique treasures',
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
    <html lang="en" className={`${satisfy.variable} ${indieFlower.variable}`}>
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
