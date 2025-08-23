import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getPublicStore, getPublicProduct, registerProductView } from '@/lib/api/public'
import { ProductDetail } from '@/components/storefront/product-detail'

interface ProductPageProps {
  params: Promise<{ 
    slug: string
    productSlug: string
  }>
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug, productSlug } = await params
  
  // Always generate base URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.ebrecho.com.br'
  const productUrl = `${baseUrl}/${slug}/produto/${productSlug}`
  
  try {
    const { product } = await getPublicProduct(slug, productSlug)
    const store = await getPublicStore(slug)
    
    const imageUrl = product.images[0]?.processedUrl || product.images[0]?.originalUrl
    const priceText = product.price ? `R$ ${product.price.toFixed(2).replace('.', ',')}` : ''
    const cleanDescription = product.description ? product.description.replace(/\n/g, ' ').trim() : ''
    const fullDescription = cleanDescription 
      ? `${cleanDescription}${priceText ? ` - ${priceText}` : ''} - Disponível em ${store.name}`
      : `${product.name}${priceText ? ` por ${priceText}` : ''} disponível em ${store.name}`
    
    return {
      title: `${product.name} - ${store.name} | eBrecho`,
      description: fullDescription,
      openGraph: {
        title: `${product.name} - ${store.name}`,
        description: fullDescription,
        images: imageUrl ? [imageUrl] : [],
        url: productUrl,
        type: 'website',
        siteName: 'eBrecho',
      },
      twitter: {
        card: 'summary_large_image',
        title: `${product.name} - ${store.name}`,
        description: fullDescription,
        images: imageUrl ? [imageUrl] : [],
      },
    }
  } catch (error) {
    console.error('Error generating metadata:', error)
    
    // Fallback metadata with basic Open Graph
    return {
      title: 'Produto não encontrado - eBrecho',
      description: 'O produto que você está procurando não foi encontrado.',
      openGraph: {
        title: 'Produto - eBrecho',
        description: 'Moda segunda mão sustentável',
        url: productUrl,
        type: 'website',
        siteName: 'eBrecho',
      },
    }
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug, productSlug } = await params
  
  try {
    // Fetch store and product data in parallel
    const [store, productData] = await Promise.all([
      getPublicStore(slug),
      getPublicProduct(slug, productSlug)
    ])
    
    // Register product view for analytics
    registerProductView(slug, productData.product.id).catch(console.error)
    
    return (
      <ProductDetail 
        store={store} 
        product={productData.product} 
        relatedProducts={productData.relatedProducts}
      />
    )
  } catch (error) {
    console.error('Error loading product:', error)
    notFound()
  }
}