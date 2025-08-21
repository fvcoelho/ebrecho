const { test, expect } = require('@playwright/test');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  promoterCredentials: {
    email: 'fvcoelho@gmail.com',
    password: 'senha123'
  }
};

// Test data for configuration forms
const TEST_DATA = {
  profile: {
    name: 'João Silva Promotor',
    phone: '(11) 99999-9999',
    bio: 'Promotor experiente em moda sustentável e brechós. Especialista em conectar pessoas que querem vender suas peças com compradores conscientes.'
  },
  payment: {
    pix: 'joao.silva@email.com',
    bank: 'Banco do Brasil',
    agency: '1234',
    account: '56789-0'
  },
  security: {
    currentPassword: 'senha123',
    newPassword: 'novasenha123',
    confirmPassword: 'novasenha123'
  }
};

test.describe('Promoter Configuration Page E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Set up page with longer timeouts for local development
    page.setDefaultTimeout(30000);
    
    // Login as promoter before each test
    await page.goto(`${TEST_CONFIG.baseUrl}/login`);
    await page.locator('input[type="email"]').fill(TEST_CONFIG.promoterCredentials.email);
    await page.locator('input[type="password"]').fill(TEST_CONFIG.promoterCredentials.password);
    await page.locator('button:has-text("Entrar")').click();
    
    // Wait for redirect to promoter dashboard
    await page.waitForURL('**/promoter', { timeout: 15000 });
  });

  test('should display promoter configuration page with correct structure and elements', async ({ page }) => {
    console.log('🚀 Testing promoter configuration page structure...');
    
    // Navigate to configuration page via sidebar
    await page.locator('button:has-text("Configurações")').first().click();
    
    // Wait for navigation to configuration page
    await page.waitForURL('**/promoter/configuracoes', { timeout: 10000 });
    
    // Verify page title and header
    await expect(page.locator('h1:has-text("Configurações")')).toBeVisible();
    await expect(page.locator('text=Gerencie suas preferências e informações de promotor')).toBeVisible();
    
    // Verify all configuration sections are present
    await expect(page.locator('text=Perfil de Promotor').first()).toBeVisible();
    await expect(page.locator('text=Notificações').first()).toBeVisible();
    await expect(page.locator('text=Informações de Pagamento').first()).toBeVisible();
    await expect(page.locator('text=Segurança').first()).toBeVisible();
    
    // Take screenshot of configuration page
    await page.screenshot({ path: 'test-results/promoter-config-01-page-structure.png' });
    
    console.log('✅ Configuration page structure test passed');
  });

  test('should display profile form with user data pre-populated', async ({ page }) => {
    console.log('🚀 Testing profile form display and data...');
    
    // Navigate to configuration page
    await page.locator('button:has-text("Configurações")').first().click();
    await page.waitForURL('**/promoter/configuracoes', { timeout: 10000 });
    
    // Verify profile form elements
    const nameInput = page.locator('input[id="name"]');
    const emailInput = page.locator('input[id="email"]');
    const phoneInput = page.locator('input[id="phone"]');
    const bioTextarea = page.locator('textarea[id="bio"]');
    
    await expect(nameInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    await expect(phoneInput).toBeVisible();
    await expect(bioTextarea).toBeVisible();
    
    // Verify email field is disabled (read-only)
    await expect(emailInput).toBeDisabled();
    
    // Verify email is pre-populated with user email
    await expect(emailInput).toHaveValue(TEST_CONFIG.promoterCredentials.email);
    
    // Verify profile save button is present (can be either text based on promoter state)
    const saveButton = page.locator('button:has-text("Salvar Alterações")').or(page.locator('button:has-text("Candidatar-se a Promotor")'));
    await expect(saveButton).toBeVisible();
    
    console.log('✅ Profile form display test passed');
  });

  test('should handle profile form filling and submission', async ({ page }) => {
    console.log('🚀 Testing profile form functionality...');
    
    // Navigate to configuration page
    await page.locator('button:has-text("Configurações")').first().click();
    await page.waitForURL('**/promoter/configuracoes', { timeout: 10000 });
    
    // Fill profile form with new fields
    await page.locator('input[id="name"]').clear();
    await page.locator('input[id="name"]').fill(TEST_DATA.profile.name);
    
    await page.locator('input[id="phone"]').clear();
    await page.locator('input[id="phone"]').fill(TEST_DATA.profile.phone);
    
    await page.locator('input[id="businessName"]').clear();
    await page.locator('input[id="businessName"]').fill('Moda Sustentável Brasil');
    
    await page.locator('input[id="territory"]').clear();
    await page.locator('input[id="territory"]').fill('São Paulo - SP');
    
    await page.locator('textarea[id="bio"]').clear();
    await page.locator('textarea[id="bio"]').fill(TEST_DATA.profile.bio);
    
    // Take screenshot of filled form
    await page.screenshot({ path: 'test-results/promoter-config-02-profile-filled.png' });
    
    // Submit profile form
    await page.locator('button:has-text("Salvar Alterações")').click();
    
    // Wait for loading to complete
    await page.waitForTimeout(2000);
    
    // Verify form values persist after submission
    await expect(page.locator('input[id="name"]')).toHaveValue(TEST_DATA.profile.name);
    await expect(page.locator('input[id="phone"]')).toHaveValue(TEST_DATA.profile.phone);
    await expect(page.locator('textarea[id="bio"]')).toHaveValue(TEST_DATA.profile.bio);
    
    console.log('✅ Profile form functionality test passed');
  });

  test('should handle notification settings toggles', async ({ page }) => {
    console.log('🚀 Testing notification settings...');
    
    // Navigate to configuration page
    await page.locator('button:has-text("Configurações")').first().click();
    await page.waitForURL('**/promoter/configuracoes', { timeout: 10000 });
    
    // Verify notification checkboxes are present
    const newPartnerCheckbox = page.locator('[role="checkbox"]').nth(0);
    const newSaleCheckbox = page.locator('[role="checkbox"]').nth(1);
    const commissionCheckbox = page.locator('[role="checkbox"]').nth(2);
    const eventsCheckbox = page.locator('[role="checkbox"]').nth(3);
    
    // Verify initial states (based on component default values)
    await expect(newPartnerCheckbox).toBeChecked();
    await expect(newSaleCheckbox).toBeChecked();
    await expect(commissionCheckbox).toBeChecked();
    await expect(eventsCheckbox).not.toBeChecked();
    
    // Toggle notification settings
    await newPartnerCheckbox.click();
    await eventsCheckbox.click();
    
    // Verify state changes
    await expect(newPartnerCheckbox).not.toBeChecked();
    await expect(eventsCheckbox).toBeChecked();
    
    // Test the save notifications button
    await page.locator('button:has-text("Salvar Notificações")').click();
    
    // Wait for loading to complete
    await page.waitForTimeout(2000);
    
    // Take screenshot of notification settings
    await page.screenshot({ path: 'test-results/promoter-config-03-notifications.png' });
    
    console.log('✅ Notification settings test passed');
  });

  test('should handle payment information form', async ({ page }) => {
    console.log('🚀 Testing payment information form...');
    
    // Navigate to configuration page
    await page.locator('button:has-text("Configurações")').first().click();
    await page.waitForURL('**/promoter/configuracoes', { timeout: 10000 });
    
    // Fill payment information
    await page.locator('input[id="pix"]').fill(TEST_DATA.payment.pix);
    await page.locator('input[id="bank"]').fill(TEST_DATA.payment.bank);
    await page.locator('input[id="agency"]').fill(TEST_DATA.payment.agency);
    await page.locator('input[id="account"]').fill(TEST_DATA.payment.account);
    
    // Take screenshot of filled payment form
    await page.screenshot({ path: 'test-results/promoter-config-04-payment-filled.png' });
    
    // Submit payment form
    await page.locator('button:has-text("Salvar Dados Bancários")').click();
    
    // Verify form values persist
    await expect(page.locator('input[id="pix"]')).toHaveValue(TEST_DATA.payment.pix);
    await expect(page.locator('input[id="bank"]')).toHaveValue(TEST_DATA.payment.bank);
    await expect(page.locator('input[id="agency"]')).toHaveValue(TEST_DATA.payment.agency);
    await expect(page.locator('input[id="account"]')).toHaveValue(TEST_DATA.payment.account);
    
    console.log('✅ Payment information form test passed');
  });

  test('should handle security settings form', async ({ page }) => {
    console.log('🚀 Testing security settings form...');
    
    // Navigate to configuration page
    await page.locator('button:has-text("Configurações")').first().click();
    await page.waitForURL('**/promoter/configuracoes', { timeout: 10000 });
    
    // Fill security form
    await page.locator('input[id="current-password"]').fill(TEST_DATA.security.currentPassword);
    await page.locator('input[id="new-password"]').fill(TEST_DATA.security.newPassword);
    await page.locator('input[id="confirm-password"]').fill(TEST_DATA.security.confirmPassword);
    
    // Verify password fields are properly masked
    await expect(page.locator('input[id="current-password"]')).toHaveAttribute('type', 'password');
    await expect(page.locator('input[id="new-password"]')).toHaveAttribute('type', 'password');
    await expect(page.locator('input[id="confirm-password"]')).toHaveAttribute('type', 'password');
    
    // Take screenshot of security form
    await page.screenshot({ path: 'test-results/promoter-config-05-security.png' });
    
    // Submit security form
    await page.locator('button:has-text("Alterar Senha")').click();
    
    console.log('✅ Security settings form test passed');
  });

  test('should test responsive design on different screen sizes', async ({ page }) => {
    console.log('🚀 Testing responsive design...');
    
    // Navigate to configuration page
    await page.locator('button:has-text("Configurações")').first().click();
    await page.waitForURL('**/promoter/configuracoes', { timeout: 10000 });
    
    // Test desktop view (default)
    await page.screenshot({ path: 'test-results/promoter-config-06-desktop.png' });
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000); // Allow for reflow
    await page.screenshot({ path: 'test-results/promoter-config-07-tablet.png' });
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000); // Allow for reflow
    await page.screenshot({ path: 'test-results/promoter-config-08-mobile.png' });
    
    // Verify main elements are still visible on mobile
    await expect(page.locator('h1:has-text("Configurações")')).toBeVisible();
    await expect(page.locator('text=Perfil de Promotor').first()).toBeVisible();
    await expect(page.locator('input[id="name"]')).toBeVisible();
    
    // Reset to desktop view
    await page.setViewportSize({ width: 1280, height: 720 });
    
    console.log('✅ Responsive design test passed');
  });

  test('should verify navigation and accessibility', async ({ page }) => {
    console.log('🚀 Testing navigation and accessibility...');
    
    // Navigate to configuration page
    await page.locator('button:has-text("Configurações")').first().click();
    await page.waitForURL('**/promoter/configuracoes', { timeout: 10000 });
    
    // Test navigation back to dashboard
    await page.locator('button:has-text("Painel Geral")').first().click();
    await page.waitForURL('**/promoter', { timeout: 10000 });
    await expect(page.locator('h1:has-text("Bem-vindo")')).toBeVisible();
    
    // Navigate back to configuration
    await page.locator('button:has-text("Configurações")').first().click();
    await page.waitForURL('**/promoter/configuracoes', { timeout: 10000 });
    
    // Test keyboard navigation (Tab through form elements)
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    // Verify form labels are properly associated with inputs
    await expect(page.locator('label[for="name"]')).toBeVisible();
    await expect(page.locator('label[for="email"]')).toBeVisible();
    await expect(page.locator('label[for="phone"]')).toBeVisible();
    await expect(page.locator('label[for="bio"]')).toBeVisible();
    
    console.log('✅ Navigation and accessibility test passed');
  });

  test('should test authentication protection for configuration page', async ({ page }) => {
    console.log('🚀 Testing authentication protection...');
    
    // First, navigate to configuration page while logged in
    await page.locator('button:has-text("Configurações")').first().click();
    await page.waitForURL('**/promoter/configuracoes', { timeout: 10000 });
    await expect(page.locator('h1:has-text("Configurações")')).toBeVisible();
    
    // Logout
    await page.locator('button:has-text("Sair")').click();
    await page.waitForURL('**/', { timeout: 10000 });
    
    // Try to access configuration page directly without authentication
    await page.goto(`${TEST_CONFIG.baseUrl}/promoter/configuracoes`);
    
    // Should be redirected to login page
    await page.waitForURL('**/login', { timeout: 10000 });
    await expect(page.locator('h1:has-text("Seja bem-vindo novamente")')).toBeVisible();
    
    console.log('✅ Authentication protection test passed');
  });

  test('should test form validation and error handling', async ({ page }) => {
    console.log('🚀 Testing form validation...');
    
    // Navigate to configuration page
    await page.locator('button:has-text("Configurações")').first().click();
    await page.waitForURL('**/promoter/configuracoes', { timeout: 10000 });
    
    // Test empty form submission for profile
    await page.locator('input[id="name"]').clear();
    await page.locator('button:has-text("Salvar Alterações")').click();
    
    // Test phone number format validation
    await page.locator('input[id="phone"]').fill('invalid-phone');
    await page.locator('button:has-text("Salvar Alterações")').click();
    
    // Test security form with mismatched passwords
    await page.locator('input[id="current-password"]').fill('senha123');
    await page.locator('input[id="new-password"]').fill('novasenha123');
    await page.locator('input[id="confirm-password"]').fill('senhadiferente');
    await page.locator('button:has-text("Alterar Senha")').click();
    
    // Take screenshot of validation states
    await page.screenshot({ path: 'test-results/promoter-config-09-validation.png' });
    
    console.log('✅ Form validation test passed');
  });

  test('should test all shadcn/ui components render correctly', async ({ page }) => {
    console.log('🚀 Testing shadcn/ui components...');
    
    // Navigate to configuration page
    await page.locator('button:has-text("Configurações")').first().click();
    await page.waitForURL('**/promoter/configuracoes', { timeout: 10000 });
    
    // Verify all 4 main configuration sections exist
    await expect(page.locator('text=Perfil de Promotor').first()).toBeVisible();
    await expect(page.locator('text=Notificações').first()).toBeVisible();
    await expect(page.locator('text=Informações de Pagamento').first()).toBeVisible();
    await expect(page.locator('text=Segurança').first()).toBeVisible();
    
    // Verify Input components
    const inputs = page.locator('input');
    const inputCount = await inputs.count();
    expect(inputCount).toBeGreaterThan(5);
    
    // Verify Label components
    const labels = page.locator('label');
    const labelCount = await labels.count();
    expect(labelCount).toBeGreaterThan(5);
    
    // Verify Textarea component
    await expect(page.locator('textarea')).toBeVisible();
    
    // Verify Checkbox components
    const checkboxes = page.locator('[role="checkbox"]');
    await expect(checkboxes).toHaveCount(4); // 4 notification settings
    
    // Verify Button components
    const buttons = page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(3); // Save buttons + navigation
    
    // Test button interactions
    await page.hover('button:has-text("Salvar Alterações")');
    await page.hover('button:has-text("Salvar Dados Bancários")');
    await page.hover('button:has-text("Alterar Senha")');
    
    console.log('✅ shadcn/ui components test passed');
  });
});