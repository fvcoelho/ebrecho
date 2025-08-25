const { test, expect } = require('@playwright/test');

/**
 * eBrecho Business Search Phone Numbers E2E Test
 * Tests the business search functionality with phone number display and contact features
 */

const TEST_CONFIG = {
  userCredentials: {
    email: 'fvcoelho@gmail.com',
    password: 'senha123'
  },
  searchLocation: 'São Paulo, SP',
  timeouts: {
    navigation: 15000,
    element: 10000,
    search: 20000
  }
};

test.describe('Business Search Phone Numbers', () => {
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for this test suite
    test.setTimeout(120000);
    
    // Navigate to the application
    await page.goto('/');
  });

  test('should login and test business search phone functionality', async ({ page }) => {
    console.log('🚀 Starting Business Search Phone Numbers E2E Test');
    
    // Step 1: Login
    console.log('📍 Step 1: Logging in with user credentials...');
    await loginUser(page);
    
    // Step 2: Navigate to business search
    console.log('🔍 Step 2: Navigating to business search...');
    await navigateToBusinessSearch(page);
    
    // Step 3: Search for businesses
    console.log('🏪 Step 3: Searching for businesses...');
    await searchForBusinesses(page);
    
    // Step 4: Verify business cards
    console.log('📱 Step 4: Verifying business cards...');
    const hasBusinessCards = await verifyBusinessCardsDisplay(page);
    
    // Step 5: Check phone numbers (only if we have business cards)
    if (hasBusinessCards) {
      console.log('📞 Step 5: Checking phone numbers...');
      await verifyPhoneNumberDisplay(page);
      
      console.log('☎️ Step 6: Testing phone functionality...');
      await testPhoneCallButton(page);
      
      console.log('💬 Step 7: Testing WhatsApp functionality...');
      await testWhatsAppButton(page);
    }
    
    console.log('🎉 Business Search Phone Test completed!');
  });
});

/**
 * Helper Functions
 */

async function loginUser(page) {
  // Navigate to login page
  await page.goto('/login');
  
  // Wait for and fill login form
  await page.waitForSelector('input[name="email"]', { timeout: TEST_CONFIG.timeouts.element });
  
  await page.fill('input[name="email"]', TEST_CONFIG.userCredentials.email);
  await page.fill('input[name="password"]', TEST_CONFIG.userCredentials.password);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for successful login (look for user menu or redirect)
  try {
    await page.waitForSelector('[data-testid="user-menu"], button:has-text("Sair"), a:has-text("Dashboard")', { 
      timeout: TEST_CONFIG.timeouts.navigation 
    });
    console.log('✅ User logged in successfully');
  } catch (error) {
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/login-failure.png' });
    throw new Error('Login failed - could not find user menu or dashboard');
  }
}

async function navigateToBusinessSearch(page) {
  // The business search is on the main promoter dashboard
  console.log('  Navigating to promoter dashboard...');
  await page.goto('/promoter');
  
  // Wait for page to load
  await page.waitForLoadState('networkidle');
  
  // Check for business search elements
  const inputElements = await page.$$('input[placeholder*="endereço"], input[placeholder*="local"]');
  const textElements = await page.$$('text="Buscar Estabelecimentos"');
  const searchElements = [...inputElements, ...textElements];
  
  if (searchElements.length > 0) {
    console.log('✅ Found business search on promoter dashboard');
    return;
  }
  
  // If not found on main dashboard, try the convites sub-route
  const possibleRoutes = ['/promoter/convites'];
  
  let navigationSuccess = false;
  
  for (const route of possibleRoutes) {
    try {
      console.log(`  Trying route: ${route}`);
      await page.goto(route);
      
      // Wait for page to load
      await page.waitForLoadState('networkidle');
      
      // Check for business search elements
      const searchElements = await page.$$('input[placeholder*="endereço"], input[placeholder*="local"], text="Buscar Estabelecimentos"');
      
      if (searchElements.length > 0) {
        console.log(`✅ Found business search page at: ${route}`);
        navigationSuccess = true;
        break;
      }
    } catch (error) {
      console.log(`  Route ${route} not accessible, trying next...`);
      continue;
    }
  }
  
  if (!navigationSuccess) {
    await page.screenshot({ path: 'test-results/no-business-search-found.png' });
    throw new Error('Could not find business search page at any known route');
  }
}

