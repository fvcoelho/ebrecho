import { Skeleton } from '@/components/ui/skeleton'

export default function StoreLoading() {
  return (
    <div className="min-h-screen">
      {/* Hero skeleton */}
      <div className="relative h-64 md:h-80 lg:h-96">
        <Skeleton className="h-full w-full" />
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main content skeleton */}
          <div className="lg:col-span-3">
            <Skeleton className="h-8 w-48 mb-6" />
            
            {/* Product grid skeleton */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="h-48 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-6 w-1/4" />
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar skeleton */}
          <aside className="lg:col-span-1">
            <Skeleton className="h-64 w-full" />
          </aside>
        </div>
      </div>
    </div>
  )
}