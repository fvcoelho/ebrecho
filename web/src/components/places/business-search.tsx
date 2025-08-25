'use client';

import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, MapPin, Filter, X, RefreshCw } from 'lucide-react';
import { SpinningLogo } from '@/components/ui/spinning-logo';
import { PlacesAutocomplete, type PlaceResult } from './places-autocomplete';
import { BusinessCard } from './business-card';
import { api } from '@/lib/api';

interface BusinessSearchProps {
  onBusinessInvite?: (business: PlaceResult) => void;
  className?: string;
}

interface SearchFilters {
  radius: number;
  types: string[];
  minRating: number;
}

const BUSINESS_TYPES = [
  { value: 'store', label: 'Lojas' },
  { value: 'clothing_store', label: 'Lojas de Roupas' },
  { value: 'shoe_store', label: 'Lojas de Calçados' },
  { value: 'jewelry_store', label: 'Joalherias' },
  { value: 'beauty_salon', label: 'Salões de Beleza' },
  { value: 'hair_care', label: 'Cabeleireiros' },
  { value: 'spa', label: 'Spas' },
  { value: 'gym', label: 'Academias' },
  { value: 'shopping_mall', label: 'Shopping Centers' },
  { value: 'department_store', label: 'Lojas de Departamento' },
  { value: 'establishment', label: 'Todos os Estabelecimentos' }
];

const RADIUS_OPTIONS = [
  { value: 1000, label: '1 km' },
  { value: 2000, label: '2 km' },
  { value: 5000, label: '5 km' },
  { value: 10000, label: '10 km' },
  { value: 25000, label: '25 km' },
  { value: 50000, label: '50 km' }
];

const RATING_OPTIONS = [
  { value: 0, label: 'Qualquer avaliação' },
  { value: 3, label: '3+ estrelas' },
  { value: 4, label: '4+ estrelas' },
  { value: 4.5, label: '4.5+ estrelas' }
];

