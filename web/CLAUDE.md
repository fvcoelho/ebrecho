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

- `src/app/` - Next.js App Router pages and API routes
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