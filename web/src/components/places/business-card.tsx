'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Star, Users, Camera, Send, CheckCircle } from 'lucide-react';
import { SpinningLogo } from '@/components/ui/spinning-logo';
import type { PlaceResult } from './places-autocomplete';

interface BusinessCardProps {
  business: PlaceResult;
  onInvite?: (business: PlaceResult) => void;
  isInviting?: boolean;
  isInvited?: boolean;
  className?: string;
}

export function BusinessCard({
  business,
  onInvite,
  isInviting = false,
  isInvited = false,
  className = ''
}: BusinessCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleInvite = () => {
    if (onInvite && !isInviting && !isInvited) {
      onInvite(business);
    }
  };

  const formatBusinessTypes = (types: string[]) => {
    const relevantTypes = types.filter(type => 
      !['establishment', 'point_of_interest'].includes(type)
    ).slice(0, 3);
    
    return relevantTypes.map(type => 
      type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    );
  };

  const getBusinessPhoto = (business: PlaceResult) => {
    if (business.photos && business.photos.length > 0) {
      return business.photos[0].photo_reference;
    }
    return null;
  };

  const businessTypes = formatBusinessTypes(business.types);
  const photoUrl = getBusinessPhoto(business);

  return (
    <Card className={`transition-all duration-200 hover:shadow-md ${className}`}>
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg leading-tight truncate mb-1">
              {business.name}
            </h3>
            <div className="flex items-center text-sm text-muted-foreground mb-2">
              <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
              <span className="truncate">{business.vicinity || business.formatted_address}</span>
            </div>
          </div>
          
          {photoUrl && (
            <div className="ml-3 flex-shrink-0">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                <img 
                  src={photoUrl} 
                  alt={business.name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </div>
            </div>
          )}
        </div>

        {/* Rating and Reviews */}
        {(business.rating || business.user_ratings_total) && (
          <div className="flex items-center gap-3 mb-3">
            {business.rating && (
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                <span className="text-sm font-medium">{business.rating.toFixed(1)}</span>
              </div>
            )}
            {business.user_ratings_total && (
              <div className="flex items-center text-muted-foreground">
                <Users className="h-3 w-3 mr-1" />
                <span className="text-xs">{business.user_ratings_total} avaliações</span>
              </div>
            )}
          </div>
        )}

        {/* Business Types */}
        {businessTypes.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {businessTypes.map((type, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {type}
              </Badge>
            ))}
          </div>
        )}

        {/* Expandable Address */}
        {business.formatted_address !== business.vicinity && (
          <div className="text-xs text-muted-foreground">
            {isExpanded ? (
              <div>
                <p className="mb-2">{business.formatted_address}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsExpanded(false)}
                  className="h-auto p-0 text-xs"
                >
                  Ver menos
                </Button>
              </div>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(true)}
                className="h-auto p-0 text-xs"
              >
                Ver endereço completo
              </Button>
            )}
          </div>
        )}
      </CardContent>

      <Separator />
      
      <CardFooter className="p-4 pt-3">
        <div className="w-full">
          {isInvited ? (
            <div className="flex items-center justify-center text-sm text-green-600">
              <CheckCircle className="h-4 w-4 mr-2" />
              Convite enviado
            </div>
          ) : (
            <Button 
              onClick={handleInvite}
              disabled={isInviting}
              className="w-full"
              size="sm"
            >
              {isInviting ? (
                <>
                  <SpinningLogo size="sm" speed="fast" className="mr-2" />
                  Enviando convite...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Enviar convite
                </>
              )}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}