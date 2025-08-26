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
      {/* Banner - Much smaller on mobile */}
      <div className="relative h-20 sm:h-32 md:h-48 lg:h-64 xl:h-80 w-full overflow-hidden bg-gray-100">
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
      <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3 md:p-4 lg:p-6">
        <div className="container mx-auto">
          <div className="flex items-end gap-2 sm:gap-3 md:gap-4">
            {/* Logo - Much smaller on mobile */}
            <div className="relative h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 lg:h-20 lg:w-20 overflow-hidden rounded-lg border-2 border-white shadow-lg bg-white">
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

            {/* Store name and description - Much smaller text on mobile */}
            <div className="flex-1 text-white mb-0.5 sm:mb-1">
              <h1 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold mb-0.5 sm:mb-1 drop-shadow-lg">
                {store.name}
              </h1>
              {store.description && (
                <p className="text-xs sm:text-sm md:text-base drop-shadow-lg line-clamp-1 max-w-3xl">
                  {store.description}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}