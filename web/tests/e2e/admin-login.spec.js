const { test, expect } = require('@playwright/test');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  adminCredentials: {
    email: 'admin@ebrecho.com.br',
    password: 'admin123'
  }
};

test.describe('Admin Login E2E Test', () => {
  test.beforeEach(async ({ page }) => {
    // Set up page with longer timeouts for local development
    page.setDefaultTimeout(30000);
  });

  test('should successfully login as admin and redirect to dashboard', async ({ page }) => {
    console.log('🚀 Starting Admin Login E2E Test');
    
    // Step 1: Navigate to login page
    console.log('📍 Step 1: Navigating to login page...');
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    
    // Wait for page to load
    await expect(page).toHaveTitle(/eBrecho/);
    
    // Step 2: Verify login page elements
    console.log('🔍 Step 2: Verifying login page elements...');
    await expect(page.locator('h1')).toContainText('Seja bem-vindo novamente');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Entrar")')).toBeVisible();
    
    // Take screenshot of login page
    await page.screenshot({ path: 'test-results/01-login-page.png' });
    
    // Step 3: Fill login form
    console.log('📝 Step 3: Filling login form...');
    await page.locator('input[type="email"]').fill(TEST_CONFIG.adminCredentials.email);
    await page.locator('input[type="password"]').fill(TEST_CONFIG.adminCredentials.password);
    
    // Take screenshot of filled form
    await page.screenshot({ path: 'test-results/02-form-filled.png' });
    
    // Step 4: Submit form
    console.log('✅ Step 4: Submitting login form...');
    await page.locator('button:has-text("Entrar")').click();
    
    // Step 5: Wait for success message and redirect
    console.log('⏳ Waiting for login success...');
    
    // Wait for either success toast or redirect to admin
    try {
      // Check for success toast message
      await expect(page.locator('text=Login realizado com sucesso')).toBeVisible({ timeout: 5000 });
      console.log('✅ Success toast message appeared');
      
      // Wait a bit more for the setTimeout redirect in login page (100ms + buffer)
      await page.waitForTimeout(500);
      console.log('⏳ Waiting for redirect after success toast...');
    } catch (error) {
      console.log('ℹ️  No toast message found, checking for redirect...');
    }
    
    // Step 6: Verify redirect to admin dashboard
    console.log('🎯 Step 5: Verifying admin dashboard access...');
    
    // Wait for navigation to admin dashboard with longer timeout
    await page.waitForURL('**/admin', { timeout: 15000 });
    
    // Verify admin dashboard elements
    await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
    await expect(page.locator('text=Sistema de gerenciamento e análise do eBrecho')).toBeVisible();
    await expect(page.locator('text=admin@ebrecho.com.br')).toBeVisible();
    await expect(page.locator('p:has-text("ADMIN")').first()).toBeVisible();
    
    // Verify admin navigation elements - use more specific selectors
    await expect(page.locator('button:has-text("Visão Geral")')).toBeVisible();
    await expect(page.locator('button:has-text("Usuários")')).toBeVisible();
    await expect(page.locator('button:has-text("Parceiros")')).toBeVisible();
    
    // Verify dashboard stats cards - match actual card titles
    await expect(page.locator('text=Total de Usuários')).toBeVisible();
    await expect(page.locator('text=Parceiros').first()).toBeVisible();
    await expect(page.locator('text=Produtos').first()).toBeVisible();
    await expect(page.locator('text=Receita Total')).toBeVisible();
    
    // Take final screenshot of admin dashboard
    await page.screenshot({ path: 'test-results/03-admin-dashboard.png' });
    
    // Step 7: Logout and verify redirect to home page
    console.log('🚪 Step 6: Logging out...');
    await page.locator('button:has-text("Sair")').click();
    
    // Verify redirect directly to home page
    await page.waitForURL('**/', { timeout: 10000 });
    
    // Wait for home page to load and verify expected elements
    await expect(page.locator('text=Entrar').first()).toBeVisible();
    await expect(page.locator('text=Cadastrar Meu Brechó').first()).toBeVisible();
    
    console.log('✅ Successfully logged out and redirected to home page');
    
    console.log('✅ Home page loaded successfully');
    console.log('🎉 Admin Login Test PASSED');
    console.log('All test steps completed successfully!');
  });
});