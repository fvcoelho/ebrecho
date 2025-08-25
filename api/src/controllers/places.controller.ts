import { Request, Response } from 'express';
import { z } from 'zod';
import axios from 'axios';

// Validation schemas
const autocompleteSchema = z.object({
  input: z.string().min(3, 'Input must be at least 3 characters'),
  types: z.array(z.string()).optional(),
  componentRestrictions: z.object({
    country: z.string().optional()
  }).optional(),
  language: z.string().optional(),
  region: z.string().optional()
});

const placeDetailsSchema = z.object({
  placeId: z.string().min(1, 'Place ID is required'),
  fields: z.array(z.string()).optional(),
  language: z.string().optional()
});

// Response interfaces
interface AutocompletePrediction {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
    main_text_matched_substrings?: Array<{
      offset: number;
      length: number;
    }>;
  };
  types: string[];
  matched_substrings?: Array<{
    offset: number;
    length: number;
  }>;
  terms: Array<{
    offset: number;
    value: string;
  }>;
}

interface PlaceDetails {
  place_id: string;
  name: string;
  formatted_address: string;
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    viewport?: {
      northeast: { lat: number; lng: number };
      southwest: { lat: number; lng: number };
    };
  };
  rating?: number;
  user_ratings_total?: number;
  price_level?: number;
  types: string[];
  formatted_phone_number?: string;
  international_phone_number?: string;
  website?: string;
  opening_hours?: {
    open_now?: boolean;
    periods?: Array<{
      close?: { day: number; time: string };
      open?: { day: number; time: string };
    }>;
    weekday_text?: string[];
  };
  photos?: Array<{
    photo_reference: string;
    height: number;
    width: number;
  }>;
  business_status?: string;
}

export class PlacesController {
  private apiKey: string;
  private baseUrl = 'https://maps.googleapis.com/maps/api/place';
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.apiKey = process.env.GOOGLE_PLACES_API_KEY!;
    
