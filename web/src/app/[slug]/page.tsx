import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { getPublicStore, getPublicProducts, registerStoreView } from '@/lib/api/public'
import { StoreHero } from '@/components/storefront/store-hero'
import { ProductGrid } from '@/components/storefront/product-grid'
import { StoreInfo } from '@/components/storefront/store-info'
import { StoreMap } from '@/components/storefront/store-map'
import { WhatsAppButton } from '@/components/storefront/whatsapp-button'

interface StorePageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: StorePageProps): Promise<Metadata> {
  const { slug } = await params
  
  try {
    const store = await getPublicStore(slug)
    
    return {
      title: `${store.name} - eBrecho`,
      description: store.publicDescription || `Confira os produtos de ${store.name} no eBrecho`,
      openGraph: {
        title: `${store.name} - eBrecho`,
        description: store.publicDescription || `Confira os produtos de ${store.name} no eBrecho`,
        images: store.publicBanner ? [store.publicBanner] : [],
      },
    }
  } catch {
    return {
      title: 'Loja não encontrada - eBrecho',
      description: 'A loja que você está procurando não foi encontrada.',
    }
  }
}

export default async function StorePage({ params }: StorePageProps) {
  const { slug } = await params
  let store
  let featuredProducts
  
  try {
    console.log('[DEBUG] StorePage - Processing slug:', slug)
    console.log('[DEBUG] StorePage - About to fetch store data')
    
    // Fetch store data
    store = await getPublicStore(slug)
    console.log('[DEBUG] StorePage - Store data fetched successfully:', store.name)
    
    // Register store view for analytics
    registerStoreView(slug).catch(console.error)
    
    // Fetch featured products (first 20, sorted by popularity)
    console.log('[DEBUG] StorePage - About to fetch products')
    const productsData = await getPublicProducts(slug, {
      limit: 20,
      sort: 'popular'
    })
    console.log('[DEBUG] StorePage - Products fetched:', productsData.products.length)
    
    featuredProducts = productsData.products
  } catch (error) {
    console.error('[DEBUG] StorePage - Error loading store:', error)
    console.error('[DEBUG] StorePage - Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      status: (error as any)?.response?.status,
      data: (error as any)?.response?.data
    })
    notFound()
  }

  return (
    <>
      <StoreHero store={store} />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main content */}
          <div className="lg:col-span-3">
            <section>
              <h2 className="text-2xl font-bold mb-6">Produtos em Destaque</h2>
              <ProductGrid products={featuredProducts} storeSlug={slug} />
              
              {featuredProducts.length > 0 && (
                <div className="mt-8 text-center">
                  <a
                    href={`/${slug}/produtos`}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary hover:bg-primary/90"
                  >
                    Ver todos os produtos
                  </a>
                </div>
              )}
              
              {featuredProducts.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Esta loja ainda não possui produtos cadastrados.</p>
                </div>
              )}
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="sticky top-4 space-y-6">
              <StoreInfo store={store} />
              {store.address && <StoreMap store={store} />}
            </div>
          </aside>
        </div>
      </div>

      {store.whatsappNumber && (
        <WhatsAppButton phoneNumber={store.whatsappNumber} />
      )}
    </>
  )
}