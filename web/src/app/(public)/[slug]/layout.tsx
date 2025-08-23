import { ReactNode } from 'react'
import { Metadata } from 'next'
import { getPublicStore } from '@/lib/api/public'

interface StoreLayoutProps {
  children: ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  
  try {
    const store = await getPublicStore(slug)
    
    const storeImage = store.logoUrl || store.bannerUrl
    const storeUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://ebrecho.vercel.app'}/${slug}`
    
    return {
      title: `${store.name} | eBrecho - Moda Segunda Mão`,
      description: store.description || `Descubra produtos únicos de segunda mão na ${store.name}. Moda sustentável com qualidade e estilo.`,
      openGraph: {
        title: store.name,
        description: store.description || `Descubra produtos únicos de segunda mão na ${store.name}. Moda sustentável com qualidade e estilo.`,
        images: storeImage ? [storeImage] : [],
        url: storeUrl,
        type: 'website',
        siteName: 'eBrecho',
      },
      twitter: {
        card: 'summary_large_image',
        title: store.name,
        description: store.description || `Descubra produtos únicos de segunda mão na ${store.name}. Moda sustentável com qualidade e estilo.`,
        images: storeImage ? [storeImage] : [],
      },
    }
  } catch {
    return {
      title: 'Loja não encontrada - eBrecho',
      description: 'A loja que você está procurando não foi encontrada.',
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