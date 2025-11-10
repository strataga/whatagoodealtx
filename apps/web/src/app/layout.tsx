import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'WhataGoodDealTX - Vintage & Antique Treasures',
  description: 'Your source for vintage clothing, retro electronics, antiques, and collectibles from the golden age.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Satisfy&family=Indie+Flower&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  )
}
