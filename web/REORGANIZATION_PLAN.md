# Directory Reorganization Plan for Role-Based Access Control

## Overview
This document outlines the plan to reorganize the `/web/src/app/` directory structure using Next.js Route Groups to implement clean role-based access control.

## Current Issues
- Mixed access levels in the same directories
- Role checking logic scattered across components
- Difficult to maintain and scale role-based features
- No clear separation between public, partner, admin, and promoter areas

## Proposed Solution: Next.js Route Groups

Route Groups (folders with parentheses) allow logical organization without affecting URLs:
- `(public)/login` → URL remains `/login`
- `(partner)/dashboard` → URL remains `/dashboard`
- `(admin)/admin` → URL remains `/admin`

## New Directory Structure

```
/web/src/app/
├── (public)/                    # Public routes (no auth required)
│   ├── layout.tsx               # Public layout
│   ├── page.tsx                 # Home page
│   ├── login/
│   │   └── page.tsx
│   ├── cadastro/
│   │   └── page.tsx
│   ├── recuperar-senha/
│   │   └── page.tsx
│   ├── verificar-email/
│   │   └── page.tsx
│   └── [slug]/                  # Public storefronts
│       ├── page.tsx
│       ├── layout.tsx
│       ├── loading.tsx
│       ├── not-found.tsx
│       └── produto/
│           └── [productSlug]/
│               └── page.tsx
│
├── (partner)/                   # Partner routes (PARTNER_ADMIN, PARTNER_USER)
│   ├── layout.tsx               # Partner layout with auth check
│   ├── dashboard/
│   │   ├── page.tsx
│   │   ├── configuracoes/
│   │   │   └── page.tsx
│   │   ├── analytics/
│   │   │   └── page.tsx
│   │   └── convites/
│   │       └── page.tsx
│   ├── produtos/
│   │   ├── page.tsx
│   │   ├── novo/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       └── editar/
│   │           └── page.tsx
│   ├── vendas/
│   │   └── page.tsx
│   └── setup-loja/
│       └── page.tsx
│
├── (promoter)/                  # Promoter routes (PROMOTER, PARTNER_PROMOTER)
│   ├── layout.tsx               # Promoter layout with auth check
│   └── promoter-dashboard/
│       └── page.tsx
│
├── (admin)/                     # Admin routes (ADMIN only)
│   ├── layout.tsx               # Admin layout with auth check
│   ├── admin/
│   │   └── page.tsx
│   └── analytics/
│       ├── page.tsx
│       ├── session/
│       │   └── [id]/
│       │       └── page.tsx
│       └── sessions/
│           └── page.tsx
│
├── (dev)/                       # Development/test routes
│   ├── layout.tsx
│   ├── test/
│   │   └── page.tsx
│   ├── test-api/
│   │   └── page.tsx
│   ├── test-blob-upload/
│   │   └── page.tsx
│   ├── test-dashboard/
│   │   └── page.tsx
│   ├── test-simple-upload/
│   │   └── page.tsx
│   ├── test-tryon/
│   │   └── page.tsx
│   ├── test-upload/
│   │   └── page.tsx
│   ├── api-test/
│   │   └── page.tsx
│   └── debug-auth/
│       └── page.tsx
│
├── api/                         # API routes (unchanged)
├── health/                      # Health check (unchanged)
│   └── route.ts
├── layout.tsx                   # Root layout
└── globals.css                  # Global styles
```

## Implementation Steps

### Step 1: Create Route Group Directories
Create the following directories:
- `(public)/`
- `(partner)/`
- `(promoter)/`
- `(admin)/`
- `(dev)/`

### Step 2: Create Layout Files

#### (public)/layout.tsx
```tsx
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
```

#### (partner)/layout.tsx
```tsx
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function PartnerLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['PARTNER_ADMIN', 'PARTNER_USER']}>
      {children}
    </ProtectedRoute>
  );
}
```

#### (promoter)/layout.tsx
```tsx
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function PromoterLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['PROMOTER', 'PARTNER_PROMOTER']}>
      {children}
    </ProtectedRoute>
  );
}
```

#### (admin)/layout.tsx
```tsx
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      {children}
    </ProtectedRoute>
  );
}
```

#### (dev)/layout.tsx
```tsx
export default function DevLayout({ children }: { children: React.ReactNode }) {
  if (process.env.NODE_ENV !== 'development') {
    return <div>Not available in production</div>;
  }
  return <>{children}</>;
}
```

### Step 3: Move Files to Appropriate Groups

