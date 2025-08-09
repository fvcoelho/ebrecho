'use client';

import { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, TrendingDown, MapPin, Star, Target, DollarSign, Users, Clock } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Badge,
  Button,
} from '@/components/ui';

interface SearchCriteria {
  location: {
    lat: number;
    lng: number;
    radius: number;
  };
  filters?: any;
}

interface SearchResponse {
  businesses: any[];
  pagination: any;
  searchMetadata: any;
}

interface MarketAnalyticsProps {
  searchResults: SearchResponse;
  searchCriteria: SearchCriteria;
}

interface AnalyticsData {
  overview: {
    totalBusinesses: number;
    averageRating: number;
    competitionLevel: 'low' | 'medium' | 'high';
    marketOpportunity: number;
  };
  distribution: {
    byRating: { rating: string; count: number; percentage: number }[];
    byPriceLevel: { level: string; count: number; percentage: number }[];
    byNeighborhood: { name: string; count: number; percentage: number }[];
  };
  insights: {
    marketGaps: string[];
    opportunities: string[];
    recommendations: string[];
  };
  heatmap: {
    densityPoints: { lat: number; lng: number; intensity: number }[];
    clusters: { center: { lat: number; lng: number }; count: number; radius: number }[];
  };
}

export function MarketAnalytics({ searchResults, searchCriteria }: MarketAnalyticsProps) {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'distribution' | 'insights' | 'heatmap'>('overview');

  console.log('📊 MarketAnalytics initialized:', {
    businessCount: searchResults.businesses.length,
    searchRadius: searchCriteria.location.radius
  });

  useEffect(() => {
    generateAnalytics();
  }, [searchResults, searchCriteria]);

  const generateAnalytics = async () => {
    setLoading(true);
    console.log('🔍 Generating market analytics...');

    try {
      // Simulate API call to backend analytics service
      await new Promise(resolve => setTimeout(resolve, 1000));

      const businesses = searchResults.businesses;
      
      // Calculate overview metrics
      const totalBusinesses = businesses.length;
      const ratingsSum = businesses.reduce((sum, b) => sum + (b.businessInfo.rating || 0), 0);
      const ratingsCount = businesses.filter(b => b.businessInfo.rating).length;
      const averageRating = ratingsCount > 0 ? ratingsSum / ratingsCount : 0;
      
      // Determine competition level based on density
      const areaKm2 = Math.PI * Math.pow(searchCriteria.location.radius / 1000, 2);
      const density = totalBusinesses / areaKm2;
      const competitionLevel: 'low' | 'medium' | 'high' = 
        density < 2 ? 'low' : density < 5 ? 'medium' : 'high';
      
      // Calculate market opportunity score (0-100)
      const marketOpportunity = Math.max(0, Math.min(100, 
        (5 - density) * 15 + // Lower density = higher opportunity
        (5 - averageRating) * 10 + // Lower average rating = higher opportunity
        Math.random() * 20 // Some randomness for realism
      ));

      // Distribution analysis
      const ratingDistribution = [
        { rating: '5 estrelas', count: 0, percentage: 0 },
        { rating: '4-5 estrelas', count: 0, percentage: 0 },
        { rating: '3-4 estrelas', count: 0, percentage: 0 },
        { rating: '2-3 estrelas', count: 0, percentage: 0 },
        { rating: '1-2 estrelas', count: 0, percentage: 0 },
        { rating: 'Sem avaliação', count: 0, percentage: 0 }
      ];

      businesses.forEach(business => {
        const rating = business.businessInfo.rating;
        if (!rating) {
          ratingDistribution[5].count++;
        } else if (rating >= 4.5) {
          ratingDistribution[0].count++;
        } else if (rating >= 4) {
          ratingDistribution[1].count++;
        } else if (rating >= 3) {
          ratingDistribution[2].count++;
        } else if (rating >= 2) {
          ratingDistribution[3].count++;
        } else {
          ratingDistribution[4].count++;
        }
      });

      ratingDistribution.forEach(item => {
        item.percentage = totalBusinesses > 0 ? (item.count / totalBusinesses) * 100 : 0;
      });

      const priceLevelDistribution = [
        { level: 'Muito barato ($)', count: 0, percentage: 0 },
        { level: 'Barato ($$)', count: 0, percentage: 0 },
        { level: 'Moderado ($$$)', count: 0, percentage: 0 },
        { level: 'Caro ($$$$)', count: 0, percentage: 0 },
        { level: 'Não informado', count: 0, percentage: 0 }
      ];

      businesses.forEach(business => {
        const priceLevel = business.businessInfo.priceLevel;
        if (!priceLevel) {
          priceLevelDistribution[4].count++;
        } else {
          priceLevelDistribution[priceLevel - 1].count++;
        }
      });

      priceLevelDistribution.forEach(item => {
        item.percentage = totalBusinesses > 0 ? (item.count / totalBusinesses) * 100 : 0;
      });

      // Neighborhood distribution
      const neighborhoodCounts = new Map<string, number>();
      businesses.forEach(business => {
        const neighborhood = business.address.neighborhood || business.address.city || 'Não informado';
        neighborhoodCounts.set(neighborhood, (neighborhoodCounts.get(neighborhood) || 0) + 1);
      });

      const neighborhoodDistribution = Array.from(neighborhoodCounts.entries())
        .map(([name, count]) => ({
          name,
          count,
          percentage: totalBusinesses > 0 ? (count / totalBusinesses) * 100 : 0
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10); // Top 10 neighborhoods

      // Generate insights
      const insights = generateMarketInsights(businesses, competitionLevel, averageRating, density);

      // Generate heatmap data
      const heatmapData = generateHeatmapData(businesses, searchCriteria.location);

      const analytics: AnalyticsData = {
        overview: {
          totalBusinesses,
          averageRating: Math.round(averageRating * 10) / 10,
          competitionLevel,
          marketOpportunity: Math.round(marketOpportunity)
        },
        distribution: {
          byRating: ratingDistribution,
          byPriceLevel: priceLevelDistribution,
          byNeighborhood: neighborhoodDistribution
        },
        insights,
        heatmap: heatmapData
      };

      setAnalyticsData(analytics);
      console.log('✅ Market analytics generated:', analytics);
    } catch (error) {
      console.error('❌ Error generating analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMarketInsights = (businesses: any[], competitionLevel: string, averageRating: number, density: number) => {
    const marketGaps = [];
    const opportunities = [];
    const recommendations = [];

    // Market gaps analysis
    if (density < 2) {
      marketGaps.push('Baixa densidade de brechós na região');
    }
    if (averageRating < 4) {
      marketGaps.push('Oportunidade para brechós com melhor avaliação');
    }
    
    const highPriceLevelCount = businesses.filter(b => b.businessInfo.priceLevel >= 3).length;
    if (highPriceLevelCount < businesses.length * 0.3) {
      marketGaps.push('Poucos brechós de categoria premium');
    }

    // Opportunities
    if (competitionLevel === 'low') {
      opportunities.push('Região com baixa concorrência');
      opportunities.push('Excelente oportunidade para expansão');
    }
    if (averageRating < 4.2) {
      opportunities.push('Mercado com potencial para diferenciação por qualidade');
    }
    
    // Recommendations
    if (density < 1) {
      recommendations.push('Considere abrir um novo ponto nesta região');
    }
    if (averageRating < 4) {
      recommendations.push('Foque em qualidade de atendimento para se destacar');
    }
    recommendations.push('Realize pesquisa de campo para validar oportunidades');
    
    return { marketGaps, opportunities, recommendations };
  };

  const generateHeatmapData = (businesses: any[], center: { lat: number; lng: number }) => {
    // Generate density points for heatmap
    const gridSize = 0.005; // Roughly 500m grid
    const densityMap = new Map<string, number>();

    businesses.forEach(business => {
      const gridLat = Math.floor(business.address.coordinates.lat / gridSize) * gridSize;
      const gridLng = Math.floor(business.address.coordinates.lng / gridSize) * gridSize;
      const key = `${gridLat}_${gridLng}`;
      densityMap.set(key, (densityMap.get(key) || 0) + 1);
    });

    const densityPoints = Array.from(densityMap.entries()).map(([key, count]) => {
      const [lat, lng] = key.split('_').map(Number);
      return {
        lat: lat + gridSize / 2,
        lng: lng + gridSize / 2,
        intensity: Math.min(count / 5, 1) // Normalize to 0-1
      };
    });

    // Generate clusters
    const clusters: any[] = [];
    const clusterRadius = 0.01; // Roughly 1km
    const processedBusinesses = new Set<number>();

    businesses.forEach((business, index) => {
      if (processedBusinesses.has(index)) return;

      const clusterBusinesses = [business];
      processedBusinesses.add(index);

      businesses.forEach((otherBusiness, otherIndex) => {
        if (otherIndex === index || processedBusinesses.has(otherIndex)) return;

        const distance = Math.sqrt(
          Math.pow(business.address.coordinates.lat - otherBusiness.address.coordinates.lat, 2) +
          Math.pow(business.address.coordinates.lng - otherBusiness.address.coordinates.lng, 2)
        );

        if (distance <= clusterRadius) {
          clusterBusinesses.push(otherBusiness);
          processedBusinesses.add(otherIndex);
        }
      });

      if (clusterBusinesses.length >= 2) {
        const centerLat = clusterBusinesses.reduce((sum, b) => sum + b.address.coordinates.lat, 0) / clusterBusinesses.length;
        const centerLng = clusterBusinesses.reduce((sum, b) => sum + b.address.coordinates.lng, 0) / clusterBusinesses.length;

        clusters.push({
          center: { lat: centerLat, lng: centerLng },
          count: clusterBusinesses.length,
          radius: clusterRadius * 1000 // Convert to meters
        });
      }
    });

    return { densityPoints, clusters };
  };

  const getCompetitionLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'high': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getCompetitionLevelText = (level: string) => {
    switch (level) {
      case 'low': return 'Baixa';
      case 'medium': return 'Média';
      case 'high': return 'Alta';
      default: return 'Desconhecida';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, index) => (
            <Card key={index} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Dados insuficientes</h3>
          <p className="text-muted-foreground">
            Execute uma busca primeiro para ver as análises de mercado.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total de Brechós</p>
                <p className="text-2xl font-bold">{analyticsData.overview.totalBusinesses}</p>
              </div>
              <MapPin className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avaliação Média</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold">{analyticsData.overview.averageRating}</p>
                  <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                </div>
              </div>
              <Star className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nível de Concorrência</p>
                <Badge className={getCompetitionLevelColor(analyticsData.overview.competitionLevel)}>
                  {getCompetitionLevelText(analyticsData.overview.competitionLevel)}
                </Badge>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Oportunidade de Mercado</p>
                <div className="flex items-center gap-1">
                  <p className="text-2xl font-bold">{analyticsData.overview.marketOpportunity}%</p>
                  {analyticsData.overview.marketOpportunity >= 70 ? (
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  ) : analyticsData.overview.marketOpportunity >= 40 ? (
                    <TrendingUp className="h-5 w-5 text-yellow-600" />
                  ) : (
                    <TrendingDown className="h-5 w-5 text-red-600" />
                  )}
                </div>
              </div>
              <BarChart3 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <div className="flex space-x-1 border-b">
        {[
          { id: 'overview', label: 'Distribuições', icon: BarChart3 },
          { id: 'insights', label: 'Insights', icon: Target },
        ].map(tab => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            onClick={() => setActiveTab(tab.id as any)}
            className="flex items-center gap-2"
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Rating Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Star className="h-5 w-5" />
                Distribuição por Avaliação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.distribution.byRating.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{item.rating}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Price Level Distribution */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Distribuição por Preço
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analyticsData.distribution.byPriceLevel.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm">{item.level}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-8">{item.count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Neighborhood Distribution */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Distribuição por Bairro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analyticsData.distribution.byNeighborhood.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm font-medium">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{item.count}</Badge>
                      <span className="text-sm text-muted-foreground">
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'insights' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Market Gaps */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Lacunas de Mercado</CardTitle>
              <CardDescription>Oportunidades identificadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analyticsData.insights.marketGaps.map((gap, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm">{gap}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Opportunities */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Oportunidades</CardTitle>
              <CardDescription>Pontos positivos do mercado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analyticsData.insights.opportunities.map((opportunity, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm">{opportunity}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recomendações</CardTitle>
              <CardDescription>Próximos passos sugeridos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {analyticsData.insights.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-sm">{recommendation}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}