# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Commands

```bash
npm run dev         # Start Next.js development server (port 3000)
npm run build       # Build production application
npm start           # Start production server
npm run lint        # Run ESLint
npx playwright test # Run Playwright E2E tests
```

## Architecture Overview

Next.js 15 multi-tenant e-commerce platform for second-hand fashion ("brecho") with role-based access control and dynamic storefronts.

### Tech Stack
- **Framework**: Next.js 15 (App Router) with React 19
- **Language**: TypeScript with strict mode
- **Styling**: Tailwind CSS with shadcn/ui components
- **State**: Zustand stores + React Context (auth)
- **Forms**: React Hook Form + Zod validation
- **API Client**: Axios with interceptors
- **Testing**: Playwright for E2E tests

### Project Structure

```
web/src/app/
├── (public)/         # No authentication required
│   ├── login/, cadastro/, recuperar-senha/, verificar-email/
│   └── [slug]/       # Dynamic partner storefronts
├── (partner)/        # PARTNER_ADMIN, PARTNER_USER roles
│   ├── dashboard/, produtos/, vendas/, setup-loja/
├── (promoter)/       # PROMOTER, PARTNER_PROMOTER roles
│   └── promoter-dashboard/
├── (admin)/          # ADMIN role only
│   └── admin/, analytics/
└── (dev)/            # Development-only routes (hidden in production)
```

### Key Architectural Patterns

1. **Route Groups**: Authentication handled at layout level, not individual pages
2. **Multi-tenancy**: Dynamic storefronts via `[slug]` routes with middleware validation
3. **API Communication**: Dual URL configuration (server/client) with automatic token injection
4. **Component Requirements**: ALL TSX files must use shadcn/ui components
5. **Environment Config**:
   - Client: `NEXT_PUBLIC_API_URL` (default: `http://localhost:3001/api`)
   - Server: `API_URL` (default: `http://localhost:3001/api`)

### Development Rules

- **ALWAYS use shadcn/ui components** in TSX files
- Place new pages in appropriate route group - authentication handled automatically
- No `<ProtectedRoute>` wrappers in pages within route groups
- Component organization: Feature-based under `/src/components/`
- Path aliases: `@/components`, `@/lib/utils`

### Testing

```bash
# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/admin-login.spec.js

# Run tests with UI mode
npx playwright test --ui

# Generate test report
npx playwright show-report
```

Tests located in `tests/e2e/` directory with Playwright configuration in `playwright.config.js`.

### API Integration

The application uses a centralized API client (`src/lib/api.ts`) with:
- Automatic auth token injection from localStorage
- Request/response interceptors with comprehensive logging
- 401 handling with redirect to login
- Dynamic base URL resolution based on environment

### Key Services

- `authService`: Login, registration, profile management
- `onboardingService`: Partner setup and status tracking
- `productService`: Product CRUD operations
- `partnerService`: Store management
- `analyticsService`: Usage tracking and metrics

### Important Files

- `src/middleware.ts`: Route validation and reserved path management
- `src/contexts/auth-context.tsx`: Global authentication state
- `src/lib/api-config.ts`: API URL configuration logic
- `next.config.ts`: Next.js configuration with rewrites and image domains