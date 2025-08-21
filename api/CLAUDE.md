# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

eBrecho API is a **serverless Express.js API** built with TypeScript, designed for deployment on AWS Lambda, Vercel, or other serverless platforms. It serves as the backend for a second-hand fashion marketplace connecting partners (store owners), promoters, and customers.

## Architecture

### Serverless Configuration
- **Express App**: Separated into `src/app.ts` for reusability
- **Local Development**: `src/server.ts` runs traditional Express server
- **AWS Lambda**: `src/lambda.ts` exports serverless-http handler
- **Vercel**: `api/index.ts` provides Vercel-specific handler
- **Database**: PostgreSQL with Prisma ORM (connection pooling for serverless)

### Key Design Patterns
- **Middleware Stack**: Authentication → Authorization → Validation → Business Logic
- **Role-Based Access**: Six user roles with hierarchical permissions (ADMIN > PARTNER_ADMIN > PARTNER_USER > PROMOTER/PARTNER_PROMOTER > CUSTOMER)
- **Zod Validation**: Request validation using schema middleware (all schemas in `src/schemas/`)
- **Centralized Error Handling**: Global error middleware for consistent responses
- **Multi-tenancy**: Partner-based data isolation using `partnerId`
- **File Processing**: Sharp for image optimization, Multer for uploads

## Essential Commands

### Development
```bash
npm run dev                  # Local development with hot reload
npm run build               # Standard TypeScript build
npm run build:serverless    # Build for AWS Lambda (includes Prisma binaries)
npm run build:vercel        # Build for Vercel deployment
npm start                   # Run compiled server locally
npm run start:serverless    # Run with serverless-offline
```

### Database Operations
```bash
npm run prisma:generate     # Generate Prisma client
npm run prisma:migrate      # Run migrations (development)
npm run prisma:deploy       # Deploy migrations (production)
npm run prisma:studio       # Open Prisma Studio GUI
```

### Deployment
```bash
npm run deploy:aws          # Deploy to AWS Lambda
npm run deploy:vercel       # Deploy to Vercel
```

### Code Quality
```bash
npm run lint                # ESLint check
npm run format              # Prettier formatting
```

### Testing
```bash
node tests/all-tests.js     # Run all tests (comprehensive suite)
node tests/auth.test.js     # Run authentication tests
node tests/auth-security.test.js  # Run security tests
node tests/product.test.js  # Run product tests
node tests/partner.test.js  # Run partner tests
node tests/promoter.test.js # Run promoter tests

# Run specific tests individually:
node tests/address.test.js
node tests/analytics.test.js
node tests/customers.test.js
node tests/database.test.js
node tests/pix-transactions.test.js
```

## Serverless Considerations

### Cold Start Optimization
- Database connection is initialized once and reused
- Prisma client is bundled with deployment package
- Static imports at module level, dynamic imports for heavy operations

### Environment Variables
Required for all deployments:
- `DATABASE_URL`: PostgreSQL connection string with pooling (?pgbouncer=true)
- `DIRECT_URL`: Direct database connection (for migrations)
- `JWT_SECRET`: Token signing secret
- `FRONTEND_URL`: Allowed CORS origin
- `UPLOAD_DIR`: Upload directory (default: ./uploads)
- `BLOB_READ_WRITE_TOKEN`: Vercel Blob storage token (for production)
- `BLOB_BASE_URL`: Blob storage base URL (for production)

### File Storage
- Local development: `./uploads` directory
- Serverless: Configure S3 bucket or similar cloud storage
- Environment variable `UPLOAD_DIR` controls upload location

## API Structure

### Route Organization
```
/api/auth/*         - Authentication (login, register, verify)
/api/partners/*     - Partner store management
/api/products/*     - Product catalog
/api/promoter/*     - Promoter system
/api/orders/*       - Order processing
/api/public/*       - Public endpoints (no auth)
/api/admin/*        - Administrative functions
/api/customer/*     - Customer management
/api/address/*      - Address management
/api/analytics/*    - Analytics and metrics
/api/dashboard/*    - Dashboard data endpoints
/api/onboarding/*   - User onboarding flow
/api/pix/*          - PIX payment transactions
/api/ai-enhancement/* - AI image enhancement
/api/tryon/*        - Virtual try-on features
/api-docs           - Swagger documentation UI
```

### Request Flow
1. CORS validation
2. JWT authentication (if required)
3. Role-based authorization
4. Zod schema validation
5. Controller execution
6. Error handling middleware

## Security Guidelines

### Current Implementation
- JWT tokens with role claims
- Password hashing with bcrypt
- CORS with explicit origin allowlist
- Basic input validation with Zod

### Required Improvements
- Add rate limiting middleware
- Implement request size limits
- Enhance XSS protection
- Add SQL injection prevention beyond Prisma
- Implement API key authentication for public endpoints

## Testing Strategy

### Integration Tests
- Use custom Node.js test scripts with curl
- Test full request/response cycle
- Validate authentication flows
- Check role-based access control

### Test Data Management
- Generate unique test data per run
- Clean up test users after completion
- Use separate test database when possible

## Performance Optimization

### Database Queries
- Use Prisma's `include` for eager loading
- Implement pagination for list endpoints
- Add database indexes for frequent queries
- Use connection pooling for serverless

### Image Processing
- Resize images before storage
- Implement CDN for static assets
- Use Sharp for efficient processing
- Consider async processing for AI enhancement

## Deployment Checklist

### AWS Lambda
1. Set environment variables in AWS Console
2. Configure VPC for database access
3. Set up S3 bucket for file uploads
4. Update `serverless.yml` with correct region/stage
5. Run `npm run deploy:aws`

### Vercel
1. Connect GitHub repository
2. Set environment variables in Vercel dashboard
3. Configure custom domain if needed
4. Run `npm run deploy:vercel` or use auto-deploy

### Database Migration
1. Always run `prisma:generate` before deployment
2. Use `prisma:deploy` for production migrations
3. Never use `prisma:migrate` in production
4. Backup database before schema changes

## Common Tasks

### Adding New Endpoint
1. Create route in `src/routes/`
2. Add controller in `src/controllers/`
3. Define Zod schema in `src/schemas/`
4. Apply appropriate middleware (auth, role, validation)
5. Update route registration in `src/app.ts`
6. Write test in `tests/` directory
7. Run `node tests/all-tests.js` to verify

### Modifying Database Schema
1. Update `prisma/schema.prisma`
2. Run `npm run prisma:migrate` locally
3. Test migrations thoroughly
4. Deploy with `npm run prisma:deploy`

### Implementing New Business Logic
1. Check existing patterns in similar controllers
2. Use transaction for multi-table operations
3. Implement proper error handling
4. Add logging for debugging
5. Consider performance impact

### Running Development Server
```bash
# Start the API server with hot reload
npm run dev

# The server will be available at http://localhost:3001
# Swagger docs at http://localhost:3001/api-docs
```

## Test Data & Credentials

### Default Test Users
The test suite creates dynamic users but also uses these predefined accounts:
- Admin: `admin@example.com`
- Partner Admin: `partner@example.com`
- Customer: Dynamically created with timestamp

### Test Execution Order
When running `all-tests.js`, tests execute in this order for dependency management:
1. auth.test.js - Authentication setup
2. auth-simple.test.js - Basic auth flows
3. auth-security.test.js - Security validations
4. address.test.js - Address management
5. product.test.js - Product CRUD
6. partner.test.js - Partner operations
7. database.test.js - Database operations
8. analytics.test.js - Analytics endpoints
9. pix-transactions.test.js - Payment flows
10. promoter.test.js - Promoter system
11. customers.test.js - Customer management