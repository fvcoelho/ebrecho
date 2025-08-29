'use client'

import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
      className="group h-full overflow-hidden hover:shadow-lg transition-shadow flex flex-col bg-white rounded-lg"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false)
        resetImageIndex()
      }}
    >
      <Link href={`/${storeSlug}/produto/${product.slug}`} className="flex-1 flex flex-col">
        {/* Image container */}
        <div className="relative aspect-square overflow-hidden bg-gray-100 cursor-pointer rounded-t-lg">
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

      <CardContent className="p-4 flex flex-col">
        <Link href={`/${storeSlug}/produto/${product.slug}`} className="flex-1 flex flex-col mb-3">
          {/* Title - Made larger */}
          <h3 className="text-base font-semibold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>

          {/* Description */}
          {product.description && (
            <p className="text-sm text-gray-600 line-clamp-2 mb-3">
              {product.description}
            </p>
          )}

          {/* Category and Size Badges */}
          <div className="flex items-center gap-2 mb-3">
            {product.category && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-800 hover:bg-purple-200 text-xs px-2 py-1 font-medium">
                {product.category}
              </Badge>
            )}
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 text-xs px-2 py-1 font-semibold">
              {(product.size || 'P').toUpperCase()}
            </Badge>
          </div>
        </Link>

        {/* Price - Positioned at bottom */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-gray-900">{formatPrice(product.price)}</span>
            {hasDiscount() && (
              <span className="text-sm text-gray-500 line-through">
                {formatPrice(getOriginalPrice())}
              </span>
            )}
          </div>
        </div>
        
        {/* Action Buttons - PIX and WhatsApp */}
        <div className="flex gap-3">
          {/* PIX Button */}
          {store?.pixKey && (
            <div className="flex-1">
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
            </div>
          )}
          
          {/* WhatsApp Button */}
          {store?.whatsappNumber && (
            <div className="flex-1">
              <Button
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  const greeting = store.whatsappName ? `Olá ${store.whatsappName}!` : 'Olá!'
                  const message = `${greeting} Gostaria de saber mais sobre o produto "${product.name}" no valor de ${formatPrice(product.price)}.`
                  const cleanNumber = store.whatsappNumber.replace(/\D/g, '')
                  const formattedNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`
                  const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodeURIComponent(message)}`
                  window.open(whatsappUrl, '_blank')
                }}
                className="w-full flex items-center justify-center bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-full py-3 px-4"
                size="default"
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill="currentColor"
                  className="mr-1"
                >
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.885 3.309"/>
                </svg>
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}