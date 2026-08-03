'use client'

import Image from 'next/image'
import { useState } from 'react'

type SafeCatalogImageProps = {
  src: string
  alt: string
  sizes: string
  priority?: boolean
}

export default function SafeCatalogImage({ src, alt, sizes, priority = false }: SafeCatalogImageProps) {
  const [failed, setFailed] = useState(false)

  return (
    <Image
      src={failed ? '/logo.png' : src}
      alt={failed ? `${alt} — image unavailable; WhataGoodealTX logo shown` : alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      className={failed ? 'catalog-image catalog-image--fallback' : 'catalog-image'}
    />
  )
}