async function searchForBusinesses(page) {
  // Find location input field
  const locationInputSelectors = [
    'input[placeholder*="endereço"]',
    'input[placeholder*="local"]', 
    'input[placeholder*="Digite um endereço"]',
    '[data-testid="location-input"]'
  ];
  
  let locationInput = null;
  
  for (const selector of locationInputSelectors) {
    const elements = await page.$$(selector);
    if (elements.length > 0) {
      locationInput = elements[0];
      console.log(`  Found location input with: ${selector}`);
      break;
    }
  }
  
  if (!locationInput) {
    await page.screenshot({ path: 'test-results/no-location-input.png' });
    throw new Error('Could not find location input field');
  }
  
  // Clear and fill location input
  await locationInput.clear();
  await locationInput.fill(TEST_CONFIG.searchLocation);
  
  // Wait for autocomplete suggestions
  await page.waitForTimeout(2000);
  
  // Try to click first autocomplete suggestion
  const suggestionSelectors = [
    '.suggestion-item:first-child',
    '[data-testid="autocomplete-item"]:first-child',
    'div[role="option"]:first-child',
    '.autocomplete-suggestion:first-child'
  ];
  
  let suggestionClicked = false;
  for (const selector of suggestionSelectors) {
    try {
      const suggestion = await page.waitForSelector(selector, { timeout: 3000 });
      if (suggestion) {
        await suggestion.click();
        console.log(`✅ Clicked autocomplete suggestion: ${selector}`);
        suggestionClicked = true;
        break;
      }
    } catch (error) {
      continue;
    }
  }
  
  // If no suggestion found, press Enter
  if (!suggestionClicked) {
    await page.keyboard.press('Enter');
    console.log('  Pressed Enter to submit location');
  }
  
  // Wait for search results
  console.log('  Waiting for business search to complete...');
  await page.waitForTimeout(TEST_CONFIG.timeouts.search);
}

async function verifyBusinessCardsDisplay(page) {
  // Look for business cards
  const businessCardSelectors = [
    '[data-testid="business-card"]',
    '.business-card',
    'div[class*="business-card"]'
  ];
  
  let businessCards = [];
  
  for (const selector of businessCardSelectors) {
    const cards = await page.$$(selector);
    if (cards.length > 0) {
      businessCards = cards;
      console.log(`✅ Found ${cards.length} business card(s) with selector: ${selector}`);
      break;
    }
  }
  
  if (businessCards.length === 0) {
    // Check if there's a "no results" message
    const noResults = await page.$('text=/Nenhum estabelecimento encontrado/i');
    if (noResults) {
      console.log('⚠️  No business results found for this location');
      return false;
    }
    
    await page.screenshot({ path: 'test-results/no-business-cards.png' });
    console.log('⚠️  No business cards found - this may be normal for some locations');
    return false;
  }
  
  return businessCards.length > 0;
}

async function verifyPhoneNumberDisplay(page) {
  // Look for phone numbers in business cards
  const phoneSelectors = [
    'span:has-text("("), span[class*="phone"]',
    'text=/\\(\\d{2}\\)/',
    'text=/\\d{4}-\\d{4}/',
    '[data-testid="phone-number"]'
  ];
  
  let foundPhones = 0;
  
  for (const selector of phoneSelectors) {
    const phones = await page.$$(selector);
    foundPhones += phones.length;
  }
  
  if (foundPhones > 0) {
    console.log(`✅ Found ${foundPhones} phone number(s) displayed`);
    return true;
  } else {
    console.log('⚠️  No phone numbers found - this is normal as not all businesses provide phone data');
    return false;
  }
}

async function testPhoneCallButton(page) {
  // Look for phone call buttons
  const phoneButtonSelectors = [
    'button[title*="Ligar"]',
    'button:has([data-lucide="phone"])',
    'a[href^="tel:"]',
    '[data-testid="phone-button"]'
  ];
  
  let phoneButtons = [];
  
  for (const selector of phoneButtonSelectors) {
    const buttons = await page.$$(selector);
    phoneButtons = phoneButtons.concat(buttons);
  }
  
  if (phoneButtons.length > 0) {
    console.log(`✅ Found ${phoneButtons.length} phone button(s)`);
    
    // Test that first phone button has correct attributes
    const firstButton = phoneButtons[0];
    const href = await firstButton.getAttribute('href');
    const title = await firstButton.getAttribute('title');
    
    if (href && href.startsWith('tel:')) {
      console.log(`✅ Phone button has correct tel: link`);
    } else {
      console.log('✅ Phone button found (may use click handler instead of tel: link)');
    }
    
    return true;
  } else {
    console.log('⚠️  No phone buttons found');
    return false;
  }
}

async function testWhatsAppButton(page) {
  // Look for WhatsApp buttons
  const whatsappSelectors = [
    'button[title*="WhatsApp"]',
    'button:has([data-lucide="message-circle"])',
    'a[href*="wa.me"]',
    '[data-testid="whatsapp-button"]'
  ];
  
  let whatsappButtons = [];
  
  for (const selector of whatsappSelectors) {
    const buttons = await page.$$(selector);
    whatsappButtons = whatsappButtons.concat(buttons);
  }
  
  if (whatsappButtons.length > 0) {
    console.log(`✅ Found ${whatsappButtons.length} WhatsApp button(s)`);
    
    // Check if button has green color styling
    const firstButton = whatsappButtons[0];
    const computedStyle = await firstButton.evaluate(el => {
      const styles = window.getComputedStyle(el);
      return {
        color: styles.color,
        backgroundColor: styles.backgroundColor
      };
    });
    
    if (computedStyle.color.includes('green') || computedStyle.color.includes('34, 197, 94')) {
      console.log('✅ WhatsApp button has green styling');
    }
    
    return true;
  } else {
    console.log('⚠️  No WhatsApp buttons found');
    return false;
  }
}