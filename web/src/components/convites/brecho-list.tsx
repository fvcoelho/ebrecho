'use client';

import { useState } from 'react';
import { Star, MapPin, Phone, Globe, Navigation, Clock, Camera, Filter, Eye, EyeOff, MessageCircle } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from '@/components/ui/pagination';

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

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface BrechoListProps {
  businesses: BrechoBusiness[];
  pagination: PaginationData;
  onPageChange: (page: number) => void;
  onBusinessSelect?: (business: BrechoBusiness) => void;
  onBusinessToggle?: (business: BrechoBusiness, visible: boolean) => void;
  visibleBusinesses?: Set<string>;
  loading?: boolean;
}

type SortOption = 'distance' | 'rating' | 'reviewCount' | 'name';
type SortDirection = 'asc' | 'desc';

export function BrechoList({ 
  businesses, 
  pagination, 
  onPageChange, 
  onBusinessSelect,
  onBusinessToggle,
  visibleBusinesses = new Set(businesses.map(b => b.id)),
  loading = false 
}: BrechoListProps) {
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedBusiness, setSelectedBusiness] = useState<string | null>(null);

  console.log('📋 BrechoList initialized:', {
    businessCount: businesses.length,
    currentPage: pagination.page,
    totalPages: pagination.totalPages,
    total: pagination.total
  });

  // Sort businesses
  const sortedBusinesses = [...businesses].sort((a, b) => {
    let aValue: any, bValue: any;
    
    switch (sortBy) {
      case 'distance':
        aValue = a.distanceFromCenter || 0;
        bValue = b.distanceFromCenter || 0;
        break;
      case 'rating':
        aValue = a.businessInfo.rating || 0;
        bValue = b.businessInfo.rating || 0;
        break;
      case 'reviewCount':
        aValue = a.businessInfo.reviewCount || 0;
        bValue = b.businessInfo.reviewCount || 0;
        break;
      case 'name':
        aValue = a.name.toLowerCase();
        bValue = b.name.toLowerCase();
        break;
      default:
        return 0;
    }
    
    if (sortDirection === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const handleBusinessClick = (business: BrechoBusiness) => {
    console.log('🏪 Business selected:', business.name);
    setSelectedBusiness(business.id);
    if (onBusinessSelect) {
      onBusinessSelect(business);
    }
  };

  const handleGetDirections = (business: BrechoBusiness) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${business.address.coordinates.lat},${business.address.coordinates.lng}`;
    window.open(url, '_blank');
  };

  const formatDistance = (distance?: number) => {
    if (!distance) return '';
    return distance < 1000 ? `${Math.round(distance)}m` : `${(distance/1000).toFixed(1)}km`;
  };

  const formatPriceLevel = (level?: number) => {
    if (!level) return '';
    return '$'.repeat(level);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-4">
              <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-muted rounded w-full mb-2"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <MapPin className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Nenhum brechó encontrado</h3>
          <p className="text-muted-foreground">
            Tente ajustar os filtros ou expandir o raio de busca.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Sort Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Ordenar por:</span>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="distance">Distância</SelectItem>
              <SelectItem value="rating">Avaliação</SelectItem>
              <SelectItem value="reviewCount">Nº Avaliações</SelectItem>
              <SelectItem value="name">Nome</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
          >
            {sortDirection === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          {pagination.total} brechós encontrados
        </div>
      </div>

      {/* Business List */}
      <div className="space-y-3">
        {sortedBusinesses.map((business, index) => {
          const isVisible = visibleBusinesses.has(business.id);
          const businessNumber = sortedBusinesses.findIndex(b => b.id === business.id) + 1;
          
          return (
            <Card 
              key={business.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedBusiness === business.id ? 'ring-2 ring-primary' : ''
              } ${!isVisible ? 'opacity-50 border-dashed' : ''}`}
              onClick={() => handleBusinessClick(business)}
            >
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  {/* Business Name and Basic Info */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {/* Business Number */}
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                        business.businessInfo.rating 
                          ? business.businessInfo.rating >= 4.5 
                            ? 'bg-green-500' 
                            : business.businessInfo.rating >= 4.0 
                              ? 'bg-yellow-500' 
                              : business.businessInfo.rating >= 3.0 
                                ? 'bg-red-500' 
                                : 'bg-gray-500'
                          : 'bg-gray-500'
                      }`}>
                        {businessNumber}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate">{business.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{business.address.formattedAddress}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Toggle Visibility Button */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onBusinessToggle) {
                          onBusinessToggle(business, !isVisible);
                        }
                      }}
                      className="flex-shrink-0"
                      title={isVisible ? 'Ocultar no mapa' : 'Mostrar no mapa'}
                    >
                      {isVisible ? (
                        <Eye className="h-4 w-4 text-green-600" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </Button>
                  </div>

                  {/* Badges and Metrics */}
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    {business.businessInfo.rating && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                        <span>{business.businessInfo.rating}</span>
                        {business.businessInfo.reviewCount && (
                          <span className="text-muted-foreground">
                            ({business.businessInfo.reviewCount})
                          </span>
                        )}
                      </Badge>
                    )}
                    
                    {business.businessInfo.priceLevel && (
                      <Badge variant="outline">
                        {formatPriceLevel(business.businessInfo.priceLevel)}
                      </Badge>
                    )}
                    
                    {business.businessInfo.isOpenNow !== undefined && (
                      <Badge 
                        variant={business.businessInfo.isOpenNow ? "default" : "secondary"}
                        className={business.businessInfo.isOpenNow ? "bg-green-500" : "bg-red-500"}
                      >
                        <Clock className="h-3 w-3 mr-1" />
                        {business.businessInfo.isOpenNow ? 'Aberto' : 'Fechado'}
                      </Badge>
                    )}
                    
                    {business.distanceFromCenter && (
                      <Badge variant="outline">
                        <Navigation className="h-3 w-3 mr-1" />
                        {formatDistance(business.distanceFromCenter)}
                      </Badge>
                    )}
                    
                    {business.media.photos.length > 0 && (
                      <Badge variant="outline">
                        <Camera className="h-3 w-3 mr-1" />
                        {business.media.photos.length} fotos
                      </Badge>
                    )}
                  </div>

                  {/* Location Details */}
                  <div className="text-sm text-muted-foreground mb-3">
                    {business.address.neighborhood && (
                      <span>{business.address.neighborhood} • </span>
                    )}
                    <span>{business.address.city}, {business.address.state}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    {business.contact.phoneNumber && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a href={`tel:${business.contact.phoneNumber}`}>
                          <Phone className="h-3 w-3 mr-1" />
                          Ligar
                        </a>
                      </Button>
                    )}
                    
                    {business.contact.phoneNumber && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                        className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
                      >
                        <a 
                          href={`https://wa.me/${business.contact.phoneNumber.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="h-3 w-3 mr-1" />
                          WhatsApp
                        </a>
                      </Button>
                    )}
                    
                    {business.contact.website && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                      >
                        <a href={business.contact.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-3 w-3 mr-1" />
                          Site
                        </a>
                      </Button>
                    )}
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGetDirections(business);
                      }}
                    >
                      <Navigation className="h-3 w-3 mr-1" />
                      Como chegar
                    </Button>
                  </div>
                </div>

                {/* Business Image */}
                {business.media.profileImage && (
                  <div className="ml-4 flex-shrink-0">
                    <img
                      src={business.media.profileImage}
                      alt={business.name}
                      className="w-20 h-20 rounded-lg object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
          );
        })}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <Pagination>
            <PaginationContent>
              {pagination.page > 1 && (
                <PaginationItem>
                  <PaginationPrevious onClick={() => onPageChange(pagination.page - 1)} />
                </PaginationItem>
              )}
              
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => onPageChange(page)}
                    isActive={page === pagination.page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              {pagination.page < pagination.totalPages && (
                <PaginationItem>
                  <PaginationNext onClick={() => onPageChange(pagination.page + 1)} />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}

      {/* Results Summary */}
      <div className="text-center text-sm text-muted-foreground">
        Mostrando {businesses.length} de {pagination.total} brechós
        {pagination.totalPages > 1 && (
          <span> • Página {pagination.page} de {pagination.totalPages}</span>
        )}
      </div>
    </div>
  );
}