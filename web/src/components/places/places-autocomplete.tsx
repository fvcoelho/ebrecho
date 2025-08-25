'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { SpinningLogo } from '@/components/ui/spinning-logo';
import { MapPin, X } from 'lucide-react';
import { api } from '@/lib/api';
import debounce from 'lodash/debounce';

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
  formatted_phone_number?: string;
  international_phone_number?: string;
}

interface PlacesAutocompleteProps {
  placeholder?: string;
  onPlaceSelect?: (place: PlaceResult) => void;
  onLocationSelect?: (location: { lat: number; lng: number; address: string }) => void;
  types?: string[];
  className?: string;
  disabled?: boolean;
}

interface AutocompletePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
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
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<AutocompletePrediction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounced search function
  const searchPlaces = useCallback(
    debounce(async (input: string) => {
      if (input.length < 3) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        console.log('🔍 Searching places via backend API:', input);
        
        // Call backend autocomplete endpoint
        const response = await api.get('/api/places/autocomplete', {
          params: {
            input,
            types: types.join(','),
            country: 'BR',
            language: 'pt-BR'
          }
        });

        if (response.data.success) {
          const predictions = response.data.data.predictions || [];
          console.log(`📍 Found ${predictions.length} suggestions`);
          setSuggestions(predictions);
          setShowSuggestions(predictions.length > 0);
        } else {
          console.warn('Autocomplete failed:', response.data.error);
          setSuggestions([]);
        }
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 500),
    [types]
  );

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    setSelectedIndex(-1);
    
    if (value.trim()) {
      searchPlaces(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion selection
  const selectSuggestion = async (prediction: AutocompletePrediction) => {
    setInputValue(prediction.description);
    setShowSuggestions(false);
    setSuggestions([]);
    setIsLoading(true);

    try {
      console.log('📍 Getting place details for:', prediction.place_id);
      
      // Get place details from backend
      const response = await api.get('/api/places/details', {
        params: {
          placeId: prediction.place_id,
          language: 'pt-BR'
        }
      });

      if (response.data.success && response.data.data.result) {
        const place = response.data.data.result;
        
        // Create PlaceResult object
        const placeResult: PlaceResult = {
          place_id: place.place_id,
          name: place.name || prediction.structured_formatting?.main_text || '',
          formatted_address: place.formatted_address || prediction.description,
          geometry: place.geometry || { location: { lat: 0, lng: 0 } },
          rating: place.rating,
          user_ratings_total: place.user_ratings_total,
          photos: place.photos,
          types: place.types || [],
          vicinity: place.vicinity,
          formatted_phone_number: place.formatted_phone_number,
          international_phone_number: place.international_phone_number
        };

        console.log('✅ Place details retrieved:', {
          name: placeResult.name,
          phone: placeResult.formatted_phone_number
        });

        // Call callbacks
        if (onPlaceSelect) {
          onPlaceSelect(placeResult);
        }

        if (onLocationSelect && placeResult.geometry?.location) {
          onLocationSelect({
            lat: placeResult.geometry.location.lat,
            lng: placeResult.geometry.location.lng,
            address: placeResult.formatted_address
          });
        }
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Clear input
  const clearInput = () => {
    setInputValue('');
    setSuggestions([]);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className="relative">
      <div className="relative">
        <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={`pl-10 pr-10 ${className}`}
          disabled={disabled || isLoading}
        />
        {isLoading && (
          <SpinningLogo size="sm" speed="fast" className="absolute right-3 top-3 text-muted-foreground" />
        )}
        {inputValue && !isLoading && (
          <button
            onClick={clearInput}
            className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      
      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto"
        >
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.place_id}
              className={`px-3 py-2 cursor-pointer transition-colors ${
                index === selectedIndex
                  ? 'bg-accent text-accent-foreground'
                  : 'hover:bg-accent/50'
              }`}
              onClick={() => selectSuggestion(suggestion)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <div className="flex items-start">
                <MapPin className="h-4 w-4 mt-0.5 mr-2 flex-shrink-0 text-muted-foreground" />
                <div className="flex-1">
                  <div className="font-medium text-sm">
                    {suggestion.structured_formatting?.main_text || suggestion.description.split(',')[0]}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {suggestion.structured_formatting?.secondary_text || 
                     suggestion.description.split(',').slice(1).join(',')}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}