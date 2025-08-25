'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { MapPin, Search, Sliders, ChevronDown, ChevronUp, X } from 'lucide-react';
import { SpinningLogo } from '@/components/ui/spinning-logo';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Checkbox,
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  Badge,
} from '@/components/ui';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';

// Types for API responses
interface AutocompletePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface SearchCriteria {
  location: {
    lat: number;
    lng: number;
    radius: number;
  };
  filters?: {
    minRating?: number;
    maxRating?: number;
    minReviewCount?: number;
    priceLevel?: number[];
    openNow?: boolean;
    hasWebsite?: boolean;
    hasPhotos?: boolean;
  };
  pagination?: {
    page: number;
    limit: number;
  };
}

interface LocationSuggestion {
  address: string;
  lat: number;
  lng: number;
  placeId: string;
}

interface BrechoSearchFormProps {
  onSearch: (criteria: SearchCriteria) => void;
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  loading?: boolean;
}

// Form validation schema
const searchFormSchema = z.object({
  locationInput: z.string().min(3, 'Digite pelo menos 3 caracteres'),
  radius: z.number().min(100).max(50000),
  minRating: z.number().min(0).max(5).optional(),
  maxRating: z.number().min(0).max(5).optional(),
  minReviewCount: z.number().min(0).optional(),
  priceLevel: z.array(z.number().min(1).max(4)).optional(),
  openNow: z.boolean().optional(),
  hasWebsite: z.boolean().optional(),
  hasPhotos: z.boolean().optional(),
});

type SearchFormData = z.infer<typeof searchFormSchema>;

// Backend API location search service
const searchLocationWithAPI = async (input: string): Promise<LocationSuggestion[]> => {
  try {
    console.log('🔍 Searching locations via backend API:', { input });
    
    // Call backend autocomplete endpoint
    const autocompleteResponse = await api.get('/api/places/autocomplete', {
      params: {
        input,
        country: 'BR',
        types: 'geocode',
        language: 'pt-BR'
      }
    });

    if (!autocompleteResponse.data.success) {
      console.warn('Backend autocomplete failed:', autocompleteResponse.data.error);
      return [];
    }

    const predictions: AutocompletePrediction[] = autocompleteResponse.data.data.predictions || [];
    console.log('📍 Got autocomplete predictions:', predictions.length);

    // Get place details for each prediction to get coordinates
    const detailPromises = predictions.slice(0, 5).map(async (prediction) => {
      try {
        const detailResponse = await api.get('/api/places/details', {
          params: {
            placeId: prediction.place_id,
            fields: 'place_id,formatted_address,geometry',
            language: 'pt-BR'
          }
        });

        if (detailResponse.data.success && detailResponse.data.data.result) {
          const place = detailResponse.data.data.result;
          return {
            address: place.formatted_address || prediction.description,
            lat: place.geometry?.location?.lat || 0,
            lng: place.geometry?.location?.lng || 0,
            placeId: place.place_id
          } as LocationSuggestion;
        }
        return null;
      } catch (error) {
        console.warn('Failed to get place details:', error);
        return null;
      }
    });

    const results = await Promise.all(detailPromises);
    const validResults = results.filter((result): result is LocationSuggestion => result !== null);
    
    console.log('✅ Location search completed:', {
      input,
      predictionsFound: predictions.length,
      validResults: validResults.length
    });
    
    return validResults;
  } catch (error) {
    console.error('❌ Location search error:', error);
    return [];
  }
};


