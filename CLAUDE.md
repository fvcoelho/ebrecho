# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

eBrecho is a multi-tenant second-hand fashion marketplace with:
- **API**: Express.js/TypeScript backend with Prisma ORM and PostgreSQL
- **Web**: Next.js 15/React 19 frontend with TypeScript and Tailwind CSS
- **Architecture**: Serverless-first design supporting AWS Lambda and Vercel deployments

## Common Development Commands

### API Development
```bash
cd api
npm install                  # Install dependencies
npm run dev                  # Start development server (hot reload)
npm run prisma:generate      # Generate Prisma client after schema changes
npm run prisma:migrate       # Create development migrations
npm run prisma:studio        # Open database GUI
npm run build:vercel         # Build for Vercel deployment
npm run deploy:vercel        # Deploy to Vercel
```

### Web Development
```bash
cd web
npm install                  # Install dependencies
npm run dev                  # Start Next.js dev server (port 3000)
npm run build               # Production build
npm run lint                # Run ESLint
```

### Testing
```bash
# API tests (custom Node.js scripts)
cd api/tests
node auth.test.js           # Test authentication
node product.test.js        # Test product endpoints
node all-tests.js          # Run all tests
```

## High-Level Architecture

### Backend Structure
The API follows a layered architecture with serverless-first design:

1. **Entry Points**: 
   - `/src/server.ts` - Local development server
   - `/src/lambda.ts` - AWS Lambda handler
   - `/api/index.ts` - Vercel serverless function

2. **Request Flow**:
   ```
   Routes → Auth Middleware → Role Middleware → Validation → Controller → Service → Prisma → Database
   ```

3. **Authentication**: JWT-based with hierarchical roles:
   - ADMIN > PARTNER_ADMIN > PARTNER_USER > PROMOTER/PARTNER_PROMOTER > CUSTOMER
   - Tokens contain: userId, email, role, partnerId
   - Protected routes use `authMiddleware` and role-specific middleware

4. **Multi-tenancy**: 
   - All data scoped by `partnerId`
   - Partners have public storefronts at `/{slug}`
   - Admin endpoints for cross-partner operations

### Frontend Structure
The web app uses Next.js App Router with multi-tenant routing:

1. **Routing Pattern**:
   - `/[slug]/*` - Partner storefronts (public)
   - `/dashboard/*` - Partner admin area (authenticated)
   - `/admin/*` - System admin area
   - `/produtos/*` - Product management

2. **State Management**:
   - `AuthContext` - Global auth state with localStorage persistence
   - `zustand` stores - Feature-specific state management
   - React Query patterns for server state

3. **API Communication**:
   - Centralized API client (`/src/lib/api.ts`)
   - Service layer for each domain (`authService`, `productService`, etc.)
   - Automatic token injection in headers

4. **Component Architecture**:
   - All TSX files must use shadcn/ui components
   - Feature-based organization under `/src/components`
   - Shared UI primitives in `/src/components/ui`

### Database Schema
Prisma-managed PostgreSQL with key entities:
- **Users**: Multi-role accounts with email verification
- **Partners**: Store owners with customizable storefronts
- **Products**: Full e-commerce catalog with AI image enhancement
- **Orders**: Complete order lifecycle management
- **Promoters**: MLM-style invitation and commission system

### Deployment Architecture
- **Development**: Local Express server + Next.js dev server
- **Production Options**:
  - Vercel: Serverless functions + Next.js hosting
  - AWS: Lambda functions + S3/CloudFront
- **Database**: Neon PostgreSQL with connection pooling

## Key Implementation Details

### API Considerations
- Database connections use pooling for serverless (`?pgbouncer=true`)
- File uploads stored locally in dev, S3/cloud storage in production
- Swagger documentation auto-generated at `/api-docs`
- Custom test scripts in `/api/tests/` directory

### Frontend Considerations
- Server/client API URL configuration via environment variables
- Protected routes use `ProtectedRoute` and `OnboardingGuard` components
- Partner slug validation in middleware to prevent route conflicts
- Mobile-first responsive design with Tailwind breakpoints

### Security Notes
- JWT secrets must be configured in production
- CORS origins explicitly allowlisted
- Password validation needs strengthening (per test results)
- Input sanitization and rate limiting should be added

## Environment Variables

### API (.env)
```
DATABASE_URL="postgresql://...?pgbouncer=true"
DIRECT_URL="postgresql://..."
JWT_SECRET="your-secret-key"
FRONTEND_URL="http://localhost:3000"
```

### Web (.env.local)
```
NEXT_PUBLIC_API_URL="http://localhost:3001"
API_URL="http://localhost:3001"
```

## Important Patterns

1. **Error Handling**: Global error middleware returns consistent JSON responses
2. **Validation**: Zod schemas validate all API requests
3. **File Processing**: Sharp library handles image optimization
4. **Email**: Nodemailer with HTML/text templates for verification
5. **Testing**: Custom Node.js scripts with direct HTTP requests

## Development Workflow

1. Schema changes: Edit `/api/prisma/schema.prisma` → run migrations → generate client
2. API changes: Implement in controller → add validation schema → update routes → test
3. Frontend changes: Create/modify components → update API service → handle loading/error states
4. Testing: Run specific test files or use `all-tests.js` for comprehensive testing