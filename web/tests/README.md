# E2E Tests for eBrecho Platform

This directory contains end-to-end tests for the eBrecho multi-tenant e-commerce platform using Playwright.

## Prerequisites

1. **Development Server**: Ensure the Next.js development server is running:
   ```bash
   cd web
   npm run dev
   ```

2. **API Server**: Ensure the API server is running:
   ```bash
   cd api
   npm run dev
   ```

3. **Test Data**: Tests use the following partner credentials:
   - Email: `fvcoelho@me.com`
   - Password: `senha123`
   - Partner Name: `FABIO VARGAS COELHO`
   - Role: `PARTNER_ADMIN`

## Running Tests

### All E2E Tests
```bash
npm run test:e2e
```

### With UI Mode (Visual Debugging)
```bash
npm run test:e2e:ui
```

### Store Setup Tests Only
```bash
npm run test:e2e:store-setup
```

### Debug Mode (Step-by-Step)
```bash
npm run test:e2e:debug
```

### Individual Test Files
```bash
# Run partner login tests
npx playwright test partner-login

# Run store setup tests
npx playwright test partner-store-setup

# Run specific test case
npx playwright test partner-store-setup -g "should successfully complete store setup"
```

## Test Files

### `partner-login.spec.js`
- Partner authentication flow
- Dashboard access verification
- Logout functionality

### `partner-store-setup.spec.ts`
- **Store Setup Wizard**: Complete onboarding flow for new partners
- **Store Configuration**: Updating existing store settings
- **Form Validation**: Testing input validation and error handling
- **Data Persistence**: Verifying data saves and loads correctly
- **Integration Tests**: Full workflow from setup to configuration

## Test Structure

Tests follow the **Page Object Model** pattern for better maintainability:

- `StoreSetupPage`: Handles store setup wizard interactions
- `StoreConfigPage`: Handles configuration page interactions  
- `LoginHelper`: Reusable partner authentication methods

## Test Data and Isolation

- Tests use timestamped data to avoid conflicts
- Each test is independent and can run in isolation
- Database state is not reset between tests (tests should handle existing data gracefully)

## Screenshots and Videos

Test artifacts are saved to `test-results/`:
- Screenshots at key steps
- Videos on test failures
- Trace files for debugging

## Configuration

Test configuration is in:
- `playwright.config.js`: Main Playwright configuration
- Test files contain `TEST_CONFIG` objects for test-specific settings

## Debugging Tips

1. **Use UI Mode**: `npm run test:e2e:ui` for visual debugging
2. **Screenshots**: Check `test-results/` folder for step-by-step screenshots
3. **Console Logs**: Tests include detailed console logging for debugging
4. **Trace Viewer**: Use `npx playwright show-trace` to analyze test traces
5. **Headed Mode**: Tests run with `headless: false` by default for visibility

## Adding New Tests

When adding new test files:

1. Follow the existing naming pattern: `feature-name.spec.ts`
2. Use TypeScript for better type safety
3. Implement Page Object Model pattern
4. Include comprehensive error handling
5. Add meaningful screenshots at key steps
6. Document test scenarios in comments

## Common Issues

- **Timeouts**: Increase timeout values for slower environments
- **Selectors**: Use `data-testid` attributes when available, fall back to role or text selectors
- **Form Validation**: Tests handle both client-side and server-side validation
- **Async Operations**: Use Playwright's auto-waiting features instead of hard-coded delays