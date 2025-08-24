'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { PublicProduct, PublicStore } from '@/lib/api/public'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useState, useEffect } from 'react'
import { imageApi } from '@/lib/api/images'
import { ShoppingBagIcon } from './shopping-bag-icon'
import { PixQRCodeDisplay } from './pix-qrcode-display'

interface ProductCardProps {
  product: PublicProduct
  storeSlug: string
  store?: PublicStore
}

export function ProductCard({ product, storeSlug, store }: ProductCardProps) {
  const [imageError, setImageError] = useState(false)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  
  // Auto-rotate images when hovered (if multiple images)
  useEffect(() => {
    if (!isHovered || product.images.length <= 1) return
    
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % product.images.length)
    }, 1500)
    
    return () => clearInterval(interval)
  }, [isHovered, product.images.length])
  
  const resetImageIndex = () => {
    setCurrentImageIndex(0)
  }
  
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price)
  }

  const getConditionLabel = (condition: string) => {
    const labels: Record<string, string> = {
      NEW: 'Novo',
      LIKE_NEW: 'Seminovo',
      GOOD: 'Bom estado',
      FAIR: 'Usado',
    }
    return labels[condition] || condition
  }

  const getConditionColor = (condition: string) => {
    const colors: Record<string, string> = {
      NEW: 'bg-green-100 text-green-800',
      LIKE_NEW: 'bg-blue-100 text-blue-800',
      GOOD: 'bg-yellow-100 text-yellow-800',
      FAIR: 'bg-gray-100 text-gray-800',
    }
    return colors[condition] || 'bg-gray-100 text-gray-800'
  }
  
  const calculateDiscount = () => {
    // For now, generate a random discount for demo purposes
    // In real implementation, this would come from product data
    const discounts = [15, 20, 25, 30, 33, 45, 50, 60, 70, 79]
    return discounts[Math.floor(Math.random() * discounts.length)]
  }
  
  const getOriginalPrice = () => {
    const discount = calculateDiscount()
    return (product.price / (1 - discount / 100))
  }
  
  const hasDiscount = () => {
    // For demo purposes, show discount on some products
    return product.id.length % 3 === 0
  }
  
  const currentImage = product.images[currentImageIndex] || product.images[0]
  
  const getImageUrl = (image: any) => {
    if (!image) return ''
    
    return image.thumbnailUrl 
      ? (image.thumbnailUrl.startsWith('http') || image.thumbnailUrl.startsWith('blob:')
        ? image.thumbnailUrl 
        : imageApi.getImageUrl(image.thumbnailUrl))
      : image.processedUrl
      ? (image.processedUrl.startsWith('http') || image.processedUrl.startsWith('blob:')
        ? image.processedUrl
        : imageApi.getImageUrl(image.processedUrl))
      : image.originalUrl
      ? (image.originalUrl.startsWith('http') || image.originalUrl.startsWith('blob:')
        ? image.originalUrl
        : imageApi.getImageUrl(image.originalUrl))
      : ''
  }

  return (
    <Card 
      className="group h-full overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        resetImageIndex()
      }}
    >
      <Link href={`/${storeSlug}/produto/${product.slug}`} className="flex-1 flex flex-col">
        {/* Image container */}
        <div className="relative aspect-[4/5] overflow-hidden bg-gray-100 cursor-pointer">
          {currentImage && !imageError ? (
            <img
              src={getImageUrl(currentImage)}
              alt={product.name}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImageError(true)}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-gray-400 bg-gray-200">
              <span className="text-sm font-medium">Produto</span>
            </div>
          )}

          {/* Discount badge */}
          {hasDiscount() && (
            <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-bold">
              {calculateDiscount()}%
            </div>
          )}
          
          {/* Brand badge */}
          {product.brand && (
            <div className="absolute bottom-2 left-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-600 text-white animate-pulse-large">
                🏷️ {product.brand}
              </span>
            </div>
          )}

          {/* Condition badge - styled like in the image */}
          <div className="absolute top-2 right-2">
            <Badge 
              className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400 text-xs px-2 py-1"
              variant="secondary"
            >
              {product.condition === 'GOOD' ? 'barateou' : getConditionLabel(product.condition)}
            </Badge>
          </div>
          
          {/* Shopping bag icon with count - bottom right */}
          {/* <div className="absolute bottom-2 right-2">
            <ShoppingBagIcon productId={product.id} />
          </div> */}
          
          {/* Image navigation dots for multiple images */}
          {product.images.length > 1 && (
            <div className="absolute bottom-2 left-2 flex gap-1">
              {product.images.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      </Link>

      <CardContent className="p-2 flex flex-col">
        <Link href={`/${storeSlug}/produto/${product.slug}`} className="flex-1 flex flex-col">
          {/* Price */}
          <div className="flex items-baseline gap-1 mb-1">
            <span className="text-base font-bold text-gray-900">{formatPrice(product.price)}</span>
            {hasDiscount() && (
              <span className="text-xs text-gray-500 line-through">
                {formatPrice(getOriginalPrice())}
              </span>
            )}
          </div>
          
          {/* Title */}
          <h3 className="text-xs text-gray-700 line-clamp-2 mb-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Brand and Size */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
            <span>{product.category || 'sem marca'}</span>
            <span>•</span>
            <span>{product.size || 'P'}</span>
          </div>
          
          {/* Spacer */}
          <div className="flex-1"></div>
        </Link>
        
        {/* PIX QR Code Display - Outside the Link */}
        {store?.pixKey && (
          <PixQRCodeDisplay
            buttonText=''
            pixKey={store.pixKey}
            amount={product.price}
            productName={product.name}
            storeName={store.name}
            productId={product.id}
            partnerId={store.id}
            whatsappNumber={store.whatsappNumber}
            whatsappName={store.whatsappName}
          />
        )}
      </CardContent>
    </Card>
  )
}