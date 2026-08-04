import SafeCatalogImage from './SafeCatalogImage'

export type CatalogItem = {
  item_id: string
  title: string
  sku: string
  quantity: number
  price_cents: number
  currency: string
  format: string
  variation: number
  start_date: string
  end_date: string
  condition: string
  ebay_category: string
  department: string
  listing_url: string
  thumbnail_url: string
}

function formatPrice(item: CatalogItem) {
  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: item.currency || 'USD',
  }).format(item.price_cents / 100)
  return item.variation ? `From ${amount}` : amount
}

export default function ProductCard({ item, priority = false }: { item: CatalogItem; priority?: boolean }) {
  return (
    <article className="product-card">
      <a className="product-image-link" href={item.listing_url} target="_blank" rel="noopener noreferrer">
        <SafeCatalogImage
          src={item.thumbnail_url}
          alt={item.title}
          sizes="(max-width: 520px) 46vw, (max-width: 900px) 30vw, 260px"
          priority={priority}
        />
      </a>
      <div className="product-card__body">
        <p className="product-card__source">Listed on our eBay store</p>
        <p className="product-card__department">{item.department}</p>
        <h3><a href={item.listing_url} target="_blank" rel="noopener noreferrer">{item.title}</a></h3>
        <div className="product-card__meta">
          <strong>{formatPrice(item)}</strong>
          <span>{item.condition || item.format}</span>
        </div>
        <a className="text-link" href={item.listing_url} target="_blank" rel="noopener noreferrer">
          View on eBay <span aria-hidden="true">↗</span>
        </a>
      </div>
    </article>
  )
}