export function BusinessSearch({ onBusinessInvite, className = '' }: BusinessSearchProps) {
  const [searchLocation, setSearchLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [businesses, setBusinesses] = useState<PlaceResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [invitingBusinessIds, setInvitingBusinessIds] = useState<Set<string>>(new Set());
  const [invitedBusinessIds, setInvitedBusinessIds] = useState<Set<string>>(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({
    radius: 5000,
    types: ['store'],
    minRating: 0
  });

  const searchNearbyBusinesses = useCallback(async (location: { lat: number; lng: number }, searchFilters: SearchFilters) => {
    if (!location) return;

    setIsSearching(true);
    setBusinesses([]);

    try {
      console.log('🔍 Searching businesses via backend nearby API:', { location, searchFilters });
      
      // Search for each business type using the new nearby search API
      const searchPromises = searchFilters.types.map(async (type) => {
        try {
          console.log(`🔍 Searching for type: ${type} near ${location.lat},${location.lng}`);
          
          // Use the new nearby search endpoint
          const nearbyResponse = await api.get('/api/places/nearby', {
            params: {
              location: `${location.lat},${location.lng}`,
              radius: searchFilters.radius,
              type: type === 'establishment' ? 'establishment' : type,
              language: 'pt-BR'
            }
          });

          if (!nearbyResponse.data.success) {
            console.warn(`Nearby search failed for type ${type}:`, nearbyResponse.data.error);
            return [];
          }

          const nearbyResults = nearbyResponse.data.data.results || [];
          console.log(`📍 Found ${nearbyResults.length} nearby places for type ${type}`);
          
          // Get detailed information for each place (including phone numbers)
          const detailPromises = nearbyResults.slice(0, 15).map(async (place: any) => {
            try {
              // Get full place details which includes phone numbers
              const detailResponse = await api.get('/api/places/details', {
                params: {
                  placeId: place.place_id,
                  language: 'pt-BR'
                }
              });

              if (detailResponse.data.success && detailResponse.data.data.result) {
                const fullPlace = detailResponse.data.data.result;
                
                // Filter by minimum rating if specified
                if (searchFilters.minRating > 0 && (!place.rating || place.rating < searchFilters.minRating)) {
                  return null;
                }
                
                // Calculate distance from search location
                const distance = place.geometry?.location ? 
                  calculateDistance(
                    location.lat, 
                    location.lng,
                    place.geometry.location.lat,
                    place.geometry.location.lng
                  ) : null;
                
                // Merge nearby search data with detailed place data
                return {
                  place_id: place.place_id,
                  name: fullPlace.name || place.name || '',
                  formatted_address: fullPlace.formatted_address || place.vicinity || '',
                  geometry: place.geometry || { location: { lat: 0, lng: 0 } },
                  rating: place.rating,
                  user_ratings_total: place.user_ratings_total,
                  photos: place.photos || [],
                  types: place.types || [],
                  vicinity: place.vicinity || '',
                  formatted_phone_number: fullPlace.formatted_phone_number,
                  international_phone_number: fullPlace.international_phone_number,
                  business_status: place.business_status,
                  price_level: place.price_level,
                  distance: distance
                } as PlaceResult & { distance?: number };
              } else {
                // Use nearby data if details fail
                const distance = place.geometry?.location ? 
                  calculateDistance(
                    location.lat, 
                    location.lng,
                    place.geometry.location.lat,
                    place.geometry.location.lng
                  ) : null;
                
                return {
                  place_id: place.place_id,
                  name: place.name || '',
                  formatted_address: place.vicinity || '',
                  geometry: place.geometry || { location: { lat: 0, lng: 0 } },
                  rating: place.rating,
                  user_ratings_total: place.user_ratings_total,
                  photos: place.photos || [],
                  types: place.types || [],
                  vicinity: place.vicinity || '',
                  business_status: place.business_status,
                  distance: distance
                } as PlaceResult & { distance?: number };
              }
            } catch (error) {
              console.warn('Failed to get detailed info for place:', place.place_id, error);
              // Return basic info if details fail
              return {
                place_id: place.place_id,
                name: place.name || '',
                formatted_address: place.vicinity || '',
                geometry: place.geometry || { location: { lat: 0, lng: 0 } },
                rating: place.rating,
                user_ratings_total: place.user_ratings_total,
                photos: place.photos || [],
                types: place.types || [],
                vicinity: place.vicinity || '',
              } as PlaceResult;
            }
          });

          const results = await Promise.all(detailPromises);
          return results.filter((result): result is PlaceResult => result !== null);
        } catch (error) {
          console.error(`Error searching nearby for type ${type}:`, error);
          return [];
        }
      });

      const allResults = await Promise.all(searchPromises);
      const combinedResults = allResults.flat();
      
      // Remove duplicates based on place_id
      const uniqueResults = combinedResults.filter((business, index, array) => 
        array.findIndex(b => b.place_id === business.place_id) === index
      );

      // Sort by distance first (if available), then by rating
      const sortedResults = uniqueResults.sort((a, b) => {
        const distA = (a as any).distance;
        const distB = (b as any).distance;
        
        if (distA !== undefined && distB !== undefined) {
          return distA - distB;
        }
        
        // Then sort by rating
        if (a.rating && b.rating) {
          if (a.rating !== b.rating) return b.rating - a.rating;
          return (b.user_ratings_total || 0) - (a.user_ratings_total || 0);
        }
        if (a.rating && !b.rating) return -1;
        if (!a.rating && b.rating) return 1;
        return (b.user_ratings_total || 0) - (a.user_ratings_total || 0);
      });

      setBusinesses(sortedResults);
      console.log('✅ Found nearby businesses:', sortedResults.length);
    } catch (error) {
      console.error('❌ Erro na busca por estabelecimentos próximos:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

  // Helper function to calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c; // Distance in meters
  };

  const handleLocationSelect = useCallback((location: { lat: number; lng: number; address: string }) => {
    setSearchLocation(location);
    searchNearbyBusinesses(location, filters);
  }, [filters, searchNearbyBusinesses]);

  const handleBusinessInvite = useCallback(async (business: PlaceResult) => {
    if (invitingBusinessIds.has(business.place_id) || invitedBusinessIds.has(business.place_id)) {
      return;
    }

    setInvitingBusinessIds(prev => new Set(prev).add(business.place_id));

    try {
      // Simulate API call for invite
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      if (onBusinessInvite) {
        onBusinessInvite(business);
      }
      
      setInvitedBusinessIds(prev => new Set(prev).add(business.place_id));
    } catch (error) {
      console.error('Erro ao enviar convite:', error);
    } finally {
      setInvitingBusinessIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(business.place_id);
        return newSet;
      });
    }
  }, [invitingBusinessIds, invitedBusinessIds, onBusinessInvite]);

  const handleFiltersChange = useCallback((newFilters: Partial<SearchFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    
    if (searchLocation) {
      searchNearbyBusinesses(searchLocation, updatedFilters);
    }
  }, [filters, searchLocation, searchNearbyBusinesses]);

  const handleRefreshSearch = useCallback(() => {
    if (searchLocation) {
      searchNearbyBusinesses(searchLocation, filters);
    }
  }, [searchLocation, filters, searchNearbyBusinesses]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Search className="h-5 w-5 mr-2" />
            Estabelecimentos por Endereço
            </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Local de busca
            </label>
            <PlacesAutocomplete
              placeholder="Digite um endereço ou local para buscar estabelecimentos próximos..."
              onLocationSelect={handleLocationSelect}
              types={['geocode']}
              className="w-full"
            />
          </div>

          {searchLocation && (
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div className="flex items-center text-sm">
                <MapPin className="h-4 w-4 mr-2" />
                <span className="truncate">{searchLocation.address}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefreshSearch}
                disabled={isSearching}
              >
                <RefreshCw className={`h-4 w-4 ${isSearching ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filters */}
      {searchLocation && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filtros</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Ocultar' : 'Mostrar'} filtros
              </Button>
            </div>
          </CardHeader>
          
          {showFilters && (
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Raio de busca</label>
                  <Select 
                    value={filters.radius.toString()} 
                    onValueChange={(value) => handleFiltersChange({ radius: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RADIUS_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Avaliação mínima</label>
                  <Select 
                    value={filters.minRating.toString()} 
                    onValueChange={(value) => handleFiltersChange({ minRating: parseFloat(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {RATING_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value.toString()}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Tipos de estabelecimento</label>
                  <Select 
                    value={filters.types[0] || 'store'} 
                    onValueChange={(value) => handleFiltersChange({ types: [value] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Search Results */}
      {searchLocation && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Estabelecimentos encontrados
                {businesses.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {businesses.length}
                  </Badge>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {isSearching ? (
              <div className="flex flex-col items-center justify-center py-12">
                <SpinningLogo size="lg" speed="normal" />
                <p className="text-muted-foreground mt-4">Buscando estabelecimentos...</p>
              </div>
            ) : businesses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {businesses.map((business) => (
                  <BusinessCard
                    key={business.place_id}
                    business={business}
                    onInvite={handleBusinessInvite}
                    isInviting={invitingBusinessIds.has(business.place_id)}
                    isInvited={invitedBusinessIds.has(business.place_id)}
                  />
                ))}
              </div>
            ) : searchLocation ? (
              <div className="text-center py-12 text-muted-foreground">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum estabelecimento encontrado nesta localização.</p>
                <p className="text-sm mt-1">Tente alterar os filtros ou buscar em outra região.</p>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}
    </div>
  );
}