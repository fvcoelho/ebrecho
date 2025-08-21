const { test, expect } = require('@playwright/test');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  partnerCredentials: {
    email: 'fvcoelho@me.com',
    password: 'senha123'
  }
};

test.describe('Partner Login E2E Test', () => {
  test.beforeEach(async ({ page }) => {
    // Set up page with longer timeouts for local development
    page.setDefaultTimeout(30000);
  });

  test('should successfully login as partner and redirect to dashboard', async ({ page }) => {
    console.log('🚀 Starting Partner Login E2E Test');
    
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
    await page.screenshot({ path: 'test-results/partner-01-login-page.png' });
    
    // Step 3: Fill login form
    console.log('📝 Step 3: Filling login form...');
    await page.locator('input[type="email"]').fill(TEST_CONFIG.partnerCredentials.email);
    await page.locator('input[type="password"]').fill(TEST_CONFIG.partnerCredentials.password);
    
    // Take screenshot of filled form
    await page.screenshot({ path: 'test-results/partner-02-form-filled.png' });
    
    // Step 4: Submit form
    console.log('✅ Step 4: Submitting login form...');
    await page.locator('button:has-text("Entrar")').click();
    
    // Step 5: Wait for success message and redirect
    console.log('⏳ Waiting for login success...');
    
    // Wait for either success toast or redirect to dashboard
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
    
    // Step 6: Verify redirect to partner dashboard
    console.log('🎯 Step 5: Verifying partner dashboard access...');
    
    // Wait for navigation to partner dashboard with longer timeout  
    await page.waitForURL('**/dashboard', { timeout: 15000 });
    
    // Verify partner dashboard elements - sidebar shows user info, main content shows partner info
    // The partner name is loaded dynamically from API in the main content area
    await expect(page.locator('h1:has-text("Painel do Brechó")')).toBeVisible();
    await expect(page.locator('text=fvcoelho@me.com')).toBeVisible();
    await expect(page.locator('text=PARTNER_ADMIN')).toBeVisible();
    
    // Wait for dashboard content to load (either partner name or loading/error message)
    await page.waitForFunction(() => {
      const mainHeading = document.querySelector('h1.text-3xl');
      const bodyText = document.body ? document.body.textContent : '';
      return mainHeading !== null || 
             bodyText.includes('Loading dashboard...') ||
             bodyText.includes('Complete o cadastro');
    }, { timeout: 10000 });
    
    // Verify partner navigation elements - use first() for sidebar buttons
    await expect(page.locator('button:has-text("Meu Brechó")')).toBeVisible();
    await expect(page.locator('button:has-text("Produtos")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Pedidos")')).toBeVisible();
    await expect(page.locator('button:has-text("Vendas")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Análises")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Clientes")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Configurações")')).toBeVisible();
    
    // Verify dashboard stats cards for partner
    await expect(page.locator('text=Total de Itens')).toBeVisible();
    await expect(page.locator('text=Vendas do Mês')).toBeVisible();
    await expect(page.locator('text=Receita Mensal')).toBeVisible();
    await expect(page.locator('text=Produtos Vendidos')).toBeVisible();
    
    // Take final screenshot of partner dashboard
    await page.screenshot({ path: 'test-results/partner-03-dashboard.png' });
    
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
    console.log('🎉 Partner Login Test PASSED');
    console.log('All test steps completed successfully!');
  });
});