    if (!this.apiKey) {
      console.error('❌ GOOGLE_PLACES_API_KEY environment variable is required');
      throw new Error('Google Places API key not configured');
    }
  }

  /**
   * Get place autocomplete suggestions
   * GET /api/places/autocomplete?input=query&country=BR
   */
  async autocomplete(req: Request, res: Response) {
    try {
      console.log('🔍 PlacesController.autocomplete:', {
        query: req.query,
        userAgent: req.get('User-Agent')
      });

      // Validate query parameters
      const validatedQuery = autocompleteSchema.parse({
        input: req.query.input,
        types: req.query.types ? (req.query.types as string).split(',') : ['geocode'],
        componentRestrictions: req.query.country ? {
          country: req.query.country as string
        } : { country: 'BR' }, // Default to Brazil
        language: (req.query.language as string) || 'pt-BR',
        region: (req.query.region as string) || 'br'
      });

      // Check cache first
      const cacheKey = `autocomplete:${JSON.stringify(validatedQuery)}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        console.log('✅ Returning cached autocomplete results');
        return res.json({
          success: true,
          data: cached.data,
          cached: true
        });
      }

      // Make request to Google Places Autocomplete API
      const response = await axios.get(`${this.baseUrl}/autocomplete/json`, {
        params: {
          input: validatedQuery.input,
          types: validatedQuery.types?.join('|'),
          components: validatedQuery.componentRestrictions?.country ? 
            `country:${validatedQuery.componentRestrictions.country}` : undefined,
          language: validatedQuery.language,
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        console.error('❌ Google Places Autocomplete API error:', {
          status: response.data.status,
          error_message: response.data.error_message
        });
        
        return res.status(400).json({
          success: false,
          error: `Google Places API error: ${response.data.error_message || response.data.status}`
        });
      }

      const predictions: AutocompletePrediction[] = response.data.predictions || [];
      
      console.log('✅ Autocomplete successful:', {
        input: validatedQuery.input,
        predictionsCount: predictions.length,
        status: response.data.status
      });

      // Cache the results
      this.cache.set(cacheKey, {
        data: {
          predictions,
          status: response.data.status
        },
        timestamp: Date.now()
      });

      return res.json({
        success: true,
        data: {
          predictions,
          status: response.data.status
        },
        cached: false
      });

    } catch (error) {
      console.error('❌ Autocomplete error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request parameters',
          details: error.errors
        });
      }

      if (axios.isAxiosError(error)) {
        console.error('API Response:', error.response?.data);
        return res.status(error.response?.status || 500).json({
          success: false,
          error: 'External API error',
          details: error.response?.data
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get detailed information for a specific place
   * GET /api/places/details?placeId=ChIJN1t_tDeuEmsRUsoyG83frY4
   */
  async details(req: Request, res: Response) {
    try {
      console.log('🔍 PlacesController.details:', {
        query: req.query,
        userAgent: req.get('User-Agent')
      });

      // Validate query parameters
      const validatedQuery = placeDetailsSchema.parse({
        placeId: req.query.placeId,
        fields: req.query.fields ? 
          (req.query.fields as string).split(',') : [
            'place_id',
            'name', 
            'formatted_address',
            'address_components',
            'geometry',
            'types',
            'formatted_phone_number',
            'international_phone_number',
            'rating',
            'user_ratings_total',
            'photos'
          ],
        language: (req.query.language as string) || 'pt-BR'
      });

      // Check cache first
      const cacheKey = `details:${validatedQuery.placeId}:${validatedQuery.fields?.join(',')}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
        console.log('✅ Returning cached place details');
        return res.json({
          success: true,
          data: cached.data,
          cached: true
        });
      }

      // Make request to Google Place Details API
      const response = await axios.get(`${this.baseUrl}/details/json`, {
        params: {
          place_id: validatedQuery.placeId,
          fields: validatedQuery.fields?.join(','),
          language: validatedQuery.language,
          key: this.apiKey
        }
      });

      if (response.data.status !== 'OK') {
        console.error('❌ Google Place Details API error:', {
          status: response.data.status,
          error_message: response.data.error_message
        });
        
        return res.status(400).json({
          success: false,
          error: `Google Places API error: ${response.data.error_message || response.data.status}`
        });
      }

      const result: PlaceDetails = response.data.result;
      
      console.log('✅ Place details successful:', {
        placeId: validatedQuery.placeId,
        name: result.name,
        address: result.formatted_address
      });

      // Cache the results
      this.cache.set(cacheKey, {
        data: {
          result,
          status: response.data.status
        },
        timestamp: Date.now()
      });

      return res.json({
        success: true,
        data: {
          result,
          status: response.data.status
        },
        cached: false
      });

    } catch (error) {
      console.error('❌ Place details error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request parameters',
          details: error.errors
        });
      }

      if (axios.isAxiosError(error)) {
        console.error('API Response:', error.response?.data);
        return res.status(error.response?.status || 500).json({
          success: false,
          error: 'External API error',
          details: error.response?.data
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get place photo URL
   * GET /api/places/photo?photoReference=ref&maxWidth=400
   */
  async getPhotoUrl(req: Request, res: Response) {
    try {
      const { photoReference, maxWidth = 400, maxHeight } = req.query;
      
      if (!photoReference) {
        return res.status(400).json({
          success: false,
          error: 'Photo reference is required'
        });
      }

      const params: any = {
        photoreference: photoReference,
        key: this.apiKey
      };

      if (maxWidth) params.maxwidth = parseInt(maxWidth as string);
      if (maxHeight) params.maxheight = parseInt(maxHeight as string);

      const photoUrl = `${this.baseUrl}/photo?${new URLSearchParams(params).toString()}`;

      console.log('📷 Photo URL generated:', {
        photoReference,
        maxWidth,
        maxHeight
      });

      return res.json({
        success: true,
        data: {
          photoUrl
        }
      });

    } catch (error) {
      console.error('❌ Photo URL error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Clear API cache (for development/debugging)
   * DELETE /api/places/cache
   */
  async clearCache(req: Request, res: Response) {
    try {
      const cacheSize = this.cache.size;
      this.cache.clear();
      
      console.log('🧹 Places API cache cleared:', { previousSize: cacheSize });
      
      return res.json({
        success: true,
        data: {
          message: 'Cache cleared successfully',
          previousSize: cacheSize
        }
      });
    } catch (error) {
      console.error('❌ Clear cache error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Get API usage statistics
   * GET /api/places/stats
   */
  async getStats(req: Request, res: Response) {
    try {
      const now = Date.now();
      let validCacheEntries = 0;
      let expiredCacheEntries = 0;

      this.cache.forEach((value) => {
        if (now - value.timestamp < this.cacheTimeout) {
          validCacheEntries++;
        } else {
          expiredCacheEntries++;
        }
      });

      const stats = {
        cache: {
          totalEntries: this.cache.size,
          validEntries: validCacheEntries,
          expiredEntries: expiredCacheEntries,
          cacheTimeoutMinutes: this.cacheTimeout / (60 * 1000)
        },
        api: {
          hasApiKey: !!this.apiKey,
          baseUrl: this.baseUrl
        }
      };

      console.log('📊 Places API stats requested:', stats);

      return res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('❌ Stats error:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }

  /**
   * Search for nearby businesses using Google Places Nearby Search
   * GET /api/places/nearby?location=lat,lng&radius=5000&type=store
   */
  async nearby(req: Request, res: Response) {
    try {
      console.log('🔍 PlacesController.nearby:', {
        query: req.query,
        userAgent: req.get('User-Agent')
      });

      // Validate query parameters
      const nearbySchema = z.object({
        location: z.string().regex(/^-?\d+\.?\d*,-?\d+\.?\d*$/, 'Location must be in format "lat,lng"'),
        radius: z.coerce.number().min(1).max(50000).optional().default(5000),
        type: z.string().optional().default('establishment'),
        keyword: z.string().optional(),
        language: z.string().optional().default('pt-BR')
      });

      const validatedQuery = nearbySchema.parse(req.query);
      const cacheKey = `nearby:${JSON.stringify(validatedQuery)}`;

      // Check cache
      const cached = this.cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('📋 Returning cached nearby results');
        return res.json({
          success: true,
          data: cached.data,
          cached: true
        });
      }

      // Make request to Google Places Nearby Search API
      const apiKey = process.env.GOOGLE_PLACES_API_KEY;
      if (!apiKey) {
        throw new Error('GOOGLE_PLACES_API_KEY not configured');
      }

      const url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
      const params = {
        location: validatedQuery.location,
        radius: validatedQuery.radius.toString(),
        type: validatedQuery.type,
        language: validatedQuery.language,
        key: apiKey,
        ...(validatedQuery.keyword && { keyword: validatedQuery.keyword })
      };

      console.log('📡 Making Google Places Nearby Search API request:', { url, params: { ...params, key: '***' } });

      const response = await axios.get(url, { params });
      
      if (!response.data || response.data.status !== 'OK') {
        console.warn('⚠️ Google API warning:', response.data?.status, response.data?.error_message);
        
        // Return empty results for non-critical errors
        if (['ZERO_RESULTS', 'INVALID_REQUEST'].includes(response.data?.status)) {
          return res.json({
            success: true,
            data: {
              results: [],
              status: response.data.status
            },
            cached: false
          });
        }
        
        throw new Error(`Google API error: ${response.data?.status} - ${response.data?.error_message}`);
      }

      const results = response.data.results || [];
      console.log(`✅ Found ${results.length} nearby places`);

      // Cache the response
      this.cache.set(cacheKey, {
        data: {
          results,
          status: response.data.status,
          next_page_token: response.data.next_page_token
        },
        timestamp: Date.now()
      });

      return res.json({
        success: true,
        data: {
          results,
          status: response.data.status,
          next_page_token: response.data.next_page_token
        },
        cached: false
      });

    } catch (error) {
      console.error('❌ Nearby search error:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Invalid request parameters',
          details: error.errors
        });
      }

      if (axios.isAxiosError(error)) {
        console.error('API Response:', error.response?.data);
        return res.status(error.response?.status || 500).json({
          success: false,
          error: 'External API error',
          details: error.response?.data
        });
      }

      return res.status(500).json({
        success: false,
        error: 'Internal server error'
      });
    }
  }
}

export default new PlacesController();