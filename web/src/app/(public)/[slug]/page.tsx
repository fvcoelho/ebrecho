'use client'

import { useState, useEffect, use } from 'react'
import { notFound } from 'next/navigation'
import { getPublicStore, getPublicProducts, getStoreCategories, registerStoreView } from '@/lib/api/public'
import { ProductGrid } from '@/components/storefront/product-grid'
import { StoreHero } from '@/components/storefront/store-hero'
import { StoreInfo } from '@/components/storefront/store-info'
import { StoreMap } from '@/components/storefront/store-map'
import WhatsAppButton from '@/components/storefront/whatsapp-button'
import { Footer } from '@/components/layout/footer'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Search, X, Package } from 'lucide-react'
import { PublicStore, PublicProduct } from '@/lib/api/public'

interface StorePageProps {
  params: Promise<{ slug: string }>
}

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'popular'

export default function StorePage({ params }: StorePageProps) {
  const { slug } = use(params)
  const [store, setStore] = useState<PublicStore | null>(null)
  const [products, setProducts] = useState<PublicProduct[]>([])
  const [categories, setCategories] = useState<Array<{ category: string; count: number }>>([])  
  const [loading, setLoading] = useState(true)
  const [productsLoading, setProductsLoading] = useState(false)
  const [error, setError] = useState(false)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<SortOption>('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalProducts, setTotalProducts] = useState(0)

  // Load store data
  useEffect(() => {
    async function loadStore() {
      try {
        console.log('[DEBUG] StorePage - Processing slug:', slug)
        console.log('[DEBUG] StorePage - About to fetch store data')
        
        const [storeData, categoriesData] = await Promise.all([
          getPublicStore(slug),
          getStoreCategories(slug)
        ])
        
        console.log('[DEBUG] StorePage - Store data fetched successfully:', storeData.name)
        console.log('[DEBUG] StorePage - Store description:', storeData.description)
        console.log('[DEBUG] StorePage - Categories data:', categoriesData)
        setStore(storeData)
        setCategories(categoriesData || [])
        setError(false)
        
        // Register store view for analytics
        registerStoreView(slug).catch(console.error)
      } catch (err) {
        console.error('[DEBUG] StorePage - Error loading store:', err)
        console.error('[DEBUG] StorePage - Error details:', {
          message: err instanceof Error ? err.message : 'Unknown error',
          status: (err as any)?.response?.status,
          data: (err as any)?.response?.data
        })
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    
    loadStore()
  }, [slug])

  // Load products with filters
  useEffect(() => {
    if (!store) return
    
    async function loadProducts() {
      setProductsLoading(true)
      try {
        console.log('[DEBUG] StorePage - About to fetch products')
        const data = await getPublicProducts(slug, {
          page: currentPage,
          limit: 20,
          sort: sortBy,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          search: searchTerm || undefined
        })
        
        console.log('[DEBUG] StorePage - Products fetched:', data.products.length)
        setProducts(data.products)
        setTotalPages(data.pagination.totalPages)
        setTotalProducts(data.pagination.total)
      } catch (err) {
        console.error('Error loading products:', err)
      } finally {
        setProductsLoading(false)
      }
    }
    
    loadProducts()
  }, [slug, store, currentPage, sortBy, selectedCategory, searchTerm])

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [sortBy, selectedCategory, searchTerm])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <Skeleton className="h-72 w-full" />
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-9">
              <Skeleton className="h-32 w-full mb-6" />
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <Skeleton key={`loading-skeleton-${i}`} className="aspect-square" />
                ))}
              </div>
            </div>
            <aside className="lg:col-span-3">
              <Skeleton className="h-64 w-full mb-4" />
              <Skeleton className="h-48 w-full" />
            </aside>
          </div>
        </div>
      </div>
    )
  }

  if (error || !store) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <StoreHero store={store} />
      
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 lg:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Main content */}
          <main className="lg:col-span-9 space-y-6">
            {/* Minimalist Search and Filters Header */}
            <div className="bg-background/95 backdrop-blur sticky top-0 z-10 border-b">
              <div className="px-3 sm:px-4 py-3">
                {/* Header Row */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-1.5">
                    <Package className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">
                      {totalProducts} {totalProducts === 1 ? 'Produto' : 'Produtos'}
                    </span>
                  </div>
                  
                  {/* Sort Dropdown */}
                  <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                    <SelectTrigger className="w-[130px] sm:w-[160px] h-8 text-sm">
                      <SelectValue placeholder="Ordenar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Mais recentes</SelectItem>
                      <SelectItem value="price_asc">Menor preço</SelectItem>
                      <SelectItem value="price_desc">Maior preço</SelectItem>
                      <SelectItem value="popular">Mais populares</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Search and Filter Bar */}
                <div className="flex gap-2">
                  {/* Search Input */}
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      type="search"
                      placeholder="Buscar produtos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 h-8 text-sm"
                    />
                  </div>
                  
                  {/* Category Filter */}
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-[140px] sm:w-[180px] h-8 text-sm">
                      <SelectValue placeholder="Todas as categorias" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((cat, index) => {
                        const categoryName = cat.category || cat.name || `Category ${index + 1}`
                        const categoryCount = cat.count || 0
                        return (
                          <SelectItem key={categoryName} value={categoryName}>
                            {categoryName} ({categoryCount})
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                
                {/* Active filters */}
                {(searchTerm || selectedCategory !== 'all') && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {searchTerm && (
                      <Badge
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80 h-6 text-xs px-2"
                        onClick={() => setSearchTerm('')}
                      >
                        {searchTerm}
                        <X className="h-2.5 w-2.5 ml-1" />
                      </Badge>
                    )}
                    {selectedCategory !== 'all' && (
                      <Badge
                        variant="secondary"
                        className="cursor-pointer hover:bg-secondary/80 h-6 text-xs px-2"
                        onClick={() => setSelectedCategory('all')}
                      >
                        {selectedCategory}
                        <X className="h-2.5 w-2.5 ml-1" />
                      </Badge>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Products Section */}
            {productsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[...Array(12)].map((_, i) => (
                  <Skeleton key={`products-skeleton-${i}`} className="aspect-square" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <>
                <ProductGrid products={products} storeSlug={slug} store={store} />
                    
                {/* Pagination */}
                {totalPages > 1 && (
                  <Card className="border-0 shadow-sm">
                    <CardContent className="py-4">
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                              className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                          
                          {/* Smart pagination with ellipsis */}
                          {(() => {
                            const pages = [];
                            const showEllipsisStart = currentPage > 3;
                            const showEllipsisEnd = currentPage < totalPages - 2;
                            
                            // Always show first page
                            pages.push(
                              <PaginationItem key="page-1">
                                <PaginationLink
                                  onClick={() => setCurrentPage(1)}
                                  isActive={currentPage === 1}
                                  className="cursor-pointer"
                                >
                                  1
                                </PaginationLink>
                              </PaginationItem>
                            );
                            
                            // Show ellipsis if needed
                            if (showEllipsisStart) {
                              pages.push(
                                <PaginationItem key="ellipsis-start">
                                  <span className="px-2">...</span>
                                </PaginationItem>
                              );
                            }
                            
                            // Show current page and neighbors
                            for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
                              pages.push(
                                <PaginationItem key={`page-${i}`}>
                                  <PaginationLink
                                    onClick={() => setCurrentPage(i)}
                                    isActive={currentPage === i}
                                    className="cursor-pointer"
                                  >
                                    {i}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            }
                            
                            // Show ellipsis if needed
                            if (showEllipsisEnd) {
                              pages.push(
                                <PaginationItem key="ellipsis-end">
                                  <span className="px-2">...</span>
                                </PaginationItem>
                              );
                            }
                            
                            // Always show last page if more than 1 page
                            if (totalPages > 1) {
                              pages.push(
                                <PaginationItem key={`page-${totalPages}`}>
                                  <PaginationLink
                                    onClick={() => setCurrentPage(totalPages)}
                                    isActive={currentPage === totalPages}
                                    className="cursor-pointer"
                                  >
                                    {totalPages}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            }
                            
                            return pages;
                          })()}
                          
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                              className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card className="border-0 shadow-sm">
                <CardContent className="py-16 text-center">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-lg font-medium mb-2">Nenhum produto encontrado</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    {searchTerm || selectedCategory !== 'all' 
                      ? 'Tente ajustar seus filtros de busca' 
                      : 'Esta loja ainda não possui produtos disponíveis'}
                  </p>
                  {(searchTerm || selectedCategory !== 'all') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setSelectedCategory('all');
                      }}
                    >
                      Limpar filtros
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </main>

          {/* Sidebar */}
          <aside className="lg:col-span-3">
            <div className="sticky top-6 space-y-4">
              <StoreInfo store={store} />
              {store.address && <StoreMap store={store} />}
            </div>
          </aside>
        </div>
      </div>

      {store.whatsappNumber && (
        <WhatsAppButton 
          phoneNumber={store.whatsappNumber}
          whatsappName={store.whatsappName}
          storeName={store.name}
        />
      )}
      
      <Footer />
    </div>
  )
}