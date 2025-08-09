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
  
  try {
    const { product } = await getPublicProduct(slug, productSlug)
    const store = await getPublicStore(slug)
    
    const imageUrl = product.images[0]?.processedUrl || product.images[0]?.originalUrl
    
    return {
      title: `${product.name} - ${store.name} | eBrecho`,
      description: product.description || `${product.name} disponível em ${store.name}`,
      openGraph: {
        title: `${product.name} - ${store.name}`,
        description: product.description || `${product.name} disponível em ${store.name}`,
        images: imageUrl ? [imageUrl] : [],
      },
    }
  } catch {
    return {
      title: 'Produto não encontrado - eBrecho',
      description: 'O produto que você está procurando não foi encontrado.',
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