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
import { loadGoogleMapsAPI } from '@/lib/google-maps-loader';

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
      await loadGoogleMapsAPI();
      
      if (!window.google?.maps?.places) {
        throw new Error('Google Places API não carregada');
      }

      const map = new window.google.maps.Map(document.createElement('div'));
      const service = new window.google.maps.places.PlacesService(map);

      const searchPromises = searchFilters.types.map(type => {
        return new Promise<PlaceResult[]>((resolve, reject) => {
          const request = {
            location: new window.google.maps.LatLng(location.lat, location.lng),
            radius: searchFilters.radius,
            type: type === 'establishment' ? undefined : type,
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
          };

          service.nearbySearch(request, (results, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && results) {
              const filteredResults = results
                .filter(place => 
                  place.rating ? place.rating >= searchFilters.minRating : searchFilters.minRating === 0
                )
                .map(place => ({
                  place_id: place.place_id || '',
                  name: place.name || '',
                  formatted_address: place.formatted_address || '',
                  geometry: {
                    location: {
                      lat: place.geometry?.location?.lat() || 0,
                      lng: place.geometry?.location?.lng() || 0
                    }
                  },
                  rating: place.rating,
                  user_ratings_total: place.user_ratings_total,
                  photos: place.photos?.map(photo => ({
                    photo_reference: photo.getUrl()
                  })),
                  types: place.types || [],
                  vicinity: place.vicinity
                }));
              
              resolve(filteredResults);
            } else {
              console.warn(`Search failed for type ${type}:`, status);
              resolve([]);
            }
          });
        });
      });

      const allResults = await Promise.all(searchPromises);
      const combinedResults = allResults.flat();
      
      // Remove duplicates based on place_id
      const uniqueResults = combinedResults.filter((business, index, array) => 
        array.findIndex(b => b.place_id === business.place_id) === index
      );

      // Sort by rating (highest first), then by review count
      const sortedResults = uniqueResults.sort((a, b) => {
        if (a.rating && b.rating) {
          if (a.rating !== b.rating) return b.rating - a.rating;
          return (b.user_ratings_total || 0) - (a.user_ratings_total || 0);
        }
        if (a.rating && !b.rating) return -1;
        if (!a.rating && b.rating) return 1;
        return (b.user_ratings_total || 0) - (a.user_ratings_total || 0);
      });

      setBusinesses(sortedResults);
    } catch (error) {
      console.error('Erro na busca por estabelecimentos:', error);
    } finally {
      setIsSearching(false);
    }
  }, []);

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
            Buscar Estabelecimentos
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