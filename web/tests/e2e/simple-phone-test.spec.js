const { test, expect } = require('@playwright/test');

test('Simple phone number test - find business search page', async ({ page }) => {
  test.setTimeout(60000);
  
  console.log('🔍 Testing login and finding business search page');
  
  // Login
  await page.goto('/login');
  await page.fill('input[name="email"]', 'fvcoelho@gmail.com');
  await page.fill('input[name="password"]', 'senha123');
  await page.click('button[type="submit"]');
  
  // Wait for login to complete
  await page.waitForTimeout(3000);
  
  // Take screenshot to see what page we're on
  await page.screenshot({ path: 'test-results/after-login.png', fullPage: true });
  
  // Get current URL
  const currentUrl = page.url();
  console.log('Current URL after login:', currentUrl);
  
  // Try to navigate to promoter convites
  await page.goto('/promoter/convites');
  await page.waitForTimeout(2000);
  
  // Take another screenshot
  await page.screenshot({ path: 'test-results/promoter-convites.png', fullPage: true });
  
  // Check if page has content
  const pageText = await page.textContent('body');
  console.log('Page contains "Buscar Estabelecimentos":', pageText.includes('Buscar Estabelecimentos'));
  console.log('Page contains "convites":', pageText.toLowerCase().includes('convites'));
  console.log('Page contains "places":', pageText.toLowerCase().includes('places'));
  
  // Look for any search-related elements
  const searchElements = await page.$$('input[placeholder*="endereço"], input[placeholder*="local"], input[placeholder*="buscar"]');
  console.log('Found search input elements:', searchElements.length);
  
  // Look for any business-related text
  const businessTexts = await page.$$('text="estabelecimentos", text="business", text="empresas"');
  console.log('Found business-related text:', businessTexts.length);
});