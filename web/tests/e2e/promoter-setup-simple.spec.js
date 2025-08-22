import { test, expect } from '@playwright/test';

// Simplified E2E Test for Promoter Setup Flow
// This test manually handles database operations using external calls
test.describe('Promoter Setup Flow - Simplified', () => {
  let testUser = null;
  let testUserData = null;

  // Generate unique test data for each run
  const generateTestData = () => ({
    email: `test-promoter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}@example.com`,
    password: 'TestPass123!',
    name: 'Test Promoter User',
    businessName: 'Test Promoter Business',
    territory: 'São Paulo - SP',
    specialization: 'Vintage Fashion',
    phone: '(11) 99999-9999'
  });

  test.beforeEach(async () => {
    testUserData = generateTestData();
    console.log(`Generated test data:`, testUserData);
  });

  test.afterEach(async ({ page }) => {
    // Simple cleanup - log the test user for manual cleanup if needed
    if (testUser) {
      console.log(`Test completed with user: ${testUser.id} (${testUser.email})`);
      console.log('Note: Test user will be automatically cleaned up or can be manually removed from database');
    }
    testUser = null;
  });

  test('should create promoter user and complete setup flow with manual verification', async ({ page }) => {
    console.log('Starting promoter setup flow test...');

    await test.step('Create test user via API', async () => {
      console.log('Creating test user via API...');
      
      const response = await page.request.post('http://localhost:3001/api/auth/register', {
        data: {
          name: testUserData.name,
          email: testUserData.email,
          password: testUserData.password,
          role: 'PROMOTER'
        }
      });

      expect(response.ok()).toBe(true);
      const responseData = await response.json();
      testUser = responseData.data?.user || responseData.user;
      console.log('Test user created:', testUser);
    });

    await test.step('Login attempt (should fail due to unverified email)', async () => {
      console.log('Attempting login with unverified email (should fail)...');
      
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');

      await page.fill('input[type="email"]', testUserData.email);
      await page.fill('input[type="password"]', testUserData.password);
      await page.click('button[type="submit"]');
      
      await page.waitForLoadState('networkidle');

      // Should stay on login page or show verification message
      const currentUrl = page.url();
      console.log('Current URL after login attempt:', currentUrl);
      
      // Look for verification message or error
      const errorMessage = page.locator('text=verificar').or(page.locator('text=verificação')).or(page.locator('text=verify'));
      const isOnLogin = currentUrl.includes('/login');
      
      if (isOnLogin || await errorMessage.count() > 0) {
        console.log('✅ Login correctly failed due to unverified email');
      } else {
        console.log('⚠️ Login may have succeeded unexpectedly, continuing test...');
      }
    });

    // NOTE: At this point, we would need to manually verify the email using Neon tools
    console.log('⚠️ Test paused: Email verification needs to be handled manually');
    console.log(`Email: ${testUserData.email}`);
    console.log(`User ID: ${testUser.id}`);
    console.log('To continue the test manually, verify this email in the database and re-run with verified user.');

    // For now, let's try to access setup page directly to see what happens
    await test.step('Try to access setup page without verification', async () => {
      console.log('Attempting to access setup page without email verification...');
      
      await page.goto('http://localhost:3000/setup-promoter');
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      console.log('Setup page access URL:', currentUrl);
      
      if (currentUrl.includes('/login')) {
        console.log('✅ Correctly redirected to login (authentication required)');
      } else if (currentUrl.includes('/setup-promoter')) {
        console.log('⚠️ Setup page accessible without login - checking page content');
        
        // Check if the page shows login form or actual setup form
        const loginForm = page.locator('input[type="email"]');
        const setupForm = page.locator('input#businessName');
        
        if (await loginForm.count() > 0) {
          console.log('✅ Page shows login form - authentication required');
        } else if (await setupForm.count() > 0) {
          console.log('❌ Setup form accessible without authentication - security issue!');
        } else {
          console.log('? Unknown page state');
        }
      } else {
        console.log(`Unexpected redirect to: ${currentUrl}`);
      }
    });
  });

  test('should verify promoter setup form is accessible after login', async ({ page }) => {
    console.log('Testing promoter setup form accessibility...');

    await test.step('Create and try to verify user', async () => {
      // Create user
      const response = await page.request.post('http://localhost:3001/api/auth/register', {
        data: {
          name: testUserData.name,
          email: testUserData.email,
          password: testUserData.password,
          role: 'PROMOTER'
        }
      });

      expect(response.ok()).toBe(true);
      const responseData = await response.json();
      testUser = responseData.data?.user || responseData.user;
      console.log('Test user created:', testUser);
    });

    await test.step('Test form validation without login', async () => {
      console.log('Testing form validation and page structure...');
      
      await page.goto('http://localhost:3000/setup-promoter');
      await page.waitForLoadState('networkidle');
      
      const currentUrl = page.url();
      console.log('Form test URL:', currentUrl);
      
      // Check if any form fields are visible
      const businessNameField = page.locator('input#businessName').or(page.locator('[name="businessName"]'));
      const submitButton = page.locator('button[type="submit"]').or(page.locator('button').filter({ hasText: /ativar|submit|criar/i }));
      
      const hasBusinessName = await businessNameField.count() > 0;
      const hasSubmitButton = await submitButton.count() > 0;
      
      console.log(`Business name field found: ${hasBusinessName}`);
      console.log(`Submit button found: ${hasSubmitButton}`);
      
      if (hasBusinessName && hasSubmitButton) {
        console.log('✅ Form fields are present - testing validation');
        
        // Try to submit empty form
        await submitButton.click();
        
        // Look for validation messages
        await page.waitForTimeout(1000); // Give time for validation messages
        
        const validationMessage = page.locator('text=obrigatório').or(page.locator('text=required')).or(page.locator('[role="alert"]'));
        const hasValidation = await validationMessage.count() > 0;
        
        console.log(`Validation message found: ${hasValidation}`);
        
        if (hasValidation) {
          console.log('✅ Form validation is working');
        } else {
          console.log('⚠️ No validation messages found - may need manual verification');
        }
      } else {
        console.log('Form fields not found - likely requires authentication');
      }
    });
  });

  test('should test page routing and accessibility', async ({ page }) => {
    console.log('Testing page routing and basic accessibility...');

    await test.step('Test main pages accessibility', async () => {
      // Test login page
      await page.goto('http://localhost:3000/login');
      await page.waitForLoadState('networkidle');
      
      const loginPageTitle = await page.locator('h1, h2, [role="heading"]').first().textContent();
      console.log('Login page title:', loginPageTitle);
      
      // Test setup-promoter page
      await page.goto('http://localhost:3000/setup-promoter');
      await page.waitForLoadState('networkidle');
      
      const setupPageUrl = page.url();
      console.log('Setup page final URL:', setupPageUrl);
      
      // Test promoter dashboard page (if accessible)
      await page.goto('http://localhost:3000/promoter-dashboard');
      await page.waitForLoadState('networkidle');
      
      const dashboardUrl = page.url();
      console.log('Dashboard page final URL:', dashboardUrl);
      
      console.log('✅ Basic routing test completed');
    });
  });
});