'use client'

import { PublicProduct, PublicStore } from '@/lib/api/public'
import { ProductCard } from './product-card'

interface ProductGridProps {
  products: PublicProduct[]
  storeSlug: string
  store?: PublicStore
}

export function ProductGrid({ products, storeSlug, store }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum produto encontrado.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          storeSlug={storeSlug}
          store={store}
        />
      ))}
    </div>
  )
}