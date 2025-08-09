'use client'

import { PublicProduct } from '@/lib/api/public'
import { ProductCard } from './product-card'

interface ProductGridProps {
  products: PublicProduct[]
  storeSlug: string
}

export function ProductGrid({ products, storeSlug }: ProductGridProps) {
  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Nenhum produto encontrado.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          storeSlug={storeSlug}
        />
      ))}
    </div>
  )
}