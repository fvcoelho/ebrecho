'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Search, BarChart3, Download, Settings, Filter } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import { DashboardLayout } from '@/components/dashboard';
import { useAuth } from '@/contexts/auth-context';
import { api } from '@/lib/api';

// Import the new components (to be created)
import { BrechoSearchForm } from '@/components/convites/brecho-search-form';
import { BrechoMap } from '@/components/convites/brecho-map';
import { BrechoList } from '@/components/convites/brecho-list';
import { MarketAnalytics } from '@/components/convites/market-analytics';
import { ExportDialog } from '@/components/convites/export-dialog';

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
    limit?: number;
  };
}

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

interface SearchResponse {
  businesses: BrechoBusiness[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  searchMetadata: {
    searchCenter: { lat: number; lng: number };
    radius: number;
    searchDuration: number;
  };
}

export default function ConvitesPage() {
  const router = useRouter();
  const { user } = useAuth();

  // State management
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria | null>(null);
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('search');
  const [viewMode, setViewMode] = useState<'map' | 'list' | 'split'>('split');
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [visibleBusinesses, setVisibleBusinesses] = useState<Set<string>>(new Set());

  console.log('🤝 ConvitesPage initialized:', {
    userId: user?.id,
    userRole: user?.role,
    hasSearchResults: !!searchResults
  });

  // Check if user has promoter access
  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!['PROMOTER', 'PARTNER_PROMOTER', 'ADMIN'].includes(user.role)) {
      router.push('/dashboard');
      return;
    }
  }, [user, router]);

  // Handle search form submission
  const handleSearch = async (criteria: SearchCriteria) => {
    const searchId = `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const apiStartTime = performance.now();
    
    console.log(`🎬 [HANDLER] Search initiated [${searchId}]:`, {
      timestamp: new Date().toISOString(),
      user: {
        id: user?.id,
        role: user?.role,
        name: user?.name
      },
      searchCriteria: {
        location: criteria.location,
        filtersCount: criteria.filters ? Object.keys(criteria.filters).length : 0,
        filters: criteria.filters,
        pagination: criteria.pagination
      },
      searchArea: `${(Math.PI * Math.pow((criteria.location.radius || 0) / 1000, 2)).toFixed(2)} km²`,
      currentState: {
        hasExistingResults: !!searchResults,
        currentTab: activeTab,
        loading: loading
      }
    });

    setLoading(true);
    setSearchCriteria(criteria);

    try {
      console.log(`📡 [API] Making request to backend [${searchId}]...`);
      const apiCallStart = performance.now();
      
      const response = await api.post('/promoter/market-intelligence/brechos/search', criteria);
      const apiCallDuration = performance.now() - apiCallStart;
      
      console.log(`📨 [API] Response received [${searchId}]:`, {
        status: response.status,
        duration: `${apiCallDuration.toFixed(2)}ms`,
        headers: {
          contentType: response.headers['content-type'],
          contentLength: response.headers['content-length']
        },
        dataSize: JSON.stringify(response.data).length + ' bytes'
      });

      const data = response.data;
      
      if (data.success) {
        const totalDuration = performance.now() - apiStartTime;
        
        console.log(`✅ [SUCCESS] Search completed [${searchId}]:`, {
          results: {
            totalFound: data.data.pagination.total,
            returned: data.data.businesses.length,
            pages: data.data.pagination.totalPages,
            currentPage: data.data.pagination.page
          },
          performance: {
            backendDuration: data.data.searchMetadata.searchDuration + 'ms',
            apiCallDuration: `${apiCallDuration.toFixed(2)}ms`,
            totalDuration: `${totalDuration.toFixed(2)}ms`
          },
          searchMetadata: data.data.searchMetadata,
          topBusinesses: data.data.businesses.slice(0, 3).map((b: BrechoBusiness) => ({
            name: b.name,
            rating: b.businessInfo.rating,
            distance: b.distanceFromCenter ? `${(b.distanceFromCenter / 1000).toFixed(1)}km` : 'N/A'
          }))
        });
        
        // Log each business found with key details
        data.data.businesses.forEach((business: BrechoBusiness, index: number) => {
          console.log(`  📍 Business ${index + 1}:`, {
            name: business.name,
            address: business.address.formattedAddress,
            city: business.address.city,
            rating: business.businessInfo.rating || 'No rating',
            reviews: business.businessInfo.reviewCount || 0,
            distance: business.distanceFromCenter ? `${(business.distanceFromCenter / 1000).toFixed(1)}km` : 'N/A',
            hasPhotos: business.media.photos.length > 0,
            hasWebsite: !!business.contact.website,
            phone: business.contact.phoneNumber || 'N/A'
          });
        });
        
        setSearchResults(data.data);
        // Initialize all businesses as visible on the map
        setVisibleBusinesses(new Set(data.data.businesses.map((b: BrechoBusiness) => b.id)));
        setActiveTab('results');
        
        console.log(`🎯 [UI] State updated, switching to results tab [${searchId}]`);
      } else {
        console.error(`❌ [ERROR] Backend returned failure [${searchId}]:`, {
          error: data.error,
          message: data.message,
          criteria: criteria
        });
        throw new Error(data.error || 'Search failed');
      }
    } catch (error) {
      const totalDuration = performance.now() - apiStartTime;
      
      console.error(`💥 [ERROR] Search failed [${searchId}]:`, {
        error: error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        duration: `${totalDuration.toFixed(2)}ms`,
        criteria: criteria,
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });

      // Enhanced error handling with specific error types
      let userMessage = 'Erro na busca. Tente novamente.';
      
      if (error instanceof Error) {
        if (error.message.includes('Network Error') || error.message.includes('fetch')) {
          userMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
          console.error(`🌐 [NETWORK] Connection issue detected [${searchId}]`);
        } else if (error.message.includes('timeout')) {
          userMessage = 'A busca demorou muito para responder. Tente com um raio menor.';
          console.error(`⏱️ [TIMEOUT] Request timeout detected [${searchId}]`);
        } else if (error.message.includes('401') || error.message.includes('unauthorized')) {
          userMessage = 'Sessão expirada. Faça login novamente.';
          console.error(`🔒 [AUTH] Authentication issue detected [${searchId}]`);
        } else if (error.message.includes('403') || error.message.includes('forbidden')) {
          userMessage = 'Você não tem permissão para realizar esta busca.';
          console.error(`🚫 [PERMISSION] Authorization issue detected [${searchId}]`);
        }
      }
      
      alert(userMessage);
    } finally {
      setLoading(false);
      console.log(`🏁 [HANDLER] Search handler finished [${searchId}], loading state cleared`);
    }
  };

  // Handle location selection from search form
  const handleLocationSelect = (location: { lat: number; lng: number; address: string }) => {
    console.log('📍 [LOCATION] Location selected in main handler:', {
      location: location,
      timestamp: new Date().toISOString(),
      previousState: {
        hasSearchCriteria: !!searchCriteria,
        hasSearchResults: !!searchResults,
        currentTab: activeTab
      }
    });
    
    // Pre-populate search area calculation
    const defaultRadius = 2000; // 2km default
    const searchArea = Math.PI * Math.pow(defaultRadius / 1000, 2);
    
    console.log('📐 [LOCATION] Search area calculation:', {
      defaultRadius: `${defaultRadius}m`,
      estimatedArea: `${searchArea.toFixed(2)} km²`,
      suggestedRadius: defaultRadius >= 1000 ? `${defaultRadius / 1000}km` : `${defaultRadius}m`
    });
  };

  // Handle business visibility toggle
  const handleBusinessToggle = (business: BrechoBusiness, visible: boolean) => {
    console.log('👁️ [TOGGLE] Business visibility changed:', {
      businessId: business.id,
      businessName: business.name,
      visible: visible,
      timestamp: new Date().toISOString()
    });

    setVisibleBusinesses(prev => {
      const newSet = new Set(prev);
      if (visible) {
        newSet.add(business.id);
      } else {
        newSet.delete(business.id);
      }
      
      console.log('👁️ [TOGGLE] Updated visibility set:', {
        totalBusinesses: searchResults?.businesses.length || 0,
        visibleCount: newSet.size,
        hiddenCount: (searchResults?.businesses.length || 0) - newSet.size
      });
      
      return newSet;
    });
  };

  // Handle export
  const handleExport = () => {
    if (!searchCriteria) {
      alert('Execute uma busca antes de exportar os resultados.');
      return;
    }
    setShowExportDialog(true);
  };

  // Redirect if not authenticated or not a promoter
  if (!user || !['PROMOTER', 'PARTNER_PROMOTER', 'ADMIN'].includes(user.role)) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Convidar Parceiros</h1>
            <p className="text-muted-foreground">
              Descubra e analise brechós em sua região para convidar como parceiros
            </p>
          </div>
          <div className="flex items-center gap-2">
            {searchResults && (
              <>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Exportar
                </Button>
                <Button variant="outline" onClick={() => setActiveTab('analytics')}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Analytics
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Buscar
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!searchResults} className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Resultados ({searchResults?.pagination.total || 0})
            </TabsTrigger>
            <TabsTrigger value="analytics" disabled={!searchResults} className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="saved" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Salvos
            </TabsTrigger>
          </TabsList>

          {/* Search Tab */}
          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="h-5 w-5" />
                  Buscar Brechós
                </CardTitle>
                <CardDescription>
                  Defina a localização e filtros para descobrir brechós em sua área de interesse
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BrechoSearchForm
                  onSearch={handleSearch}
                  onLocationSelect={handleLocationSelect}
                  loading={loading}
                />
              </CardContent>
            </Card>

            {/* Quick Start Guide */}
            <Card>
              <CardHeader>
                <CardTitle>Como Convidar Parceiros</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Search className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="font-medium mb-2">1. Busque</h3>
                    <p className="text-sm text-muted-foreground">
                      Defina uma localização e raio de busca para encontrar brechós na região
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <MapPin className="h-6 w-6 text-green-600" />
                    </div>
                    <h3 className="font-medium mb-2">2. Analise</h3>
                    <p className="text-sm text-muted-foreground">
                      Visualize no mapa e analise informações detalhadas de cada brechó
                    </p>
                  </div>
                  <div className="text-center p-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <BarChart3 className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="font-medium mb-2">3. Convide</h3>
                    <p className="text-sm text-muted-foreground">
                      Entre em contato e convide os brechós como parceiros
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Results Tab */}
          <TabsContent value="results" className="space-y-6">
            {searchResults && (
              <>
                {/* View Mode Toggle */}
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-medium">
                          {searchResults.pagination.total} brechós encontrados
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Raio de {searchCriteria?.location.radius || 0}m • 
                          Busca em {searchResults.searchMetadata.searchDuration}ms
                        </p>
                      </div>
                      <div className="flex border rounded-md">
                        <Button
                          variant={viewMode === 'map' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('map')}
                          className="rounded-r-none"
                        >
                          Mapa
                        </Button>
                        <Button
                          variant={viewMode === 'split' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('split')}
                          className="rounded-none"
                        >
                          Dividido
                        </Button>
                        <Button
                          variant={viewMode === 'list' ? 'default' : 'ghost'}
                          size="sm"
                          onClick={() => setViewMode('list')}
                          className="rounded-l-none"
                        >
                          Lista
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Results Content */}
                <div className={`grid gap-6 ${
                  viewMode === 'split' 
                    ? 'grid-cols-1 lg:grid-cols-2' 
                    : 'grid-cols-1'
                }`}>
                  {(viewMode === 'map' || viewMode === 'split') && (
                    <Card className="h-[600px]">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Mapa</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0 h-[calc(100%-80px)]">
                        <BrechoMap 
                          businesses={searchResults.businesses}
                          center={searchResults.searchMetadata.searchCenter}
                          radius={searchResults.searchMetadata.radius}
                          onBusinessToggle={handleBusinessToggle}
                          visibleBusinesses={visibleBusinesses}
                        />
                      </CardContent>
                    </Card>
                  )}

                  {(viewMode === 'list' || viewMode === 'split') && (
                    <Card className={viewMode === 'list' ? 'col-span-full' : ''}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Lista de Brechós</CardTitle>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <BrechoList 
                          businesses={searchResults.businesses}
                          pagination={searchResults.pagination}
                          onPageChange={(page) => {
                            if (searchCriteria) {
                              handleSearch({
                                ...searchCriteria,
                                pagination: { ...searchCriteria.pagination, page }
                              });
                            }
                          }}
                          onBusinessToggle={handleBusinessToggle}
                          visibleBusinesses={visibleBusinesses}
                        />
                      </CardContent>
                    </Card>
                  )}
                </div>
              </>
            )}
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            {searchResults && (
              <MarketAnalytics 
                searchResults={searchResults}
                searchCriteria={searchCriteria!}
              />
            )}
          </TabsContent>

          {/* Saved Views Tab */}
          <TabsContent value="saved" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Visualizações Salvas</CardTitle>
                <CardDescription>
                  Suas buscas e visualizações de mapa salvos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  <Settings className="mx-auto h-12 w-12 mb-4" />
                  <p>Nenhuma visualização salva ainda.</p>
                  <p className="text-sm">Execute buscas e salve mapas para vê-los aqui.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Export Dialog */}
        {showExportDialog && searchCriteria && (
          <ExportDialog
            searchCriteria={searchCriteria}
            open={showExportDialog}
            onOpenChange={setShowExportDialog}
          />
        )}
      </div>
    </DashboardLayout>
  );
}