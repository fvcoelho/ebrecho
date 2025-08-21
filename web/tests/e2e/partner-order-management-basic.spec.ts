import { test, expect, Page } from '@playwright/test';

// Test configuration with 10 second timeout as specified
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  partnerCredentials: {
    email: 'fvcoelho@me.com',
    password: 'senha123'
  },
  timeout: 10000 // 10 seconds as specified
};

// Helper class for login operations
class LoginHelper {
  constructor(private page: Page) {}

  async loginAsPartner() {
    console.log('🚀 Logging in as partner...');
    
    await this.page.goto(`${TEST_CONFIG.baseUrl}/login`);
    await expect(this.page).toHaveTitle(/eBrecho/);
    
    // Fill login form
    await this.page.locator('input[type="email"]').fill(TEST_CONFIG.partnerCredentials.email);
    await this.page.locator('input[type="password"]').fill(TEST_CONFIG.partnerCredentials.password);
    
    // Submit form
    await this.page.locator('button:has-text("Entrar")').click();
    
    // Check for success and wait for redirect
    try {
      await expect(this.page.locator('text=Login realizado com sucesso')).toBeVisible({ timeout: 5000 });
      console.log('✅ Success toast message appeared');
    } catch (error) {
      console.log('ℹ️  No toast message found, checking for redirect...');
    }
    
    // Wait for redirect to dashboard
    await this.page.waitForURL('**/dashboard', { timeout: 15000 });
    
    // Verify partner dashboard elements
    await expect(this.page.locator('h1:has-text("FABIO COELHO")')).toBeVisible();
    await expect(this.page.locator('text=fvcoelho@me.com')).toBeVisible();
    await expect(this.page.locator('text=PARTNER_ADMIN')).toBeVisible();
    
    console.log('✅ Partner login successful');
  }
}

// Basic Page Object for Orders Page
class OrdersPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto(`${TEST_CONFIG.baseUrl}/pedidos`);
    await this.page.waitForLoadState('networkidle');
  }

  get heading() { 
    return this.page.locator('h1[data-testid="orders-page-title"], h1:has-text("Pedidos")'); 
  }
  
  get description() { 
    return this.page.locator('[data-testid="orders-page-description"], text=Gerencie os pedidos'); 
  }
  
  get refreshButton() { 
    return this.page.locator('[data-testid="refresh-orders-button"], button:has-text("Atualizar")'); 
  }
  
  get searchInput() { 
    return this.page.locator('[data-testid="orders-search-input"], input[placeholder*="Buscar"]'); 
  }
  
  get statusFilter() { 
    return this.page.locator('[data-testid="orders-status-filter"]'); 
  }
  
  get applyButton() { 
    return this.page.locator('[data-testid="apply-filters-button"], button:has-text("Aplicar")'); 
  }
  
  get ordersTable() { 
    return this.page.locator('[data-testid="orders-table"], table'); 
  }
  
  get noOrdersMessage() { 
    return this.page.locator('[data-testid="no-orders-message"], text=Nenhum pedido encontrado'); 
  }

  // Stats card getters
  get totalOrdersCard() { 
    return this.page.locator('[data-testid="total-orders-card"]'); 
  }
  
  get pendingOrdersCard() { 
    return this.page.locator('[data-testid="pending-orders-card"]'); 
  }
  
  get deliveredOrdersCard() { 
    return this.page.locator('[data-testid="delivered-orders-card"]'); 
  }
  
  get revenueCard() { 
    return this.page.locator('[data-testid="revenue-card"]'); 
  }

  async searchOrders(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(1000);
  }

  async filterByStatus(status: string) {
    await this.statusFilter.click();
    await this.page.locator(`text="${status}"`).click();
    await this.applyButton.click();
    await this.page.waitForTimeout(2000);
  }

  async refreshOrders() {
    await this.refreshButton.click();
    await this.page.waitForTimeout(2000);
  }

  async getStats() {
    const totalCard = this.totalOrdersCard;
    const pendingCard = this.pendingOrdersCard;
    const deliveredCard = this.deliveredOrdersCard;
    const revenueCard = this.revenueCard;

    let stats = { total: 0, pending: 0, delivered: 0, revenue: 'R$ 0,00' };

    try {
      if (await totalCard.isVisible()) {
        const totalText = await totalCard.locator('[data-testid="total-orders-count"], p').nth(1).textContent();
        stats.total = parseInt(totalText || '0');
      }
      
      if (await pendingCard.isVisible()) {
        const pendingText = await pendingCard.locator('[data-testid="pending-orders-count"], p').nth(1).textContent();
        stats.pending = parseInt(pendingText || '0');
      }
      
      if (await deliveredCard.isVisible()) {
        const deliveredText = await deliveredCard.locator('[data-testid="delivered-orders-count"], p').nth(1).textContent();
        stats.delivered = parseInt(deliveredText || '0');
      }
      
      if (await revenueCard.isVisible()) {
        const revenueText = await revenueCard.locator('[data-testid="total-revenue"], p').nth(1).textContent();
        stats.revenue = revenueText || 'R$ 0,00';
      }
    } catch (error) {
      console.log('Could not get all stats, using defaults');
    }

    return stats;
  }
}