export function BrechoSearchForm({ onSearch, onLocationSelect, loading = false }: BrechoSearchFormProps) {
  // State for location handling
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isGoogleMapsLoaded, setIsGoogleMapsLoaded] = useState(false);
  const [googleMapsError, setGoogleMapsError] = useState<string | null>(null);

  // Form setup with validation
  const form = useForm<SearchFormData>({
    resolver: zodResolver(searchFormSchema),
    defaultValues: {
      locationInput: '',
      radius: 2000,
      minRating: undefined,
      maxRating: undefined,
      minReviewCount: undefined,
      priceLevel: [],
      openNow: false,
      hasWebsite: false,
      hasPhotos: false,
    },
  });

  const { watch, setValue, handleSubmit, reset } = form;
  const locationInput = watch('locationInput');
  const priceLevel = watch('priceLevel') || [];

  console.log('🔍 [FORM] BrechoSearchForm initialized with enhanced debugging:', {
    selectedLocation: selectedLocation?.address,
    radius: watch('radius'),
    hasAdvancedFilters: showAdvancedFilters,
    isGoogleMapsLoaded,
    debugFeatures: [
      '🚀 Form submission tracking with unique IDs',
      '📍 Location selection validation',
      '🔧 Filter building with detailed logging',
      '🌍 Google Places API interaction monitoring',
      '💰 Price level toggle tracking',
      '🧹 Clear actions logging',
      '⚠️ Enhanced error handling',
      '📊 Performance measurements'
    ],
    timestamp: new Date().toISOString()
  });

  // No need to load Google Maps API since we're using backend
  useEffect(() => {
    // Backend API is always available
    setIsGoogleMapsLoaded(true);
    setGoogleMapsError(null);
    console.log('✅ Backend location API ready');
  }, []);

  // Handle location input changes with debounced geocoding
  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    if (locationInput.length < 3) {
      setLocationSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeout = setTimeout(async () => {
      const searchStartTime = performance.now();
      
      try {
        setIsLoadingSuggestions(true);
        console.log('🌍 [GEOCODING] Starting location search:', {
          query: locationInput,
          queryLength: locationInput.length,
          timestamp: new Date().toISOString(),
          usingBackendAPI: true,
          existingSuggestions: locationSuggestions.length
        });
        
        // Use Backend Places API
        const suggestions = await searchLocationWithAPI(locationInput);
        const searchDuration = performance.now() - searchStartTime;
        
        console.log('✅ [BACKEND API] Location suggestions received:', {
          suggestionsCount: suggestions.length,
          duration: `${searchDuration.toFixed(2)}ms`,
          suggestions: suggestions.map(s => ({
            address: s.address,
            coordinates: { lat: s.lat, lng: s.lng },
            placeId: s.placeId
          }))
        });
        
        setLocationSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
        
        if (suggestions.length === 0) {
          console.warn('⚠️ [BACKEND API] No suggestions found for query:', locationInput);
        }
      } catch (error) {
        const searchDuration = performance.now() - searchStartTime;
        
        console.error('❌ [BACKEND API] Location search failed:', {
          error: error,
          query: locationInput,
          duration: `${searchDuration.toFixed(2)}ms`,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        });
        
        setLocationSuggestions([]);
        setShowSuggestions(false);
        
        // Enhanced error handling for backend API
        if (error instanceof Error) {
          if (error.message.includes('Network Error') || error.message.includes('timeout')) {
            console.warn('⚠️ [BACKEND API] Network error, please check connection');
          } else if (error.message.includes('401') || error.message.includes('403')) {
            console.warn('⚠️ [BACKEND API] Authentication error, please login again');
          } else if (error.message.includes('quota') || error.message.includes('billing')) {
            console.error('💰 [GEOCODING] Google API quota/billing issue detected');
          } else if (error.message.includes('key') || error.message.includes('API')) {
            console.error('🔑 [GEOCODING] Google API key issue detected');
          }
        }
      } finally {
        setIsLoadingSuggestions(false);
        console.log('🏁 [GEOCODING] Location search completed');
      }
    }, 300);

    setSearchTimeout(timeout);

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [locationInput]);

  const handleLocationSelect = (suggestion: LocationSuggestion) => {
    console.log('📍 [FORM] Location selected:', {
      suggestion: suggestion,
      timestamp: new Date().toISOString(),
      previousLocation: selectedLocation?.address,
      suggestionIndex: locationSuggestions.findIndex(s => s.placeId === suggestion.placeId),
      totalSuggestions: locationSuggestions.length
    });
    
    setSelectedLocation(suggestion);
    setValue('locationInput', suggestion.address);
    setShowSuggestions(false);
    
    // Validate coordinates
    if (suggestion.lat === 0 && suggestion.lng === 0) {
      console.warn('⚠️ [FORM] Location has zero coordinates, this might cause issues:', suggestion);
    }
    
    // Log form state after location selection
    console.log('📝 [FORM] Form state after location selection:', {
      locationInput: suggestion.address,
      radius: watch('radius'),
      selectedLocation: {
        address: suggestion.address,
        coordinates: { lat: suggestion.lat, lng: suggestion.lng }
      },
      formIsValid: !!suggestion && suggestion.lat !== 0 && suggestion.lng !== 0
    });
    
    if (onLocationSelect) {
      console.log('📤 [FORM] Calling parent onLocationSelect callback...');
      onLocationSelect(suggestion);
    }
  };

  const onSubmit = (data: SearchFormData) => {
    console.log('🚀 [SEARCH] Form submission started:', {
      timestamp: new Date().toISOString(),
      formData: data,
      selectedLocation: selectedLocation,
      hasSelectedLocation: !!selectedLocation,
      isGoogleMapsLoaded,
      loading
    });

    // Validation: Check if location is selected
    if (!selectedLocation) {
      console.error('❌ [SEARCH] Submit blocked - No location selected:', {
        locationInput: data.locationInput,
        hasLocationSuggestions: locationSuggestions.length,
        showSuggestions
      });
      
      // Show user-friendly error
      alert('Por favor, selecione uma localização da lista de sugestões antes de buscar.');
      return;
    }

    // Build filters object with detailed logging
    const filters: SearchCriteria['filters'] = {};
    console.log('🔧 [SEARCH] Building filters from form data...');
    
    if (data.minRating !== undefined) {
      filters.minRating = data.minRating;
      console.log('  ⭐ Min rating:', data.minRating);
    }
    if (data.maxRating !== undefined) {
      filters.maxRating = data.maxRating;
      console.log('  ⭐ Max rating:', data.maxRating);
    }
    if (data.minReviewCount !== undefined) {
      filters.minReviewCount = data.minReviewCount;
      console.log('  📝 Min reviews:', data.minReviewCount);
    }
    if (data.priceLevel && data.priceLevel.length > 0) {
      filters.priceLevel = data.priceLevel;
      console.log('  💰 Price levels:', data.priceLevel);
    }
    if (data.openNow) {
      filters.openNow = true;
      console.log('  🕐 Open now: true');
    }
    if (data.hasWebsite) {
      filters.hasWebsite = true;
      console.log('  🌐 Has website: true');
    }
    if (data.hasPhotos) {
      filters.hasPhotos = true;
      console.log('  📷 Has photos: true');
    }

    const filterCount = Object.keys(filters).length;
    console.log(`✅ [SEARCH] Filters built: ${filterCount} active filters`, filters);

    // Build search criteria
    const criteria: SearchCriteria = {
      location: {
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        radius: data.radius
      },
      filters: filterCount > 0 ? filters : undefined,
      pagination: {
        page: 1,
        limit: 50
      }
    };

    console.log('🎯 [SEARCH] Final search criteria:', {
      location: {
        address: selectedLocation.address,
        coordinates: { lat: selectedLocation.lat, lng: selectedLocation.lng },
        radius: `${data.radius >= 1000 ? (data.radius / 1000) + 'km' : data.radius + 'm'}`
      },
      activeFilters: filterCount,
      pagination: criteria.pagination,
      estimatedSearchArea: `${(Math.PI * Math.pow(data.radius / 1000, 2)).toFixed(2)} km²`
    });

    console.log('🚀 [SEARCH] Calling onSearch callback...');
    const searchStartTime = performance.now();
    
    try {
      onSearch(criteria);
      console.log('✅ [SEARCH] onSearch callback completed in', (performance.now() - searchStartTime).toFixed(2), 'ms');
    } catch (error) {
      console.error('❌ [SEARCH] onSearch callback failed:', error);
      alert('Erro interno ao executar busca. Verifique o console para mais detalhes.');
    }
  };

  const togglePriceLevel = (level: number) => {
    const currentPriceLevel = priceLevel || [];
    const newPriceLevel = currentPriceLevel.includes(level) 
      ? currentPriceLevel.filter(l => l !== level)
      : [...currentPriceLevel, level];
    
    console.log('💰 [FORM] Price level toggled:', {
      level: level,
      action: currentPriceLevel.includes(level) ? 'removed' : 'added',
      previousLevels: currentPriceLevel,
      newLevels: newPriceLevel,
      priceSymbols: newPriceLevel.map(l => '$'.repeat(l)).join(', ')
    });
    
    setValue('priceLevel', newPriceLevel);
  };

  const clearLocation = () => {
    console.log('🧹 [FORM] Clearing location:', {
      previousLocation: selectedLocation?.address,
      timestamp: new Date().toISOString()
    });
    
    setSelectedLocation(null);
    setValue('locationInput', '');
    setShowSuggestions(false);
    
    console.log('✅ [FORM] Location cleared successfully');
  };

  const clearFilters = () => {
    const previousFilters = {
      minRating: watch('minRating'),
      maxRating: watch('maxRating'),
      minReviewCount: watch('minReviewCount'),
      priceLevel: watch('priceLevel'),
      openNow: watch('openNow'),
      hasWebsite: watch('hasWebsite'),
      hasPhotos: watch('hasPhotos')
    };
    
    console.log('🧹 [FORM] Clearing filters:', {
      previousFilters: previousFilters,
      activeFiltersCount: getActiveFiltersCount(),
      timestamp: new Date().toISOString()
    });
    
    setValue('minRating', undefined);
    setValue('maxRating', undefined);
    setValue('minReviewCount', undefined);
    setValue('priceLevel', []);
    setValue('openNow', false);
    setValue('hasWebsite', false);
    setValue('hasPhotos', false);
    
    console.log('✅ [FORM] All filters cleared successfully');
  };

  const getActiveFiltersCount = () => {
    const data = form.getValues();
    return Object.keys({
      ...(data.minRating && { minRating: data.minRating }),
      ...(data.maxRating && { maxRating: data.maxRating }),
      ...(data.minReviewCount && { minReviewCount: data.minReviewCount }),
      ...(data.priceLevel && data.priceLevel.length > 0 && { priceLevel: data.priceLevel }),
      ...(data.openNow && { openNow: data.openNow }),
      ...(data.hasWebsite && { hasWebsite: data.hasWebsite }),
      ...(data.hasPhotos && { hasPhotos: data.hasPhotos })
    }).length;
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Location Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Localização
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Location Input */}
            <FormField
              control={form.control}
              name="locationInput"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço ou Cidade</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        placeholder={
                          !isGoogleMapsLoaded 
                            ? "Carregando serviço de localização..." 
                            : "Digite um endereço, cidade ou bairro..."
                        }
                        className="pl-10"
                        disabled={!isGoogleMapsLoaded}
                      />
                      {(isLoadingSuggestions || !isGoogleMapsLoaded) && (
                        <SpinningLogo size="sm" speed="fast" className="absolute right-3 top-3 text-muted-foreground" />
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                  
                  {/* Backend API Error */}
                  {googleMapsError && (
                    <div className="text-sm text-red-600 flex items-center gap-2">
                      <span>⚠️ Erro no serviço de localização: {googleMapsError}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => window.location.reload()}
                        className="h-6 text-xs"
                      >
                        Recarregar
                      </Button>
                    </div>
                  )}
                  
                  {/* Location Suggestions */}
                  {showSuggestions && locationSuggestions.length > 0 && (
                    <Card className="absolute z-50 w-full mt-1 border shadow-lg">
                      <CardContent className="p-0">
                        {locationSuggestions.map((suggestion, index) => (
                          <button
                            key={suggestion.placeId}
                            type="button"
                            className="w-full text-left px-4 py-3 hover:bg-muted border-b last:border-b-0 flex items-center gap-2 transition-colors"
                            onClick={() => handleLocationSelect(suggestion)}
                          >
                            <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <span className="text-sm">{suggestion.address}</span>
                          </button>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </FormItem>
              )}
            />

            {/* Selected Location Display */}
            {selectedLocation && (
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-md">
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">{selectedLocation.address}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearLocation}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {/* Radius Selector */}
            <FormField
              control={form.control}
              name="radius"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Raio de Busca</FormLabel>
                  <div className="flex items-center gap-4">
                    <FormControl>
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(parseInt(value))}
                      >
                        <SelectTrigger className="flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="500">500m</SelectItem>
                          <SelectItem value="1000">1km</SelectItem>
                          <SelectItem value="2000">2km</SelectItem>
                          <SelectItem value="5000">5km</SelectItem>
                          <SelectItem value="10000">10km</SelectItem>
                          <SelectItem value="20000">20km</SelectItem>
                          <SelectItem value="50000">50km</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <Badge variant="secondary">
                      {field.value >= 1000 ? `${field.value / 1000}km` : `${field.value}m`}
                    </Badge>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Advanced Filters Toggle */}
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          className="w-full justify-between"
        >
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4" />
            Filtros Avançados
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-2">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </div>
          {showAdvancedFilters ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>

        {/* Advanced Filters */}
        {showAdvancedFilters && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Filtros Avançados</CardTitle>
                <Button type="button" variant="ghost" size="sm" onClick={clearFilters}>
                  Limpar Filtros
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rating Filters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="minRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avaliação Mínima</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value?.toString() || 'any'}
                          onValueChange={(value) => field.onChange(value && value !== 'any' ? parseFloat(value) : undefined)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Qualquer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Qualquer</SelectItem>
                            <SelectItem value="1">⭐ 1 estrela</SelectItem>
                            <SelectItem value="2">⭐ 2 estrelas</SelectItem>
                            <SelectItem value="3">⭐ 3 estrelas</SelectItem>
                            <SelectItem value="4">⭐ 4 estrelas</SelectItem>
                            <SelectItem value="4.5">⭐ 4.5 estrelas</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="maxRating"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Avaliação Máxima</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value?.toString() || 'any'}
                          onValueChange={(value) => field.onChange(value && value !== 'any' ? parseFloat(value) : undefined)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Qualquer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="any">Qualquer</SelectItem>
                            <SelectItem value="2">⭐ 2 estrelas</SelectItem>
                            <SelectItem value="3">⭐ 3 estrelas</SelectItem>
                            <SelectItem value="4">⭐ 4 estrelas</SelectItem>
                            <SelectItem value="5">⭐ 5 estrelas</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Review Count */}
              <FormField
                control={form.control}
                name="minReviewCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mínimo de Avaliações</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        placeholder="Ex: 10"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Price Level */}
              <div className="space-y-3">
                <Label>Nível de Preço</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map(level => (
                    <Button
                      key={level}
                      type="button"
                      variant={priceLevel.includes(level) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => togglePriceLevel(level)}
                      className={cn(
                        "transition-colors",
                        priceLevel.includes(level) && "bg-primary text-primary-foreground"
                      )}
                    >
                      {'$'.repeat(level)}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  $ = Muito barato • $$ = Barato • $$$ = Moderado • $$$$ = Caro
                </p>
              </div>

              {/* Boolean Filters */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="openNow"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Aberto agora
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hasWebsite"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Tem website
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hasPhotos"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Tem fotos
                      </FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search Button */}
        <div className="flex gap-3">
          <Button 
            type="submit"
            disabled={!selectedLocation || loading}
            className="flex-1"
            size="lg"
          >
            {loading ? (
              <>
                <SpinningLogo size="sm" speed="fast" className="mr-2" />
                Buscando...
              </>
            ) : (
              <>
                <Search className="mr-2 h-4 w-4" />
                Buscar Brechós
              </>
            )}
          </Button>
          
          {selectedLocation && (
            <Button 
              type="button"
              variant="outline"
              onClick={clearLocation}
              size="lg"
            >
              <X className="mr-2 h-4 w-4" />
              Limpar
            </Button>
          )}
        </div>

        {/* Search Summary */}
        {selectedLocation && (
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="space-y-2">
                <h4 className="font-medium text-sm">Busca Configurada:</h4>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{selectedLocation.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Search className="h-4 w-4" />
                    <span>Raio: {watch('radius') >= 1000 ? `${watch('radius') / 1000}km` : `${watch('radius')}m`}</span>
                  </div>
                  {getActiveFiltersCount() > 0 && (
                    <div className="flex items-center gap-2">
                      <Sliders className="h-4 w-4" />
                      <span>{getActiveFiltersCount()} filtros aplicados</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </form>
    </Form>
  );
}