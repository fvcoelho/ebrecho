const { test, expect } = require('@playwright/test');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  promoterCredentials: {
    email: 'fvcoelho@gmail.com',
    password: 'senha123'
  }
};

test.describe('Promoter Login E2E Test', () => {
  test.beforeEach(async ({ page }) => {
    // Set up page with longer timeouts for local development
    page.setDefaultTimeout(30000);
  });

  test('should successfully login as promoter and redirect to dashboard', async ({ page }) => {
    console.log('🚀 Starting Promoter Login E2E Test');
    
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
    await page.screenshot({ path: 'test-results/promoter-01-login-page.png' });
    
    // Step 3: Fill login form
    console.log('📝 Step 3: Filling login form...');
    await page.locator('input[type="email"]').fill(TEST_CONFIG.promoterCredentials.email);
    await page.locator('input[type="password"]').fill(TEST_CONFIG.promoterCredentials.password);
    
    // Take screenshot of filled form
    await page.screenshot({ path: 'test-results/promoter-02-form-filled.png' });
    
    // Step 4: Submit form
    console.log('✅ Step 4: Submitting login form...');
    await page.locator('button:has-text("Entrar")').click();
    
    // Step 5: Wait for success message and redirect
    console.log('⏳ Waiting for login success...');
    
    // Wait for either success toast or redirect to promoter dashboard
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
    
    // Step 6: Verify redirect to promoter dashboard
    console.log('🎯 Step 5: Verifying promoter dashboard access...');
    
    // Wait for navigation to promoter dashboard with longer timeout
    await page.waitForURL('**/promoter-dashboard', { timeout: 15000 });
    
    // Verify promoter dashboard elements
    await expect(page.locator('h1:has-text("Painel do Promotor")')).toBeVisible();
    await expect(page.locator('text=fvcoelho@gmail.com')).toBeVisible();
    await expect(page.locator('text=PROMOTER')).toBeVisible();
    
    // Verify main dashboard page content
    await expect(page.locator('h1:has-text("Bem-vindo")')).toBeVisible();
    await expect(page.locator('text=Você é um Promotor do eBrecho')).toBeVisible();
    
    // Verify promoter navigation elements - use first() for sidebar buttons
    await expect(page.locator('button:has-text("Painel Geral")')).toBeVisible();
    await expect(page.locator('button:has-text("Convidar Parceiros")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Meus Parceiros")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Eventos")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Comissões")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Relatórios")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Recompensas")').first()).toBeVisible();
    await expect(page.locator('button:has-text("Configurações")').first()).toBeVisible();
    
    // Verify dashboard stats cards for promoter
    await expect(page.locator('text=Parceiros Convidados')).toBeVisible();
    await expect(page.locator('text=Parceiros Ativos')).toBeVisible();
    await expect(page.locator('text=Comissões do Mês')).toBeVisible();
    await expect(page.locator('text=Eventos Criados')).toBeVisible();
    
    // Take final screenshot of promoter dashboard
    await page.screenshot({ path: 'test-results/promoter-03-dashboard.png' });
    
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
    console.log('🎉 Promoter Login Test PASSED');
    console.log('All test steps completed successfully!');
  });
});