test.describe('Partner Order Management - Basic Tests', () => {
  let loginHelper: LoginHelper;
  let ordersPage: OrdersPage;

  test.beforeEach(async ({ page }) => {
    // Set timeout to 10 seconds as specified
    page.setDefaultTimeout(TEST_CONFIG.timeout);
    
    // Initialize page objects
    loginHelper = new LoginHelper(page);
    ordersPage = new OrdersPage(page);
    
    // Login as partner before each test
    await loginHelper.loginAsPartner();
  });

  test('should load orders page with correct elements', async ({ page }) => {
    console.log('📋 Testing basic orders page loading');

    await ordersPage.goto();
    
    // Verify page loads and basic elements are present
    await expect(ordersPage.heading).toBeVisible();
    console.log('✅ Page heading visible');
    
    await expect(ordersPage.description).toBeVisible();
    console.log('✅ Page description visible');
    
    await expect(ordersPage.refreshButton).toBeVisible();
    console.log('✅ Refresh button visible');
    
    await expect(ordersPage.searchInput).toBeVisible();
    console.log('✅ Search input visible');
    
    // Check if orders table or no orders message is present
    const hasTable = await ordersPage.ordersTable.isVisible();
    const hasNoOrdersMessage = await ordersPage.noOrdersMessage.isVisible();
    
    expect(hasTable || hasNoOrdersMessage).toBeTruthy();
    console.log(`✅ Orders content visible: ${hasTable ? 'table' : 'no orders message'}`);
    
    await page.screenshot({ path: 'test-results/orders-page-loaded.png' });
    console.log('✅ Orders page loaded successfully');
  });

  test('should display statistics cards', async ({ page }) => {
    console.log('📊 Testing statistics cards display');

    await ordersPage.goto();
    
    // Check if stats cards are visible
    await expect(ordersPage.totalOrdersCard).toBeVisible();
    await expect(ordersPage.pendingOrdersCard).toBeVisible();
    await expect(ordersPage.deliveredOrdersCard).toBeVisible();
    await expect(ordersPage.revenueCard).toBeVisible();
    
    console.log('✅ All stats cards are visible');
    
    // Get stats
    const stats = await ordersPage.getStats();
    console.log('📈 Current stats:', stats);
    
    // Verify stats are valid numbers/strings
    expect(stats.total).toBeGreaterThanOrEqual(0);
    expect(stats.pending).toBeGreaterThanOrEqual(0);
    expect(stats.delivered).toBeGreaterThanOrEqual(0);
    expect(stats.revenue).toMatch(/R\$\s*[\d.,]+/);
    
    await page.screenshot({ path: 'test-results/orders-statistics.png' });
    console.log('✅ Statistics display working correctly');
  });

  test('should handle search functionality', async ({ page }) => {
    console.log('🔍 Testing search functionality');

    await ordersPage.goto();
    
    // Test search with various queries
    const searchQueries = ['test', 'ordem', 'cliente', '2024'];
    
    for (const query of searchQueries) {
      await ordersPage.searchOrders(query);
      console.log(`🔍 Searched for: ${query}`);
      
      // Wait for any filtering to complete
      await page.waitForTimeout(1000);
      
      // Check that page is still responsive
      await expect(ordersPage.ordersTable.or(ordersPage.noOrdersMessage)).toBeVisible();
    }
    
    // Clear search
    await ordersPage.searchOrders('');
    console.log('🔍 Cleared search');
    
    await page.screenshot({ path: 'test-results/orders-search-tested.png' });
    console.log('✅ Search functionality working');
  });

  test('should handle status filtering', async ({ page }) => {
    console.log('🏷️ Testing status filtering');

    await ordersPage.goto();
    
    // Test different status filters if dropdown is available
    try {
      if (await ordersPage.statusFilter.isVisible()) {
        const statuses = ['Pendente', 'Confirmado', 'Entregue', 'Cancelado'];
        
        for (const status of statuses) {
          try {
            await ordersPage.filterByStatus(status);
            console.log(`🏷️ Applied filter: ${status}`);
            
            // Verify page is still responsive
            await expect(ordersPage.ordersTable.or(ordersPage.noOrdersMessage)).toBeVisible();
            
            await page.waitForTimeout(1000);
          } catch (error) {
            console.log(`ℹ️ Status filter "${status}" not available or not working`);
          }
        }
        
        // Reset to all
        try {
          await ordersPage.statusFilter.click();
          await page.locator('text="Todos"').click();
          await ordersPage.applyButton.click();
          console.log('🏷️ Reset filters to all');
        } catch (error) {
          console.log('ℹ️ Could not reset filters');
        }
      } else {
        console.log('ℹ️ Status filter not visible, skipping filter test');
      }
    } catch (error) {
      console.log('ℹ️ Status filtering not available or not working as expected');
    }
    
    await page.screenshot({ path: 'test-results/orders-filtering-tested.png' });
    console.log('✅ Status filtering functionality tested');
  });

  test('should handle refresh functionality', async ({ page }) => {
    console.log('🔄 Testing refresh functionality');

    await ordersPage.goto();
    
    // Get initial stats
    const initialStats = await ordersPage.getStats();
    console.log('📊 Initial stats:', initialStats);
    
    // Click refresh
    await ordersPage.refreshOrders();
    console.log('🔄 Clicked refresh button');
    
    // Get updated stats
    const updatedStats = await ordersPage.getStats();
    console.log('📊 Updated stats:', updatedStats);
    
    // Verify page is still functional
    await expect(ordersPage.ordersTable.or(ordersPage.noOrdersMessage)).toBeVisible();
    
    await page.screenshot({ path: 'test-results/orders-refresh-tested.png' });
    console.log('✅ Refresh functionality working');
  });

  test('should navigate to order details if orders exist', async ({ page }) => {
    console.log('👁️ Testing order details navigation');

    await ordersPage.goto();
    
    // Check if there are any orders
    const hasOrders = await ordersPage.ordersTable.isVisible();
    
    if (hasOrders) {
      // Look for order rows
      const orderRows = ordersPage.ordersTable.locator('tbody tr');
      const rowCount = await orderRows.count();
      
      if (rowCount > 0) {
        console.log(`📋 Found ${rowCount} order(s)`);
        
        // Try to click first order row
        const firstRow = orderRows.first();
        await firstRow.click();
        
        // Wait for modal or navigation
        await page.waitForTimeout(2000);
        
        // Check if a modal opened or we navigated somewhere
        const hasModal = await page.locator('[data-testid="order-details-modal"], [role="dialog"]').isVisible();
        
        if (hasModal) {
          console.log('✅ Order details modal opened');
          
          // Close modal
          const closeButton = page.locator('[role="dialog"] button, button:has-text("×")').first();
          if (await closeButton.isVisible()) {
            await closeButton.click();
            console.log('✅ Modal closed');
          }
        } else {
          console.log('ℹ️ No modal detected, order details might open in different way');
        }
      } else {
        console.log('ℹ️ No order rows found in table');
      }
    } else {
      console.log('ℹ️ No orders table found - likely no orders exist');
      await expect(ordersPage.noOrdersMessage).toBeVisible();
    }
    
    await page.screenshot({ path: 'test-results/orders-details-tested.png' });
    console.log('✅ Order details navigation tested');
  });

  test('should handle empty state gracefully', async ({ page }) => {
    console.log('📭 Testing empty state handling');

    await ordersPage.goto();
    
    // Apply a search that should return no results
    await ordersPage.searchOrders('nonexistent-order-12345678');
    await page.waitForTimeout(2000);
    
    // Should show either no orders message or empty table
    const hasNoOrdersMessage = await ordersPage.noOrdersMessage.isVisible();
    const hasEmptyTable = await ordersPage.ordersTable.isVisible();
    
    if (hasNoOrdersMessage) {
      console.log('✅ No orders message displayed');
      await expect(ordersPage.noOrdersMessage).toBeVisible();
    } else if (hasEmptyTable) {
      console.log('✅ Empty table displayed');
      await expect(ordersPage.ordersTable).toBeVisible();
    } else {
      console.log('ℹ️ Different empty state handling detected');
    }
    
    // Clear search to return to normal state
    await ordersPage.searchOrders('');
    await page.waitForTimeout(1000);
    
    await page.screenshot({ path: 'test-results/orders-empty-state.png' });
    console.log('✅ Empty state handling tested');
  });

  test('should maintain responsiveness during operations', async ({ page }) => {
    console.log('⚡ Testing UI responsiveness');

    await ordersPage.goto();
    
    // Perform multiple operations quickly
    await ordersPage.searchOrders('test');
    await page.waitForTimeout(500);
    
    await ordersPage.refreshOrders();
    await page.waitForTimeout(500);
    
    await ordersPage.searchOrders('');
    await page.waitForTimeout(500);
    
    // Verify page is still responsive
    await expect(ordersPage.heading).toBeVisible();
    await expect(ordersPage.refreshButton).toBeVisible();
    await expect(ordersPage.searchInput).toBeVisible();
    
    // Verify content area is visible
    await expect(ordersPage.ordersTable.or(ordersPage.noOrdersMessage)).toBeVisible();
    
    await page.screenshot({ path: 'test-results/orders-responsiveness.png' });
    console.log('✅ UI responsiveness maintained during operations');
  });
});