'use client'

import Image from 'next/image'
import { PublicStore } from '@/lib/api/public'
import { useState } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Star } from 'lucide-react'

interface StoreHeroProps {
  store: PublicStore
}

export function StoreHero({ store }: StoreHeroProps) {
  const [bannerError, setBannerError] = useState(false)
  const [logoError, setLogoError] = useState(false)

  return (
    <header className="relative">
      {/* Banner with improved gradient */}
      <div className="relative h-32 sm:h-48 md:h-56 lg:h-72 w-full overflow-hidden">
        {store.publicBanner && !bannerError ? (
          <>
            <Image
              src={store.publicBanner}
              alt={`Banner da ${store.name}`}
              fill
              className="object-cover"
              priority
              onError={() => setBannerError(true)}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/70" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary/70 to-primary/50" />
        )}
      </div>

      {/* Store info with better layout */}
      <div className="relative bg-background border-b">
        <div className="container mx-auto px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start">
            {/* Logo with better styling */}
            <div className="absolute -top-8 sm:-top-10 md:-top-12 lg:-top-14">
              <Avatar className="h-16 w-16 sm:h-20 sm:w-20 md:h-24 md:w-24 lg:h-28 lg:w-28 border-4 border-background shadow-xl">
                <AvatarImage 
                  src={store.publicLogo || ''} 
                  alt={`Logo da ${store.name}`}
                  onError={() => setLogoError(true)}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl sm:text-3xl font-bold">
                  {store.name.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Store info with better spacing */}
            <div className="flex-1 ml-0 sm:ml-24 md:ml-28 lg:ml-32 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold">
                  {store.name}
                </h1>
                {store.verified && (
                  <Badge variant="default" className="w-fit">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Verificado
                  </Badge>
                )}
              </div>
              
              {store.description && (
                <p className="text-sm sm:text-base text-muted-foreground max-w-3xl">
                  {store.description}
                </p>
              )}
              
              {/* Quick info badges */}
              <div className="flex flex-wrap gap-2 pt-2">
                {store.city && (
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    <MapPin className="h-3 w-3 mr-1" />
                    {store.city}, {store.state}
                  </Badge>
                )}
                {store.businessHours && (
                  <Badge variant="secondary" className="text-xs sm:text-sm">
                    <Clock className="h-3 w-3 mr-1" />
                    {store.businessHours}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}