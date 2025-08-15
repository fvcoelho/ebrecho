'use client'

import Image from 'next/image'
import { PublicStore } from '@/lib/api/public'
import { useState } from 'react'

interface StoreHeroProps {
  store: PublicStore
}

export function StoreHero({ store }: StoreHeroProps) {
  const [bannerError, setBannerError] = useState(false)
  const [logoError, setLogoError] = useState(false)

  return (
    <section className="relative">
      {/* Banner */}
      <div className="relative h-64 md:h-80 lg:h-96 w-full overflow-hidden bg-gray-100">
        {store.publicBanner && !bannerError ? (
          <Image
            src={store.publicBanner}
            alt={`Banner da ${store.name}`}
            fill
            className="object-cover"
            priority
            onError={() => setBannerError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-primary/60" />
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
      </div>

      {/* Store info overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-12">
        <div className="container mx-auto">
          <div className="flex items-end gap-4 md:gap-6">
            {/* Logo */}
            <div className="relative h-20 w-20 md:h-24 md:w-24 lg:h-32 lg:w-32 overflow-hidden rounded-lg border-4 border-white shadow-lg bg-white">
              {store.publicLogo && !logoError ? (
                <Image
                  src={store.publicLogo}
                  alt={`Logo da ${store.name}`}
                  fill
                  className="object-cover"
                  onError={() => setLogoError(true)}
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-primary text-white text-2xl font-bold">
                  {store.name.charAt(0)}
                </div>
              )}
            </div>

            {/* Store name and description */}
            <div className="flex-1 text-white mb-2">
              <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-2 drop-shadow-lg">
                {store.name}
              </h1>
              {store.publicDescription && (
                <p className="text-sm md:text-base lg:text-lg drop-shadow-lg line-clamp-2 max-w-3xl">
                  {store.publicDescription}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}