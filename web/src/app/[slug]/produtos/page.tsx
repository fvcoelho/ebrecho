'use client'

import { useState, useEffect, useMemo, use } from 'react'
import { notFound } from 'next/navigation'
import { getPublicStore, getPublicProducts, getStoreCategories } from '@/lib/api/public'
import { StoreHero } from '@/components/storefront/store-hero'
import { ProductGrid } from '@/components/storefront/product-grid'
import { WhatsAppButton } from '@/components/storefront/whatsapp-button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Search, Filter, X } from 'lucide-react'
import { PublicStore, PublicProduct } from '@/lib/api/public'

interface ProductsPageProps {
  params: Promise<{ slug: string }>
}

type SortOption = 'newest' | 'price_asc' | 'price_desc' | 'popular'

export default function ProductsPage({ params }: ProductsPageProps) {
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
        const [storeData, categoriesData] = await Promise.all([
          getPublicStore(slug),
          getStoreCategories(slug)
        ])
        setStore(storeData)
        setCategories(categoriesData)
        setError(false)
      } catch (err) {
        console.error('Error loading store:', err)
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
        const data = await getPublicProducts(slug, {
          page: currentPage,
          limit: 20,
          sort: sortBy,
          category: selectedCategory !== 'all' ? selectedCategory : undefined,
          search: searchTerm || undefined
        })
        
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
      <div className="min-h-screen">
        <Skeleton className="h-64 w-full mb-8" />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-full sm:w-[200px]" />
                <Skeleton className="h-10 w-full sm:w-[200px]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={`loading-skeleton-${i}`} className="h-64 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (error || !store) {
    notFound()
  }

  return (
    <>
      <StoreHero store={store} />
      
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-3xl">Todos os Produtos</CardTitle>
            <CardDescription>
              {totalProducts} produto{totalProducts !== 1 ? 's' : ''} encontrado{totalProducts !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Filters and search */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar produtos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>

                {/* Category filter */}
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {/* {categories.map((cat) => (
                      <SelectItem key={cat.category} value={cat.category}>
                        {cat.category} ({cat.count})
                      </SelectItem>
                    ))} */}
                  </SelectContent>
                </Select>

                {/* Sort */}
                <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Mais recentes</SelectItem>
                    <SelectItem value="price_asc">Menor preço</SelectItem>
                    <SelectItem value="price_desc">Maior preço</SelectItem>
                    <SelectItem value="popular">Mais populares</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Active filters */}
              {(searchTerm || selectedCategory !== 'all') && (
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => setSearchTerm('')}
                    >
                      Busca: {searchTerm}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  )}
                  {selectedCategory !== 'all' && (
                    <Badge
                      variant="secondary"
                      className="cursor-pointer hover:bg-secondary/80"
                      onClick={() => setSelectedCategory('all')}
                    >
                      {selectedCategory}
                      <X className="h-3 w-3 ml-1" />
                    </Badge>
                  )}
                </div>
              )}
            </div>

            {/* Products grid */}
            {productsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <Skeleton key={`products-skeleton-${i}`} className="h-64 w-full" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="space-y-8">
                <ProductGrid products={products} storeSlug={slug} store={store} />
                
                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        >
                          Anterior
                        </PaginationPrevious>
                      </PaginationItem>
                      
                      {/* Page numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return (
                          <PaginationItem key={`page-${pageNum}`}>
                            <PaginationLink
                              onClick={() => setCurrentPage(pageNum)}
                              isActive={currentPage === pageNum}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      })}
                      
                      <PaginationItem>
                        <PaginationNext
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        >
                          Próxima
                        </PaginationNext>
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Nenhum produto encontrado.</p>
                {(searchTerm || selectedCategory !== 'all') && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                    }}
                    className="mt-4"
                  >
                    Limpar filtros
                  </Button>
                )}
              </div>
            )}
            
          </CardContent>
        </Card>
      </div>

      {store.whatsappNumber && (
        <WhatsAppButton phoneNumber={store.whatsappNumber} />
      )}
    </>
  )
}