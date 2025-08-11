'use client';

import React, { useEffect, useRef, useState } from 'react';
import { MapPin, Star, Phone, Globe, Navigation } from 'lucide-react';
import { Button, Card, CardContent, Badge } from '@/components/ui';
import { loadGoogleMapsAPI } from '@/lib/google-maps-loader';

interface BrechoBusiness {
  id: string;
  name: string;
  address: {
    formattedAddress: string;
    coordinates: { lat: number; lng: number };
    city: string;
    state: string;
    neighborhood?: string;
  };
  businessInfo: {
    rating?: number;
    reviewCount?: number;
    priceLevel?: number;
    isOpenNow?: boolean;
  };
  contact: {
    phoneNumber?: string;
    website?: string;
  };
  media: {
    photos: string[];
    profileImage?: string;
  };
  distanceFromCenter?: number;
}

interface BrechoMapProps {
  businesses: BrechoBusiness[];
  center: { lat: number; lng: number };
  radius: number;
  onMarkerClick?: (business: BrechoBusiness) => void;
  onBusinessToggle?: (business: BrechoBusiness, visible: boolean) => void;
  visibleBusinesses?: Set<string>;
  height?: string;
}

declare global {
  interface Window {
    google: any;
    initMap: () => void;
  }
}

export function BrechoMap({ 
  businesses, 
  center, 
  radius, 
  onMarkerClick,
  onBusinessToggle,
  visibleBusinesses = new Set(businesses.map(b => b.id)),
  height = '100%' 
}: BrechoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const circleRef = useRef<any>(null);
  const infoWindowRef = useRef<any>(null);
  const [selectedBusiness, setSelectedBusiness] = useState<BrechoBusiness | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  console.log('🗺️ BrechoMap initialized:', {
    businessCount: businesses.length,
    center,
    radius,
    visibleBusinesses: Array.from(visibleBusinesses),
    visibleCount: visibleBusinesses.size
  });

  // Load Google Maps script using centralized loader
  useEffect(() => {
    const initMaps = async () => {
      try {
        await loadGoogleMapsAPI();
        console.log('✅ Google Maps script loaded');
        setIsLoaded(true);
      } catch (error) {
        console.error('❌ Failed to load Google Maps script:', error);
      }
    };

    initMaps();
  }, []);

  // Initialize map
  useEffect(() => {
    if (!isLoaded || !mapRef.current) return;

    console.log('🗺️ Initializing Google Map...');

    try {
      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: radius <= 1000 ? 15 : radius <= 5000 ? 13 : radius <= 20000 ? 11 : 9,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ],
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      });

      mapInstanceRef.current = map;

      // Create info window
      infoWindowRef.current = new window.google.maps.InfoWindow();

      console.log('✅ Google Map initialized');
    } catch (error) {
      console.error('❌ Error initializing map:', error);
    }
  }, [isLoaded, center]);

  // Update search radius circle
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove existing circle
    if (circleRef.current) {
      circleRef.current.setMap(null);
    }

    // Create new circle
    const circle = new window.google.maps.Circle({
      strokeColor: '#3B82F6',
      strokeOpacity: 0.8,
      strokeWeight: 2,
      fillColor: '#3B82F6',
      fillOpacity: 0.1,
      map: mapInstanceRef.current,
      center: center,
      radius: radius,
    });

    circleRef.current = circle;

    console.log('🔵 Search radius circle updated:', radius);
  }, [center, radius]);

  // Update markers
  useEffect(() => {
    if (!isLoaded || !mapInstanceRef.current) {
      console.log('⚠️ Map not ready, skipping marker creation', { isLoaded, mapReady: !!mapInstanceRef.current });
      return;
    }

    console.log('📍 Starting marker creation process:', {
      mapReady: !!mapInstanceRef.current,
      businessCount: businesses.length,
      visibleBusinessesSize: visibleBusinesses.size
    });

    // Clear existing markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];

    // Create markers for businesses
    const markers = businesses.map((business, index) => {
      // Check if business should be visible
      const isVisible = visibleBusinesses.has(business.id);
      
      // Determine marker color based on rating
      const rating = business.businessInfo.rating || 0;
      let markerColor = '#6B7280'; // Default gray
      if (rating >= 4.5) markerColor = '#10B981'; // Green
      else if (rating >= 4.0) markerColor = '#F59E0B'; // Yellow
      else if (rating >= 3.0) markerColor = '#EF4444'; // Red
      
      const markerNumber = index + 1;
      
      // Create a larger pin-style marker icon
      const createMarkerIcon = (color: string, number: number) => {
        const canvas = document.createElement('canvas');
        canvas.width = 40;
        canvas.height = 50;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          // Draw pin shape
          ctx.fillStyle = color;
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3;
          
          // Pin body (teardrop shape)
          ctx.beginPath();
          ctx.arc(20, 20, 15, 0, 2 * Math.PI); // Main circle
          ctx.fill();
          ctx.stroke();
          
          // Pin point (triangle)
          ctx.beginPath();
          ctx.moveTo(20, 35); // Point tip
          ctx.lineTo(12, 25);  // Left corner
          ctx.lineTo(28, 25);  // Right corner
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
          
          // Number in center
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 14px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(number.toString(), 20, 20);
        }
        
        return canvas.toDataURL();
      };
      
      console.log(`📍 Creating marker for ${business.name}:`, {
        index: markerNumber,
        isVisible,
        businessId: business.id,
        hasVisibleSet: visibleBusinesses.has(business.id),
        coordinates: business.address.coordinates
      });

      const marker = new window.google.maps.Marker({
        position: business.address.coordinates,
        map: mapInstanceRef.current, // Always add to map initially
        title: `${markerNumber}. ${business.name}\n${business.address.formattedAddress}`,
        icon: {
          url: createMarkerIcon(markerColor, markerNumber),
          scaledSize: new window.google.maps.Size(40, 50),
          anchor: new window.google.maps.Point(20, 50)
        },
        animation: window.google.maps.Animation.DROP,
        zIndex: 1000 - index,
        optimized: false
      });

      // Hide marker if not visible (after creation)
      if (!isVisible) {
        console.log(`🙈 Hiding marker for ${business.name}`);
        marker.setMap(null);
      } else {
        console.log(`👁️ Keeping marker visible for ${business.name}`);
      }
      
      // Store reference to business for toggling
      (marker as any).businessId = business.id;
      (marker as any).businessData = business;

      // Add click listener
      marker.addListener('click', () => {
        console.log('📍 Marker clicked:', business.name);
        
        setSelectedBusiness(business);
        
        if (onMarkerClick) {
          onMarkerClick(business);
        }

        // Show info window
        const infoContent = createInfoWindowContent(business);
        infoWindowRef.current.setContent(infoContent);
        infoWindowRef.current.open(mapInstanceRef.current, marker);
        
        // Center map on marker
        mapInstanceRef.current.panTo(business.address.coordinates);
      });

      return marker;
    });

    // Add center marker to show search origin
    const centerMarker = new window.google.maps.Marker({
      position: center,
      map: mapInstanceRef.current,
      title: 'Centro da busca',
      icon: {
        url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="12" cy="12" r="10" fill="#3B82F6" stroke="white" stroke-width="2"/>
            <circle cx="12" cy="12" r="3" fill="white"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(24, 24),
        anchor: new window.google.maps.Point(12, 12)
      },
      zIndex: 2000 // Always on top
    });

    markers.push(centerMarker);
    markersRef.current = markers;

    console.log('📍 Map markers created:', {
      businessMarkers: businesses.length,
      centerMarker: 1,
      total: markers.length,
      businesses: businesses.map((b, i) => ({
        number: i + 1,
        name: b.name,
        rating: b.businessInfo.rating,
        coordinates: b.address.coordinates
      }))
    });

    // Fit map to show all markers and center
    if (businesses.length > 0) {
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(center); // Include search center
      businesses.forEach(business => {
        bounds.extend(business.address.coordinates);
      });
      mapInstanceRef.current.fitBounds(bounds);
      
      // Ensure minimum zoom level
      const listener = mapInstanceRef.current.addListener('bounds_changed', () => {
        if (mapInstanceRef.current.getZoom() > 16) {
          mapInstanceRef.current.setZoom(16);
        }
        window.google.maps.event.removeListener(listener);
      });
    }

    console.log('📍 Map markers updated:', {
      businessMarkers: businesses.length,
      totalMarkers: markers.length,
      searchRadius: `${radius}m`,
      visibleCount: visibleBusinesses.size
    });
  }, [businesses, onMarkerClick, visibleBusinesses, isLoaded]);

  // Method to toggle business visibility
  const toggleBusinessVisibility = (businessId: string, visible: boolean) => {
    const marker = markersRef.current.find((m: any) => m.businessId === businessId);
    if (marker) {
      marker.setMap(visible ? mapInstanceRef.current : null);
      if (visible && marker.businessData) {
        marker.setAnimation(window.google.maps.Animation.DROP);
      }
      
      if (onBusinessToggle) {
        const business = marker.businessData;
        onBusinessToggle(business, visible);
      }
    }
  };

  // Note: toggleBusinessVisibility is available for future external use if needed

  const createInfoWindowContent = (business: BrechoBusiness): string => {
    const rating = business.businessInfo.rating;
    const priceLevel = business.businessInfo.priceLevel;
    const distance = business.distanceFromCenter;
    
    return `
      <div style="max-width: 280px; font-family: system-ui, -apple-system, sans-serif;">
        <div style="margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 600; color: #111827;">${business.name}</h3>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #6B7280;">${business.address.formattedAddress}</p>
        </div>
        
        <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
          ${rating ? `
            <div style="display: flex; align-items: center; gap: 4px; padding: 2px 6px; background: #FEF3C7; border-radius: 12px;">
              <span style="color: #F59E0B; font-size: 12px;">★</span>
              <span style="font-size: 12px; font-weight: 500; color: #92400E;">${rating}</span>
              ${business.businessInfo.reviewCount ? `<span style="font-size: 11px; color: #92400E;">(${business.businessInfo.reviewCount})</span>` : ''}
            </div>
          ` : ''}
          
          ${priceLevel ? `
            <div style="padding: 2px 6px; background: #E0F2FE; border-radius: 12px;">
              <span style="font-size: 12px; font-weight: 500; color: #0369A1;">${'$'.repeat(priceLevel)}</span>
            </div>
          ` : ''}
          
          ${business.businessInfo.isOpenNow !== undefined ? `
            <div style="padding: 2px 6px; background: ${business.businessInfo.isOpenNow ? '#DCFCE7' : '#FEE2E2'}; border-radius: 12px;">
              <span style="font-size: 11px; font-weight: 500; color: ${business.businessInfo.isOpenNow ? '#166534' : '#991B1B'};">
                ${business.businessInfo.isOpenNow ? 'Aberto' : 'Fechado'}
              </span>
            </div>
          ` : ''}
          
          ${distance ? `
            <div style="padding: 2px 6px; background: #F3F4F6; border-radius: 12px;">
              <span style="font-size: 11px; color: #374151;">${distance < 1000 ? Math.round(distance) + 'm' : (distance/1000).toFixed(1) + 'km'}</span>
            </div>
          ` : ''}
        </div>
        
        <div style="display: flex; gap: 8px;">
          ${business.contact.phoneNumber ? `
            <a href="tel:${business.contact.phoneNumber}" style="color: #3B82F6; text-decoration: none; font-size: 12px;">📞 Ligar</a>
          ` : ''}
          
          ${business.contact.website ? `
            <a href="${business.contact.website}" target="_blank" rel="noopener noreferrer" style="color: #3B82F6; text-decoration: none; font-size: 12px;">🌐 Site</a>
          ` : ''}
          
          <a href="https://www.google.com/maps/dir/?api=1&destination=${business.address.coordinates.lat},${business.address.coordinates.lng}" target="_blank" rel="noopener noreferrer" style="color: #3B82F6; text-decoration: none; font-size: 12px;">🧭 Rota</a>
        </div>
      </div>
    `;
  };

  const handleGetDirections = (business: BrechoBusiness) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${business.address.coordinates.lat},${business.address.coordinates.lng}`;
    window.open(url, '_blank');
  };

  if (!isLoaded) {
    return (
      <div className={`w-full bg-muted rounded-lg flex items-center justify-center`} style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground mt-2">Carregando mapa...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={mapRef} className="w-full h-full rounded-lg" />
      
      {/* Map Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            if (mapInstanceRef.current) {
              mapInstanceRef.current.setCenter(center);
              mapInstanceRef.current.setZoom(radius <= 1000 ? 15 : radius <= 5000 ? 13 : 11);
            }
          }}
        >
          <Navigation className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Map Legend */}
      {businesses.length > 0 && (
        <Card className="absolute top-4 left-4 bg-white/95 backdrop-blur-sm">
          <CardContent className="p-3">
            <h4 className="font-semibold text-xs mb-2">Legenda</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Centro da busca</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Avaliação ≥ 4.5</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Avaliação ≥ 4.0</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <span>Avaliação ≥ 3.0</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                <span>Sem avaliação</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Business Count */}
      <div className="absolute bottom-4 left-4">
        <Badge variant="secondary" className="bg-white/90 backdrop-blur-sm">
          {visibleBusinesses.size} de {businesses.length} brechós visíveis
        </Badge>
      </div>
      
      {/* Selected Business Info */}
      {selectedBusiness && (
        <Card className="absolute bottom-4 right-4 w-80 max-w-[calc(100vw-2rem)]">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h3 className="font-semibold text-sm">{selectedBusiness.name}</h3>
                <p className="text-xs text-muted-foreground">
                  {selectedBusiness.address.neighborhood && `${selectedBusiness.address.neighborhood}, `}
                  {selectedBusiness.address.city}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedBusiness(null)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
            
            <div className="flex items-center gap-2 mb-3">
              {selectedBusiness.businessInfo.rating && (
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  <span className="text-xs font-medium">{selectedBusiness.businessInfo.rating}</span>
                  {selectedBusiness.businessInfo.reviewCount && (
                    <span className="text-xs text-muted-foreground">
                      ({selectedBusiness.businessInfo.reviewCount})
                    </span>
                  )}
                </div>
              )}
              
              {selectedBusiness.businessInfo.priceLevel && (
                <Badge variant="outline" className="text-xs">
                  {'$'.repeat(selectedBusiness.businessInfo.priceLevel)}
                </Badge>
              )}
              
              {selectedBusiness.distanceFromCenter && (
                <Badge variant="secondary" className="text-xs">
                  {selectedBusiness.distanceFromCenter < 1000 
                    ? `${Math.round(selectedBusiness.distanceFromCenter)}m`
                    : `${(selectedBusiness.distanceFromCenter/1000).toFixed(1)}km`
                  }
                </Badge>
              )}
            </div>
            
            <div className="flex gap-2">
              {selectedBusiness.contact.phoneNumber && (
                <Button size="sm" variant="outline" asChild>
                  <a href={`tel:${selectedBusiness.contact.phoneNumber}`}>
                    <Phone className="h-3 w-3 mr-1" />
                    Ligar
                  </a>
                </Button>
              )}
              
              {selectedBusiness.contact.website && (
                <Button size="sm" variant="outline" asChild>
                  <a href={selectedBusiness.contact.website} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-3 w-3 mr-1" />
                    Site
                  </a>
                </Button>
              )}
              
              <Button
                size="sm"
                onClick={() => handleGetDirections(selectedBusiness)}
              >
                <Navigation className="h-3 w-3 mr-1" />
                Rota
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}