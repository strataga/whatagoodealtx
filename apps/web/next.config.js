/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i.ebayimg.com',
        pathname: '/**',
      },
    ],
  },
  outputFileTracingIncludes: {
    '/shop': ['./data/catalog.sqlite'],
    '/': ['./data/catalog.sqlite'],
  },
}

module.exports = nextConfig
