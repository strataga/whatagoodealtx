export interface InstagramPost {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url: string
  permalink: string
  timestamp: string
  thumbnail_url?: string
}

export interface InstagramResponse {
  data: InstagramPost[]
  paging?: {
    cursors?: {
      before: string
      after: string
    }
    next?: string
  }
}

export interface FeaturedItem {
  id: string
  title: string
  description: string
  image: string
  link: string
}
