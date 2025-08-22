'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { SpinningLogo } from '@/components/ui/spinning-logo';
import { MapPin } from 'lucide-react';
import { loadGoogleMapsAPI } from '@/lib/google-maps-loader';

// Extend window object for Google Places API
declare global {
  interface Window {
    google: any;
  }
}

export interface PlaceResult {
  place_id: string;
  name: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
  };
  rating?: number;
  user_ratings_total?: number;
  photos?: Array<{
    photo_reference: string;
  }>;
  types: string[];
  vicinity?: string;
}

interface PlacesAutocompleteProps {
  placeholder?: string;
  onPlaceSelect?: (place: PlaceResult) => void;
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  types?: string[];
  className?: string;
  disabled?: boolean;
}

export function PlacesAutocomplete({
  placeholder = "Digite um endereço ou local...",
  onPlaceSelect,
  onLocationSelect,
  types = ['establishment'],
  className = '',
  disabled = false
}: PlacesAutocompleteProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);

  useEffect(() => {
    const initAutocomplete = async () => {
      try {
        setIsLoading(true);
        await loadGoogleMapsAPI();
        setIsGoogleMapsLoaded(true);
        
        if (inputRef.current && window.google?.maps?.places) {
          // Initialize autocomplete
          autocompleteRef.current = new window.google.maps.places.Autocomplete(
            inputRef.current,
            {
              types: types,
              componentRestrictions: { country: 'BR' },
              fields: [
                'place_id',
                'name',
                'formatted_address', 
                'geometry',
                'rating',
                'user_ratings_total',
                'photos',
                'types',
                'vicinity'
              ]
            }
          );

          // Add place changed listener
          autocompleteRef.current.addListener('place_changed', () => {
            const place = autocompleteRef.current.getPlace();
            
            if (!place.geometry) {
              console.log('No details available for input: ' + place.name);
              return;
            }

            // Create PlaceResult object
            const placeResult: PlaceResult = {
              place_id: place.place_id,
              name: place.name || '',
              formatted_address: place.formatted_address || '',
              geometry: {
                location: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                }
              },
              rating: place.rating,
              user_ratings_total: place.user_ratings_total,
              photos: place.photos?.map((photo: any) => ({
                photo_reference: photo.getUrl()
              })),
              types: place.types || [],
              vicinity: place.vicinity
            };

            // Call callbacks
            if (onPlaceSelect) {
              onPlaceSelect(placeResult);
            }

            if (onLocationSelect) {
              onLocationSelect({
                lat: placeResult.geometry.location.lat,
                lng: placeResult.geometry.location.lng,
                address: placeResult.formatted_address
              });
            }
          });
        }
      } catch (error) {
        console.error('Error initializing Google Places Autocomplete:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (!disabled) {
      initAutocomplete();
    }

    // Cleanup
    return () => {
      if (autocompleteRef.current) {
        window.google?.maps?.event?.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [types, onPlaceSelect, onLocationSelect, disabled]);

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder={placeholder}
          className={`pl-10 pr-10 ${className}`}
          disabled={disabled || isLoading}
        />
        {isLoading && (
          <SpinningLogo size="sm" speed="fast" className="absolute right-3 top-3 text-muted-foreground" />
        )}
      </div>
      
      {!isGoogleMapsLoaded && !isLoading && (
        <p className="text-xs text-muted-foreground mt-1">
          Carregando serviço de localização...
        </p>
      )}
    </div>
  );
}