#### Public Routes (no authentication)
- Move `login/` → `(public)/login/`
- Move `cadastro/` → `(public)/cadastro/`
- Move `recuperar-senha/` → `(public)/recuperar-senha/`
- Move `verificar-email/` → `(public)/verificar-email/`
- Move `[slug]/` → `(public)/[slug]/`
- Move root `page.tsx` → `(public)/page.tsx`

#### Partner Routes (PARTNER_ADMIN, PARTNER_USER)
- Move `dashboard/` → `(partner)/dashboard/`
- Move `produtos/` → `(partner)/produtos/`
- Move `vendas/` → `(partner)/vendas/`
- Move `setup-loja/` → `(partner)/setup-loja/`

#### Promoter Routes (PROMOTER, PARTNER_PROMOTER)
- Create new `(promoter)/promoter-dashboard/page.tsx`
- Extract PromoterDashboard component from current dashboard

#### Admin Routes (ADMIN only)
- Move `admin/` → `(admin)/admin/`
- Move `analytics/` → `(admin)/analytics/`

#### Development Routes
- Move all `test-*/` directories → `(dev)/`
- Move `api-test/` → `(dev)/api-test/`
- Move `debug-auth/` → `(dev)/debug-auth/`

### Step 4: Update Dashboard Components

Split the current dashboard into role-specific dashboards:

#### (partner)/dashboard/page.tsx
```tsx
'use client';
import { StoreOwnerDashboard } from '@/components/dashboard/store-owner-dashboard';

export default function DashboardPage() {
  return <StoreOwnerDashboard />;
}
```

#### (promoter)/promoter-dashboard/page.tsx
```tsx
'use client';
import { PromoterDashboard } from '@/components/dashboard/promoter-dashboard';

export default function PromoterDashboardPage() {
  return <PromoterDashboard />;
}
```

### Step 5: Update Middleware

Update `/web/src/middleware.ts` to include new route group awareness:

```typescript
const RESERVED_PATHS = [
  'admin',
  'api', 
  'login',
  'cadastro',
  'dashboard',
  'produtos',
  'vendas',
  'promoter-dashboard',
  'setup-loja',
  'verificar-email',
  'recuperar-senha',
  'test-api',
  'test',
  '_next',
  'favicon.ico'
]
```

### Step 6: Update Import Paths

After moving files, update all import statements that reference moved components.

### Step 7: Remove Redundant Role Checks

Remove `ProtectedRoute` wrappers from individual page components since authentication is now handled at the layout level.

## Benefits

### 1. Clear Separation of Concerns
- Each role has dedicated space
- No mixing of access levels
- Easy to understand who can access what

### 2. Simplified Components
- Remove role-checking logic from pages
- Components focus on their core functionality
- Cleaner, more maintainable code

### 3. Better Security
- Centralized authentication at layout level
- Consistent access control
- Easier to audit permissions

### 4. Improved Developer Experience
- Clear file organization
- Easy to find role-specific features
- Better TypeScript support with role contexts

### 5. Scalability
- Easy to add new roles
- Simple to add role-specific features
- Clean separation for future growth

## Migration Strategy

### Phase 1: Setup Structure (Day 1)
1. Create route group directories
2. Create layout files with auth checks
3. Test with one simple route

### Phase 2: Move Public Routes (Day 2)
1. Move all public pages to `(public)/`
2. Test public access
3. Verify no authentication issues

### Phase 3: Move Partner Routes (Day 3)
1. Move partner pages to `(partner)/`
2. Split dashboard component
3. Test partner access

### Phase 4: Move Admin & Promoter Routes (Day 4)
1. Move admin pages to `(admin)/`
2. Create promoter dashboard in `(promoter)/`
3. Test role-specific access

### Phase 5: Cleanup (Day 5)
1. Move dev/test routes to `(dev)/`
2. Remove redundant role checks
3. Update documentation

## Testing Checklist

- [ ] All URLs remain unchanged
- [ ] Public pages accessible without login
- [ ] Partner pages require partner authentication
- [ ] Admin pages require admin authentication
- [ ] Promoter dashboard accessible to promoters
- [ ] Navigation between sections works correctly
- [ ] No authentication loops
- [ ] Proper redirects for unauthorized access
- [ ] Development routes only work in dev environment

## Rollback Plan

If issues arise:
1. Keep backup of current structure
2. Route groups can be removed by simply removing parentheses
3. Move files back to original locations
4. Re-add role checks to individual pages

## Success Metrics

- Reduced code complexity (fewer role checks)
- Improved load times (optimized layouts)
- Better developer feedback (clearer structure)
- Fewer authentication-related bugs
- Easier onboarding for new developers

## Notes

- Route groups don't affect URLs - only organization
- Each group can have its own layout, loading, and error states
- Nested route groups are possible for sub-role organization
- Static files and API routes remain unchanged