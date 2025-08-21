const { test, expect } = require('@playwright/test');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  promoterCredentials: {
    email: 'fvcoelho@gmail.com',
    password: 'senha123'
  }
};

test.describe('Debug Promoter Login', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(60000);
  });

  test('debug login flow step by step', async ({ page }) => {
    console.log('🚀 Starting debug login test');
    
    // Step 1: Navigate to login page
    console.log('📍 Step 1: Going to login page...');
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    await page.waitForLoadState('networkidle');
    
    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/debug-01-login-page.png' });
    
    // Step 2: Check if login form is visible
    console.log('🔍 Step 2: Checking login form elements...');
    await expect(page.locator('h1:has-text("Seja bem-vindo novamente")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Entrar")')).toBeVisible();
    
    // Step 3: Fill the form slowly
    console.log('📝 Step 3: Filling form...');
    await page.locator('input[type="email"]').click();
    await page.locator('input[type="email"]').fill(TEST_CONFIG.promoterCredentials.email);
    await page.waitForTimeout(500);
    
    await page.locator('input[type="password"]').click();
    await page.locator('input[type="password"]').fill(TEST_CONFIG.promoterCredentials.password);
    await page.waitForTimeout(500);
    
    // Take screenshot of filled form
    await page.screenshot({ path: 'test-results/debug-02-form-filled.png' });
    
    // Step 4: Submit and track network
    console.log('✅ Step 4: Submitting form...');
    
    // Listen for network responses
    page.on('response', response => {
      console.log(`📡 Response: ${response.status()} ${response.url()}`);
    });
    
    page.on('request', request => {
      console.log(`📤 Request: ${request.method()} ${request.url()}`);
    });
    
    await page.locator('button:has-text("Entrar")').click();
    
    // Wait and see what happens
    await page.waitForTimeout(5000);
    
    // Take screenshot after submission
    await page.screenshot({ path: 'test-results/debug-03-after-submit.png' });
    
    // Check current URL
    const currentUrl = page.url();
    console.log(`🌐 Current URL: ${currentUrl}`);
    
    // Check for any error messages
    const errorMessage = page.locator('[class*="error"], [role="alert"]');
    const hasError = await errorMessage.count() > 0;
    
    if (hasError) {
      console.log('❌ Error detected');
      await page.screenshot({ path: 'test-results/debug-04-error.png' });
    }
    
    // Check if still on login page
    if (currentUrl.includes('/login')) {
      console.log('⚠️ Still on login page');
      // Look for any toast messages or success indicators
      const toastMessage = page.locator('[class*="toast"], [class*="notification"]');
      const toastCount = await toastMessage.count();
      console.log(`📋 Toast messages found: ${toastCount}`);
      
      if (toastCount > 0) {
        const toastText = await toastMessage.first().textContent();
        console.log(`📋 Toast text: ${toastText}`);
      }
    } else {
      console.log('✅ Redirected successfully');
    }
    
    // Wait a bit more to see if there's a delayed redirect
    console.log('⏳ Waiting for potential redirect...');
    await page.waitForTimeout(3000);
    
    const finalUrl = page.url();
    console.log(`🎯 Final URL: ${finalUrl}`);
    
    // Take final screenshot
    await page.screenshot({ path: 'test-results/debug-05-final-state.png' });
    
    console.log('🎉 Debug test completed');
  });
});