import { ReactNode } from 'react'
import { Metadata } from 'next'
import { getPublicStore } from '@/lib/api/public'

interface StoreLayoutProps {
  children: ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  
  // Always generate base URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.ebrecho.com.br'
  const storeUrl = `${baseUrl}/${slug}`
  
  try {
    const store = await getPublicStore(slug)
    
    const storeImage = store.logoUrl || store.bannerUrl
    const cleanDescription = store.description ? store.description.replace(/\n/g, ' ').trim() : ''
    const fallbackDescription = `Descubra produtos únicos de segunda mão na ${store.name}. Moda sustentável com qualidade e estilo.`
    
    return {
      title: `${store.name} | eBrecho - Moda Segunda Mão`,
      description: cleanDescription || fallbackDescription,
      openGraph: {
        title: store.name,
        description: cleanDescription || fallbackDescription,
        images: storeImage ? [storeImage] : [],
        url: storeUrl,
        type: 'website',
        siteName: 'eBrecho',
      },
      twitter: {
        card: 'summary_large_image',
        title: store.name,
        description: cleanDescription || fallbackDescription,
        images: storeImage ? [storeImage] : [],
      },
    }
  } catch (error) {
    console.error('Error generating store metadata:', error)
    
    // Fallback metadata with basic Open Graph
    return {
      title: 'Loja não encontrada - eBrecho',
      description: 'A loja que você está procurando não foi encontrada.',
      openGraph: {
        title: 'Loja - eBrecho',
        description: 'Moda segunda mão sustentável',
        url: storeUrl,
        type: 'website',
        siteName: 'eBrecho',
      },
    }
  }
}

export default function StoreLayout({
  children,
}: StoreLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      {children}
    </div>
  )
}