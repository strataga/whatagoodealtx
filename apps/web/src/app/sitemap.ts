import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://www.whatagoodealtx.com',
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://www.whatagoodealtx.com/shop',
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ]
}
