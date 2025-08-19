# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

- `npm run dev` - Start development server
- `npm run build` - Build the production application
- `npm start` - Start the production server
- `npm run lint` - Run ESLint to check code quality

## Architecture Overview

This is a Next.js 15 e-commerce web application for a "brecho" (thrift store) platform with multi-tenant storefront capabilities.

### Key Architecture Components

**Frontend Framework**: Next.js 15 with React 19, TypeScript, and Tailwind CSS

**Component System**: 
- Uses shadcn/ui components (configured via `components.json`)
- All TSX files should use shadcn components when building UI
- Component aliases: `@/components` for components, `@/lib/utils` for utilities

**Authentication & State Management**:
- Context-based auth system in `src/contexts/auth-context.tsx`
- Zustand for client-side state management
- React Hook Form with Zod validation for forms
- LocalStorage for token persistence

**API Integration**:
- Axios-based API client in `src/lib/api.ts`
- Dynamic API URL resolution (server-side vs client-side)
- Automatic auth token injection and error handling
- Comprehensive logging for debugging

**Multi-tenant Architecture**:
- Dynamic routing with `[slug]` for partner storefronts
- Middleware in `src/middleware.ts` handles route resolution
- Reserved paths prevent conflicts with system routes

**Key Services**:
- `authService` - Authentication, registration, email verification
- `onboardingService` - Partner setup and status management  
- `productService` - Product CRUD, filtering, categories
- `partnerService` - Partner/store management

### Directory Structure

The application uses Next.js Route Groups for role-based access control:

- `src/app/` - Next.js App Router with route groups for role-based organization
  - `(public)/` - Public routes (no authentication required)
    - `page.tsx` - Home page
    - `login/`, `cadastro/`, `recuperar-senha/`, `verificar-email/` - Auth pages
    - `[slug]/` - Partner storefronts (public access)
  - `(partner)/` - Partner routes (PARTNER_ADMIN, PARTNER_USER)
    - `dashboard/`, `produtos/`, `vendas/`, `setup-loja/` - Partner management
  - `(promoter)/` - Promoter routes (PROMOTER, PARTNER_PROMOTER)
    - `promoter-dashboard/` - Promoter-specific dashboard
  - `(admin)/` - Admin routes (ADMIN only)
    - `admin/`, `analytics/` - System administration
  - `(dev)/` - Development/test routes (development only)
    - All `test-*` and debug routes
- `src/components/` - Reusable UI components organized by feature
- `src/contexts/` - React contexts (primarily auth)
- `src/lib/` - Utilities, API clients, and shared logic

### Multi-tenant Features

The application supports dynamic partner storefronts accessed via `/{slug}` routes. Partners can have:
- Custom slugs for their storefront URLs
- Public/private store visibility controls  
- Individual product catalogs
- Physical store address integration
- WhatsApp integration for customer contact

### Environment Configuration

Uses dual API URL configuration:
- Server-side: `API_URL` (defaults to `http://api:3001/api`)
- Client-side: `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:3001/api`)

### Development Notes

- Extensive debug logging throughout API calls and auth flow
- Form validation uses Zod schemas with React Hook Form
- Image handling includes upload, processing, and thumbnail generation
- Responsive design with mobile-first approach using Tailwind CSS

### Route Groups & Role-Based Access Control

**IMPORTANT:** The application now uses Next.js Route Groups for clean role-based access control:

1. **Route Group Layout Authentication**: Authentication is handled at the layout level for each route group, not in individual pages
2. **No Individual ProtectedRoute Wrappers**: Pages within route groups should NOT use `<ProtectedRoute>` components - authentication is handled by the layout
3. **Route Group Selection**: 
   - Use `(public)` for pages that don't require authentication
   - Use `(partner)` for partner management features (PARTNER_ADMIN, PARTNER_USER)
   - Use `(promoter)` for promoter features (PROMOTER, PARTNER_PROMOTER)  
   - Use `(admin)` for admin-only features (ADMIN)
   - Use `(dev)` for development/testing features

**Development Rules:**
- When creating new pages, always place them in the appropriate route group
- The route group layout handles authentication automatically
- URLs remain unchanged - route groups are organizational only
- Development routes in `(dev)` are automatically hidden in production