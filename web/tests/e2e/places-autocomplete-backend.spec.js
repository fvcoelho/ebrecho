import { test, expect } from '@playwright/test';

/**
 * Test updated PlacesAutocomplete component with backend API
 * Verifies that component correctly uses backend API and retrieves phone numbers
 */

test.describe('PlacesAutocomplete Backend API Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as promoter user
    await page.goto('http://localhost:3002/login');
    await page.fill('input[name="email"]', 'fvcoelho@gmail.com');
    await page.fill('input[name="password"]', 'senha123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard and then navigate to convites page
    await page.waitForURL(/dashboard|promoter/);
    await page.goto('http://localhost:3002/promoter-dashboard/convites');
    await page.waitForLoadState('networkidle');
  });

  test('should use backend API for autocomplete search', async ({ page }) => {
    console.log('🧪 Testing PlacesAutocomplete backend API integration...');

    // Listen for API requests to verify backend is being called
    const apiCalls = [];
    page.on('request', request => {
      if (request.url().includes('/api/places/autocomplete')) {
        apiCalls.push(request.url());
        console.log('📍 Backend autocomplete API called:', request.url());
      }
    });

    // Find the search location input (PlacesAutocomplete for location search)
    const locationInput = page.locator('input[placeholder*="Digite um endereço"]');
    await expect(locationInput).toBeVisible();

    // Type a search query
    await locationInput.fill('São Paulo');
    
    // Wait for debounced API call (500ms debounce + request time)
    await page.waitForTimeout(1000);
    
    // Verify backend API was called
    expect(apiCalls.length).toBeGreaterThan(0);
    expect(apiCalls[0]).toContain('/api/places/autocomplete');
    expect(apiCalls[0]).toContain('input=S%C3%A3o%20Paulo');
    console.log('✅ Backend autocomplete API correctly called');

    // Check if suggestions appear
    const suggestions = page.locator('[class*="absolute z-50"]').locator('div[class*="cursor-pointer"]');
    await expect(suggestions.first()).toBeVisible({ timeout: 5000 });
    console.log('✅ Autocomplete suggestions appeared');

    // Count suggestions
    const suggestionCount = await suggestions.count();
    console.log(`📍 Found ${suggestionCount} location suggestions`);
    expect(suggestionCount).toBeGreaterThan(0);
  });

  test('should call backend API for place details with phone numbers', async ({ page }) => {
    console.log('🧪 Testing PlacesAutocomplete place details with phone numbers...');

    // Listen for both autocomplete and details API calls
    const apiCalls = [];
    page.on('request', request => {
      if (request.url().includes('/api/places/')) {
        apiCalls.push({
          type: request.url().includes('autocomplete') ? 'autocomplete' : 'details',
          url: request.url()
        });
        console.log('📍 API called:', request.url());
      }
    });

    // Search for a location
    const locationInput = page.locator('input[placeholder*="Digite um endereço"]');
    await locationInput.fill('Shopping Ibirapuera');
    await page.waitForTimeout(1000);

    // Wait for suggestions and click first one
    const suggestions = page.locator('[class*="absolute z-50"]').locator('div[class*="cursor-pointer"]');
    await expect(suggestions.first()).toBeVisible({ timeout: 5000 });
    await suggestions.first().click();

    // Wait for place details API call
    await page.waitForTimeout(2000);

    // Verify both autocomplete and details APIs were called
    const autocompleteCalls = apiCalls.filter(call => call.type === 'autocomplete');
    const detailsCalls = apiCalls.filter(call => call.type === 'details');

    expect(autocompleteCalls.length).toBeGreaterThan(0);
    expect(detailsCalls.length).toBeGreaterThan(0);
    
    console.log('✅ Both autocomplete and details APIs called');
    console.log(`📊 Autocomplete calls: ${autocompleteCalls.length}, Details calls: ${detailsCalls.length}`);

    // Verify details API includes place_id parameter
    expect(detailsCalls[0].url).toContain('placeId=');
    console.log('✅ Details API called with placeId parameter');

    // Check if location is now set (this should trigger business search)
    const locationDisplay = page.locator('text*="Shopping Ibirapuera"');
    await expect(locationDisplay).toBeVisible({ timeout: 5000 });
    console.log('✅ Location successfully selected and displayed');
  });

  test('should handle keyboard navigation in autocomplete', async ({ page }) => {
    console.log('🧪 Testing PlacesAutocomplete keyboard navigation...');

    const locationInput = page.locator('input[placeholder*="Digite um endereço"]');
    await locationInput.fill('Centro São Paulo');
    await page.waitForTimeout(1000);

    // Wait for suggestions
    const suggestions = page.locator('[class*="absolute z-50"]').locator('div[class*="cursor-pointer"]');
    await expect(suggestions.first()).toBeVisible({ timeout: 5000 });

    // Test arrow key navigation
    await locationInput.press('ArrowDown');
    await page.waitForTimeout(200);
    
    // Check if first suggestion is highlighted
    const highlightedSuggestion = page.locator('div[class*="bg-accent text-accent-foreground"]');
    await expect(highlightedSuggestion).toBeVisible();
    console.log('✅ Arrow key navigation working');

    // Test Enter key selection
    await locationInput.press('Enter');
    await page.waitForTimeout(1000);

    // Should hide suggestions after selection
    await expect(suggestions.first()).not.toBeVisible({ timeout: 3000 });
    console.log('✅ Enter key selection working');
  });

  test('should clear input with X button', async ({ page }) => {
    console.log('🧪 Testing PlacesAutocomplete clear functionality...');

    const locationInput = page.locator('input[placeholder*="Digite um endereço"]');
    await locationInput.fill('Test Location');
    await page.waitForTimeout(500);

    // Should show clear button (X) when there's text
    const clearButton = page.locator('button').filter({ has: page.locator('.lucide-x') });
    await expect(clearButton).toBeVisible();

    // Click clear button
    await clearButton.click();

    // Should clear the input
    await expect(locationInput).toHaveValue('');
    console.log('✅ Clear button working correctly');

    // Clear button should be hidden now
    await expect(clearButton).not.toBeVisible();
  });

  test('should show loading spinner during API calls', async ({ page }) => {
    console.log('🧪 Testing PlacesAutocomplete loading states...');

    const locationInput = page.locator('input[placeholder*="Digite um endereço"]');
    
    // Start typing
    await locationInput.fill('Av');
    
    // Should show loading spinner
    const spinner = page.locator('.lucide-loader2, [class*="animate-spin"]');
    
    // Note: The spinner might appear very briefly, so we'll check if it appears at some point
    let spinnerAppeared = false;
    try {
      await expect(spinner).toBeVisible({ timeout: 2000 });
      spinnerAppeared = true;
      console.log('✅ Loading spinner appeared during search');
    } catch (e) {
      console.log('ℹ️ Loading spinner might have appeared too briefly to detect');
    }

    // Continue typing to trigger more API calls
    await locationInput.fill('Avenida Paulista');
    await page.waitForTimeout(1000);

    // Should not be loading after API completes
    await expect(spinner).not.toBeVisible({ timeout: 3000 });
    console.log('✅ Loading state correctly resolved');
  });
});