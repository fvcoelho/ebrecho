'use client'

import React, { useEffect, useRef, useState } from 'react'
import { MapPin, Navigation, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PublicStore } from '@/lib/api/public'

interface StoreMapProps {
  store: PublicStore
  height?: string
}

declare global {
  interface Window {
    google: any
  }
}

export function StoreMap({ store, height = '300px' }: StoreMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<any>(null)
  const [isLoaded, setIsLoaded] = useState(false)
  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null)

  // Load Google Maps script
  useEffect(() => {
    if (window.google) {
      setIsLoaded(true)
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
    script.async = true
    script.onload = () => {
      setIsLoaded(true)
    }
    script.onerror = () => {
      console.error('Failed to load Google Maps script')
    }
    
    document.head.appendChild(script)

    return () => {
      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`)
      if (existingScript) {
        document.head.removeChild(existingScript)
      }
    }
  }, [])

  // Geocode the address
  useEffect(() => {
    if (!isLoaded || !store.address) return

    const geocoder = new window.google.maps.Geocoder()
    const fullAddress = `${store.address.street}, ${store.address.number}, ${store.address.neighborhood}, ${store.address.city}, ${store.address.state}, ${store.address.zipCode}`

    geocoder.geocode({ address: fullAddress }, (results: any, status: any) => {
      if (status === 'OK' && results[0]) {
        const location = results[0].geometry.location
        setCoordinates({
          lat: location.lat(),
          lng: location.lng()
        })
      } else {
        console.error('Geocoding failed:', status)
      }
    })
  }, [isLoaded, store.address])

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current || !coordinates) return

    const map = new window.google.maps.Map(mapRef.current, {
      center: coordinates,
      zoom: 16,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }]
        }
      ],
      mapTypeControl: false,
      streetViewControl: true,
      fullscreenControl: false,
      zoomControl: true,
    })

    mapInstanceRef.current = map

    // Add marker
    const marker = new window.google.maps.Marker({
      position: coordinates,
      map: map,
      title: store.name,
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="32" height="40" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M16 0C7.16 0 0 7.16 0 16C0 24 16 40 16 40C16 40 32 24 32 16C32 7.16 24.84 0 16 0ZM16 21.5C13.52 21.5 11.5 19.48 11.5 17C11.5 14.52 13.52 12.5 16 12.5C18.48 12.5 20.5 14.52 20.5 17C20.5 19.48 18.48 21.5 16 21.5Z" fill="#3B82F6"/>
            <circle cx="16" cy="17" r="3" fill="white"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(32, 40),
        anchor: new window.google.maps.Point(16, 40)
      }
    })

    // Add info window
    const infoWindow = new window.google.maps.InfoWindow({
      content: `
        <div style="max-width: 250px; font-family: system-ui, -apple-system, sans-serif;">
          <h3 style="margin: 0 0 8px 0; font-size: 16px; font-weight: 600; color: #111827;">${store.name}</h3>
          ${store.address ? `<p style="margin: 0 0 8px 0; font-size: 13px; color: #6B7280; line-height: 1.4;">
            ${store.address.street}, ${store.address.number}<br>
            ${store.address.complement ? store.address.complement + '<br>' : ''}
            ${store.address.neighborhood}<br>
            ${store.address.city} - ${store.address.state}<br>
            CEP: ${store.address.zipCode}
          </p>` : ''}
          <div style="display: flex; gap: 8px; margin-top: 12px;">
            <a href="https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}" 
               target="_blank" 
               rel="noopener noreferrer" 
               style="color: #3B82F6; text-decoration: none; font-size: 12px; padding: 4px 8px; background: #EBF8FF; border-radius: 4px;">
              🧭 Como chegar
            </a>
          </div>
        </div>
      `
    })

    marker.addListener('click', () => {
      infoWindow.open(map, marker)
    })

    // Show info window by default
    infoWindow.open(map, marker)
  }, [isLoaded, coordinates, store])

  const handleGetDirections = () => {
    if (coordinates) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${coordinates.lat},${coordinates.lng}`
      window.open(url, '_blank')
    }
  }

  const handleViewOnMaps = () => {
    if (coordinates) {
      const url = `https://www.google.com/maps/search/?api=1&query=${coordinates.lat},${coordinates.lng}`
      window.open(url, '_blank')
    }
  }

  if (!store.address) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg">
          <MapPin className="h-5 w-5 mr-2 text-blue-600" />
          Localização
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Address */}
        {/* <div className="text-sm space-y-1">
          <p className="font-medium">{store.address.street}, {store.address.number}</p>
          {store.address.complement && (
            <p className="text-muted-foreground">{store.address.complement}</p>
          )}
          <p className="text-muted-foreground">{store.address.neighborhood}</p>
          <p className="text-muted-foreground">{store.address.city} - {store.address.state}</p>
          <p className="text-muted-foreground">CEP: {store.address.zipCode}</p>
        </div> */}

        {/* Map */}
        <div className="relative w-full rounded-lg overflow-hidden border" style={{ height }}>
          {!isLoaded ? (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-xs text-muted-foreground mt-2">Carregando mapa...</p>
              </div>
            </div>
          ) : !coordinates ? (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <div className="text-center">
                <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Não foi possível carregar a localização</p>
              </div>
            </div>
          ) : (
            <>
              <div ref={mapRef} className="w-full h-full" />
              
              {/* Map Controls */}
              <div className="absolute top-2 right-2 flex flex-col gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    if (mapInstanceRef.current && coordinates) {
                      mapInstanceRef.current.setCenter(coordinates)
                      mapInstanceRef.current.setZoom(16)
                    }
                  }}
                  className="h-8 w-8 p-0"
                >
                  <Navigation className="h-3 w-3" />
                </Button>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        {coordinates && (
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleGetDirections}
              className="flex-1"
            >
              <Navigation className="h-4 w-4 mr-2" />
              Como chegar
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleViewOnMaps}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Ver no Maps
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}