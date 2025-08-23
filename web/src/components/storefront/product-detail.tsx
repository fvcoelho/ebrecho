'use client'

import { useState } from 'react'
import Link from 'next/link'
import { PublicStore } from '@/lib/api/public'
import WhatsAppButton from '@/components/storefront/whatsapp-button'
import { PixQRCodeDisplay } from '@/components/storefront/pix-qrcode-display'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Eye, MessageCircle, ArrowLeft, Share2 } from 'lucide-react'
import { imageApi } from '@/lib/api/images'

interface ProductDetailProps {
  store: PublicStore
  product: any // Extended product type from API
  relatedProducts: Array<{
    id: string
    slug: string
    name: string
    price: number
    images: Array<{ thumbnailUrl?: string }>
  }>
}

export function ProductDetail({ store, product, relatedProducts }: ProductDetailProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

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

  const handlePreviousImage = () => {
    setCurrentImageIndex(prev => 
      prev === 0 ? product.images.length - 1 : prev - 1
    )
  }

  const handleNextImage = () => {
    setCurrentImageIndex(prev => 
      prev === product.images.length - 1 ? 0 : prev + 1
    )
  }

  const handleWhatsAppClick = () => {
    const message = `Olá! Tenho interesse no produto "${product.name}" que vi na sua loja no eBrecho.`
    const cleanPhone = store.whatsappNumber?.replace(/\D/g, '') || ''
    const whatsappUrl = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleShare = async () => {
    const shareData = {
      title: `${product.name} - ${store.name}`,
      text: `Veja este produto incrível: ${product.name} por ${formatPrice(product.price)} na ${store.name}`,
      url: window.location.href,
    }

    try {
      // Check if Web Share API is available
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData)
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href)
        // You could add a toast notification here
        alert('Link copiado para a área de transferência!')
      }
    } catch (error) {
      // Final fallback: manual copy
      try {
        await navigator.clipboard.writeText(window.location.href)
        alert('Link copiado para a área de transferência!')
      } catch {
        // If clipboard API fails, show the URL
        prompt('Copie o link:', window.location.href)
      }
    }
  }

  const getImageUrl = (image: any) => {
    const url = image?.thumbnailUrl || image?.processedUrl || image?.originalUrl || ''
    if (!url) return ''
    return url.startsWith('http') || url.startsWith('blob:') ? url : imageApi.getImageUrl(url)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href={`/${store.slug}`}
            className="inline-flex items-center gap-2 text-sm hover:text-primary"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para {store.name}
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
              {product.images.length > 0 ? (
                <>
                  <img
                    src={getImageUrl(product.images[currentImageIndex])}
                    alt={product.name}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={handlePreviousImage}
                        className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md hover:bg-white"
                        aria-label="Imagem anterior"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-2 shadow-md hover:bg-white"
                        aria-label="Próxima imagem"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="flex h-full w-full items-center justify-center text-gray-400">
                  <span>Sem imagem</span>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {product.images.map((image: any, index: number) => (
                  <button
                    key={image.id || image.originalUrl || `image-${index}`}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                      index === currentImageIndex ? 'border-primary' : 'border-transparent'
                    }`}
                  >
                    <img
                      src={getImageUrl(image)}
                      alt={`${product.name} - Imagem ${index + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product info */}
          <div className="space-y-6">
            {/* Category and condition */}
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{product.category}</Badge>
              <Badge className={getConditionColor(product.condition)} variant="secondary">
                {getConditionLabel(product.condition)}
              </Badge>
            </div>

            {/* Title */}
            <h1 className="text-3xl font-bold">{product.name}</h1>

            {/* Price */}
            <div className="space-y-1">
              <div className="flex items-end gap-3">
                <span className="text-3xl font-bold">{formatPrice(product.price)}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                ou 3x de {formatPrice(product.price / 3)} sem juros
              </p>
            </div>

            {/* Size */}
            {product.size && (
              <div>
                <h3 className="font-semibold mb-1">Tamanho</h3>
                <Badge variant="outline" className="text-base px-4 py-2">
                  {product.size}
                </Badge>
              </div>
            )}

            {/* Brand */}
            {product.brand && (
              <div className="relative">
                <h3 className="font-semibold mb-1">Marca</h3>
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground">{product.brand}</p>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 animate-pulse-large">
                    🏷️ Brand
                  </span>
                </div>
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div>
                <h3 className="font-semibold mb-2">Descrição</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{product.description}</p>
              </div>
            )}

            {/* Tags */}
            {product.publicTags && product.publicTags.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {product.publicTags.map((tag: string) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="space-y-3">
              {store.whatsappNumber && (
                <Button
                  size="lg"
                  className="relative w-full gap-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-none shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-semibold"
                  onClick={handleWhatsAppClick}
                >
                  <MessageCircle className="h-6 w-6" />
                  Conversar sobre esse item
                </Button>
              )}

              <Button
                size="lg"
                variant="outline"
                className="w-full gap-3 hover:bg-primary hover:text-primary-foreground transition-all duration-300 px-8 py-4 text-lg font-semibold"
                onClick={handleShare}
              >
                <Share2 className="h-6 w-6" />
                Compartilhar produto
              </Button>
              
              {/* PIX QR Code */}
              {store.pixKey && (
                  <PixQRCodeDisplay
                    buttonText='Pagar com PIX'
                    pixKey={store.pixKey}
                    amount={product.price}
                    productName={product.name}
                    storeName={store.name}
                    productId={product.id}
                    partnerId={store.id}
                  />
              )}
              
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-center text-muted-foreground">
                  <Eye className="inline h-4 w-4 mr-1" />
                  {product.viewCount} pessoas visualizaram este produto
                </p>
              </Card>
            </div>

            {/* Store info */}
            <Card className="p-4">
              <Link href={`/${store.slug}`} className="flex items-center gap-4 hover:opacity-80">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {store.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="font-semibold">{store.name}</h3>
                  <p className="text-sm text-muted-foreground">
                    Ver mais produtos desta loja
                  </p>
                </div>
              </Link>
            </Card>
          </div>
        </div>

        {/* Related products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Produtos Relacionados</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((relatedProduct) => (
                <Link
                  key={relatedProduct.id}
                  href={`/${store.slug}/produto/${relatedProduct.slug}`}
                  className="group"
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative aspect-square overflow-hidden bg-gray-100">
                      {relatedProduct.images[0]?.thumbnailUrl ? (
                        <img
                          src={relatedProduct.images[0].thumbnailUrl.startsWith('http') || relatedProduct.images[0].thumbnailUrl.startsWith('blob:')
                            ? relatedProduct.images[0].thumbnailUrl 
                            : imageApi.getImageUrl(relatedProduct.images[0].thumbnailUrl)
                          }
                          alt={relatedProduct.name}
                          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-400">
                          <span className="text-xs">Sem imagem</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium line-clamp-1 mb-1">{relatedProduct.name}</h3>
                      <p className="font-bold">{formatPrice(relatedProduct.price)}</p>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {store.whatsappNumber && (
        <WhatsAppButton
        />
      )}
    </div>
  )
}