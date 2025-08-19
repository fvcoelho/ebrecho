// Playwright configuration for eBrecho E2E tests
module.exports = {
  testDir: './tests/e2e',
  
  // Browser configuration
  use: {
    // Set headless to false for visual debugging
    headless: false,
    
    // Browser viewport
    viewport: { width: 1280, height: 720 },
    
    // Base URL for tests
    baseURL: 'http://localhost:3000',
    
    // Screenshots and videos
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Timeout settings
    actionTimeout: 10000,
    navigationTimeout: 30000,
  },

  // Global timeout settings
  timeout: 60000,
  expect: {
    timeout: 10000,
  },

  // Test configuration
  testMatch: '**/*.playwright.js',
  
  // Reporter
  reporter: [
    ['list'],
    ['html', { outputFolder: 'test-results/html-report' }]
  ],

  // Output directory
  outputDir: 'test-results',
  
  // Projects configuration (optional - can test multiple browsers)
  projects: [
    {
      name: 'chromium',
      use: { 
        ...require('@playwright/test').devices['Desktop Chrome'],
        headless: false 
      },
    },
  ],

  // Web server configuration (if needed to start dev server)
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
};