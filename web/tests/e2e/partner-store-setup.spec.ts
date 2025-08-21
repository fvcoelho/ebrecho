import { test, expect, Page } from '@playwright/test';

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:3000',
  partnerCredentials: {
    email: 'fvcoelho@me.com',
    password: 'senha123'
  },
  timeout: 30000
};

// Page Object Model for Store Setup Page
class StoreSetupPage {
  constructor(private page: Page) {}

  // Navigation
  async goto() {
    await this.page.goto(`${TEST_CONFIG.baseUrl}/setup-loja`);
  }

  // Selectors
  get heading() { return this.page.locator('h1:has-text("Configure sua Loja")'); }
  get pageDescription() { return this.page.locator('text=Complete as informações da sua loja para começar a vender no eBrecho'); }
  
  // Store Information Section
  get storeNameInput() { return this.page.locator('#name'); }
  get storeEmailInput() { return this.page.locator('#email'); }
  get phoneInput() { return this.page.locator('#phone'); }
  get documentTypeSelect() { return this.page.locator('#documentType'); }
  get documentInput() { return this.page.locator('#document'); }
  get descriptionTextarea() { return this.page.locator('#description'); }
  get hasPhysicalStoreCheckbox() { return this.page.locator('#hasPhysicalStore'); }

  // Address Section (conditional)
  get streetInput() { return this.page.locator('#street'); }
  get numberInput() { return this.page.locator('#number'); }
  get complementInput() { return this.page.locator('#complement'); }
  get neighborhoodInput() { return this.page.locator('#neighborhood'); }
  get cityInput() { return this.page.locator('#city'); }
  get stateInput() { return this.page.locator('#state'); }
  get zipCodeInput() { return this.page.locator('#zipCode'); }

  // Actions
  get backButton() { return this.page.locator('button:has-text("Voltar")'); }
  get submitButton() { return this.page.locator('button:has-text("Completar Cadastro")'); }
  
  // Error and Success Messages
  get errorMessage() { return this.page.locator('.bg-red-50 .text-red-600'); }
  get loadingMessage() { return this.page.locator('button:has-text("Salvando...")'); }

  // Helper methods
  async fillStoreInformation(data: {
    name: string;
    email: string;
    phone: string;
    documentType: 'CNPJ' | 'CPF';
    document: string;
    description?: string;
  }) {
    await this.storeNameInput.fill(data.name);
    await this.storeEmailInput.fill(data.email);
    await this.phoneInput.fill(data.phone);
    await this.documentTypeSelect.selectOption(data.documentType);
    await this.documentInput.fill(data.document);
    if (data.description) {
      await this.descriptionTextarea.fill(data.description);
    }
  }

  async fillAddress(data: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
  }) {
    await this.streetInput.fill(data.street);
    await this.numberInput.fill(data.number);
    if (data.complement) {
      await this.complementInput.fill(data.complement);
    }
    await this.neighborhoodInput.fill(data.neighborhood);
    await this.cityInput.fill(data.city);
    await this.stateInput.fill(data.state);
    await this.zipCodeInput.fill(data.zipCode);
  }

  async setPhysicalStore(hasPhysicalStore: boolean) {
    if (hasPhysicalStore !== await this.hasPhysicalStoreCheckbox.isChecked()) {
      await this.hasPhysicalStoreCheckbox.click();
    }
  }

  async submitForm() {
    await this.submitButton.click();
  }
}

// Page Object Model for Store Configuration Page
class StoreConfigPage {
  constructor(private page: Page) {}

  // Navigation
  async goto() {
    await this.page.goto(`${TEST_CONFIG.baseUrl}/dashboard/configuracoes`);
  }

  // Selectors
  get heading() { return this.page.locator('h1:has-text("Configurações da Loja")'); }
  get pageDescription() { return this.page.locator('text=Gerencie as informações da sua loja e configurações de vitrine pública'); }
  
  // Store Information Section
  get storeNameInput() { return this.page.locator('#name'); }
  get storeEmailInput() { return this.page.locator('#email'); }
  get phoneInput() { return this.page.locator('#phone'); }
  get whatsappInput() { return this.page.locator('#whatsappNumber'); }
  get pixKeyInput() { return this.page.locator('#pixKey'); }
  get documentTypeSelect() { return this.page.locator('#documentType'); }
  get documentInput() { return this.page.locator('#document'); }
  get descriptionTextarea() { return this.page.locator('#description'); }
  get hasPhysicalStoreCheckbox() { return this.page.locator('#hasPhysicalStore'); }

  // Address Section
  get streetInput() { return this.page.locator('#street'); }
  get numberInput() { return this.page.locator('#number'); }
  get complementInput() { return this.page.locator('#complement'); }
  get neighborhoodInput() { return this.page.locator('#neighborhood'); }
  get cityInput() { return this.page.locator('#city'); }
  get stateInput() { return this.page.locator('#state'); }
  get zipCodeInput() { return this.page.locator('#zipCode'); }

  // Public Storefront Section
  get slugInput() { return this.page.locator('#slug'); }
  get publicDescriptionTextarea() { return this.page.locator('#publicDescription'); }
  get isPublicActiveCheckbox() { return this.page.locator('#isPublicActive'); }
  get storeUrlPreview() { return this.page.locator('text=ebrecho.com.br/'); }

  // Logo Upload Section
  get logoUploadButton() { return this.page.locator('button:has-text("Selecionar Logo")'); }
  get logoPreview() { return this.page.locator('img[alt*="logo"], img[alt*="Logo"]'); }
  get logoFileInput() { return this.page.locator('input[type="file"][accept*="image"]'); }

  // Actions
  get cancelButton() { return this.page.locator('button:has-text("Cancelar")'); }
  get saveButton() { return this.page.locator('button:has-text("Salvar Configurações")'); }
  
  // Messages
  get errorMessage() { return this.page.locator('.bg-red-50 .text-red-600'); }
  get successMessage() { return this.page.locator('.bg-green-50 .text-green-600'); }
  get slugError() { return this.page.locator('.text-red-600:near(#slug)'); }
  get loadingSpinner() { return this.page.locator('.animate-spin'); }

  // Helper methods
  async updateStoreInformation(data: Partial<{
    name: string;
    email: string;
    phone: string;
    whatsapp: string;
    pixKey: string;
    description: string;
  }>) {
    if (data.name !== undefined) await this.storeNameInput.fill(data.name);
    if (data.email !== undefined) await this.storeEmailInput.fill(data.email);
    if (data.phone !== undefined) await this.phoneInput.fill(data.phone);
    if (data.whatsapp !== undefined) await this.whatsappInput.fill(data.whatsapp);
    if (data.pixKey !== undefined) await this.pixKeyInput.fill(data.pixKey);
    if (data.description !== undefined) await this.descriptionTextarea.fill(data.description);
  }

  async updatePublicStorefront(data: Partial<{
    slug: string;
    publicDescription: string;
    isActive: boolean;
  }>) {
    if (data.slug !== undefined) await this.slugInput.fill(data.slug);
    if (data.publicDescription !== undefined) await this.publicDescriptionTextarea.fill(data.publicDescription);
    if (data.isActive !== undefined) {
      const isChecked = await this.isPublicActiveCheckbox.isChecked();
      if (isChecked !== data.isActive) {
        await this.isPublicActiveCheckbox.click();
      }
    }
  }

  async saveChanges() {
    await this.saveButton.click();
  }
}

// Common helper for partner login
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
    
    // Wait for redirect to dashboard
    await this.page.waitForURL('**/dashboard', { timeout: 15000 });
    
    // Verify partner dashboard elements
    await expect(this.page.locator('h1:has-text("FABIO VARGAS COELHO")')).toBeVisible();
    await expect(this.page.locator('text=PARTNER_ADMIN')).toBeVisible();
    
    console.log('✅ Partner login successful');
  }
}

test.describe('Partner Store Setup and Configuration E2E Tests', () => {
  let loginHelper: LoginHelper;
  let storeSetupPage: StoreSetupPage;
  let storeConfigPage: StoreConfigPage;

  test.beforeEach(async ({ page }) => {
    // Set up page with longer timeouts for local development
    page.setDefaultTimeout(TEST_CONFIG.timeout);
    
    // Initialize page objects
    loginHelper = new LoginHelper(page);
    storeSetupPage = new StoreSetupPage(page);
    storeConfigPage = new StoreConfigPage(page);
  });

  test.describe('Store Setup Wizard', () => {
    test('should successfully complete store setup with physical address', async ({ page }) => {
      console.log('🏪 Testing complete store setup wizard with physical address');

      // Step 1: Login as partner
      await loginHelper.loginAsPartner();
      await page.screenshot({ path: 'test-results/store-setup-01-login.png' });

      // Step 2: Navigate to store setup
      console.log('📍 Navigating to store setup page...');
      await storeSetupPage.goto();
      
      // Verify page loaded correctly
      await expect(storeSetupPage.heading).toBeVisible();
      await expect(storeSetupPage.pageDescription).toBeVisible();
      await page.screenshot({ path: 'test-results/store-setup-02-setup-page.png' });

      // Step 3: Fill store information
      console.log('📝 Filling store information...');
      const storeData = {
        name: 'Brechó Teste E2E',
        email: 'teste@example.com',
        phone: '(11) 99999-9999',
        documentType: 'CNPJ' as const,
        document: '12.345.678/0001-90',
        description: 'Loja de testes para E2E'
      };

      await storeSetupPage.fillStoreInformation(storeData);
      
      // Verify physical store checkbox is checked by default
      await expect(storeSetupPage.hasPhysicalStoreCheckbox).toBeChecked();
      
      // Step 4: Fill address information
      console.log('🏠 Filling address information...');
      const addressData = {
        street: 'Rua dos Testes',
        number: '123',
        complement: 'Sala 101',
        neighborhood: 'Centro',
        city: 'São Paulo',
        state: 'SP',
        zipCode: '01234-567'
      };

      await storeSetupPage.fillAddress(addressData);
      await page.screenshot({ path: 'test-results/store-setup-03-form-filled.png' });

      // Step 5: Submit form
      console.log('✅ Submitting store setup form...');
      await storeSetupPage.submitForm();

      // Step 6: Verify redirect to dashboard
      console.log('⏳ Waiting for redirect to dashboard...');
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      
      // Verify we're back at the dashboard
      await expect(page.locator('h1:has-text("FABIO VARGAS COELHO")')).toBeVisible();
      await page.screenshot({ path: 'test-results/store-setup-04-dashboard.png' });

      console.log('✅ Store setup completed successfully');
    });

    test('should successfully complete store setup without physical address', async ({ page }) => {
      console.log('🌐 Testing store setup without physical address');

      // Login and navigate to setup
      await loginHelper.loginAsPartner();
      await storeSetupPage.goto();

      // Fill store information
      const storeData = {
        name: 'Loja Online E2E',
        email: 'online@example.com',
        phone: '(11) 88888-8888',
        documentType: 'CPF' as const,
        document: '123.456.789-09',
        description: 'Loja online apenas'
      };

      await storeSetupPage.fillStoreInformation(storeData);
      
      // Uncheck physical store
      await storeSetupPage.setPhysicalStore(false);
      
      // Verify address section is hidden
      await expect(storeSetupPage.streetInput).not.toBeVisible();
      
      // Submit form
      await storeSetupPage.submitForm();
      
      // Verify redirect
      await page.waitForURL('**/dashboard', { timeout: 15000 });
      await expect(page.locator('h1:has-text("FABIO VARGAS COELHO")')).toBeVisible();

      console.log('✅ Online-only store setup completed successfully');
    });

    test('should validate required fields in store setup', async ({ page }) => {
      console.log('🔍 Testing store setup form validation');

      await loginHelper.loginAsPartner();
      await storeSetupPage.goto();

      // Try to submit empty form
      await storeSetupPage.submitForm();
      
      // Check that form doesn't submit (we should still be on setup page)
      await expect(storeSetupPage.heading).toBeVisible();
      
      // Fill only name and submit
      await storeSetupPage.storeNameInput.fill('Test Store');
      await storeSetupPage.submitForm();
      
      // Should still be on setup page due to validation
      await expect(storeSetupPage.heading).toBeVisible();

      console.log('✅ Form validation working correctly');
    });

    test('should validate document numbers (CNPJ/CPF)', async ({ page }) => {
      console.log('📋 Testing document validation');

      await loginHelper.loginAsPartner();
      await storeSetupPage.goto();

      // Test invalid CNPJ
      await storeSetupPage.documentTypeSelect.selectOption('CNPJ');
      await storeSetupPage.documentInput.fill('11.111.111/1111-11');
      
      // Fill other required fields
      await storeSetupPage.storeNameInput.fill('Test Store');
      await storeSetupPage.storeEmailInput.fill('test@example.com');
      await storeSetupPage.phoneInput.fill('(11) 99999-9999');
      
      // Try to submit with invalid CNPJ
      await storeSetupPage.submitForm();
      
      // Should see error message
      await expect(storeSetupPage.errorMessage).toBeVisible();
      await expect(storeSetupPage.errorMessage).toContainText('CNPJ inválido');

      console.log('✅ Document validation working correctly');
    });
  });

  test.describe('Store Configuration', () => {
    test.beforeEach(async ({ page }) => {
      // Ensure partner is logged in before each config test
      await loginHelper.loginAsPartner();
    });

    test('should load existing store configuration', async ({ page }) => {
      console.log('📋 Testing store configuration page load');

      // Navigate to configuration page
      await storeConfigPage.goto();
      
      // Wait for page to load
      await expect(storeConfigPage.heading).toBeVisible();
      await expect(storeConfigPage.pageDescription).toBeVisible();
      
      // Verify form fields are populated (assuming store setup was completed)
      await expect(storeConfigPage.storeNameInput).not.toHaveValue('');
      await expect(storeConfigPage.storeEmailInput).not.toHaveValue('');
      
      await page.screenshot({ path: 'test-results/store-config-01-loaded.png' });

      console.log('✅ Store configuration loaded successfully');
    });

    test('should update store information successfully', async ({ page }) => {
      console.log('📝 Testing store information update');

      await storeConfigPage.goto();
      
      // Wait for loading to complete
      await expect(storeConfigPage.loadingSpinner).not.toBeVisible({ timeout: 10000 });
      
      // Update store information
      const updates = {
        name: 'Loja Atualizada E2E',
        phone: '(11) 77777-7777',
        whatsapp: '(11) 66666-6666',
        pixKey: 'pix@example.com',
        description: 'Descrição atualizada para testes'
      };

      await storeConfigPage.updateStoreInformation(updates);
      await page.screenshot({ path: 'test-results/store-config-02-updated.png' });

      // Save changes
      await storeConfigPage.saveChanges();
      
      // Wait for success message
      await expect(storeConfigPage.successMessage).toBeVisible({ timeout: 10000 });
      await expect(storeConfigPage.successMessage).toContainText('Configurações atualizadas com sucesso');
      
      await page.screenshot({ path: 'test-results/store-config-03-saved.png' });

      console.log('✅ Store information updated successfully');
    });

    test('should update public storefront settings', async ({ page }) => {
      console.log('🌐 Testing public storefront settings update');

      await storeConfigPage.goto();
      
      // Wait for loading
      await expect(storeConfigPage.loadingSpinner).not.toBeVisible({ timeout: 10000 });

      // Update public storefront settings
      const timestamp = Date.now();
      const publicSettings = {
        slug: `loja-teste-${timestamp}`,
        publicDescription: 'Esta é uma loja de testes para E2E automation',
        isActive: true
      };

      await storeConfigPage.updatePublicStorefront(publicSettings);
      
      // Verify slug URL preview appears
      await expect(storeConfigPage.storeUrlPreview).toBeVisible();
      
      // Save changes
      await storeConfigPage.saveChanges();
      
      // Wait for success
      await expect(storeConfigPage.successMessage).toBeVisible({ timeout: 10000 });

      console.log('✅ Public storefront settings updated successfully');
    });

    test('should validate slug format and reserved words', async ({ page }) => {
      console.log('🔍 Testing slug validation');

      await storeConfigPage.goto();
      await expect(storeConfigPage.loadingSpinner).not.toBeVisible({ timeout: 10000 });

      // Test invalid slug with special characters
      await storeConfigPage.slugInput.fill('invalid-slug@#$');
      await expect(storeConfigPage.slugError).toBeVisible();
      
      // Test reserved word
      await storeConfigPage.slugInput.fill('admin');
      await expect(storeConfigPage.slugError).toBeVisible();
      await expect(storeConfigPage.slugError).toContainText('reservado');
      
      // Test valid slug
      await storeConfigPage.slugInput.fill('minha-loja-valida');
      await expect(storeConfigPage.slugError).not.toBeVisible();

      console.log('✅ Slug validation working correctly');
    });

    test('should toggle physical store address section', async ({ page }) => {
      console.log('🏠 Testing physical store toggle');

      await storeConfigPage.goto();
      await expect(storeConfigPage.loadingSpinner).not.toBeVisible({ timeout: 10000 });

      // If physical store is currently enabled, toggle it off
      const isPhysicalStoreChecked = await storeConfigPage.hasPhysicalStoreCheckbox.isChecked();
      
      if (isPhysicalStoreChecked) {
        await storeConfigPage.hasPhysicalStoreCheckbox.click();
        
        // Address fields should be hidden
        await expect(storeConfigPage.streetInput).not.toBeVisible();
        
        // Toggle back on
        await storeConfigPage.hasPhysicalStoreCheckbox.click();
        
        // Address fields should be visible again
        await expect(storeConfigPage.streetInput).toBeVisible();
      }

      console.log('✅ Physical store toggle working correctly');
    });

    test('should persist form data after page reload', async ({ page }) => {
      console.log('💾 Testing data persistence');

      await storeConfigPage.goto();
      await expect(storeConfigPage.loadingSpinner).not.toBeVisible({ timeout: 10000 });

      // Get current values
      const originalName = await storeConfigPage.storeNameInput.inputValue();
      const originalEmail = await storeConfigPage.storeEmailInput.inputValue();

      // Make changes
      const newName = 'Teste Persistência';
      await storeConfigPage.storeNameInput.fill(newName);
      await storeConfigPage.saveChanges();
      
      // Wait for success
      await expect(storeConfigPage.successMessage).toBeVisible({ timeout: 10000 });

      // Reload page
      await page.reload();
      await expect(storeConfigPage.loadingSpinner).not.toBeVisible({ timeout: 10000 });

      // Verify data persisted
      await expect(storeConfigPage.storeNameInput).toHaveValue(newName);
      await expect(storeConfigPage.storeEmailInput).toHaveValue(originalEmail);

      console.log('✅ Data persistence verified');
    });

    test('should handle form validation errors gracefully', async ({ page }) => {
      console.log('❌ Testing error handling');

      await storeConfigPage.goto();
      await expect(storeConfigPage.loadingSpinner).not.toBeVisible({ timeout: 10000 });

      // Clear required field and try to save
      await storeConfigPage.storeNameInput.fill('');
      await storeConfigPage.saveChanges();

      // Should show validation error (browser validation will prevent form submission)
      // The form should not submit successfully
      await expect(storeConfigPage.successMessage).not.toBeVisible();

      console.log('✅ Error handling working correctly');
    });
  });

  test.describe('Integration Tests', () => {
    test('should complete full workflow: setup → configuration → updates', async ({ page }) => {
      console.log('🔄 Testing complete store setup and configuration workflow');

      // Step 1: Login
      await loginHelper.loginAsPartner();

      // Step 2: Complete store setup (if needed)
      await storeSetupPage.goto();
      
      // Check if already setup by looking for redirect to dashboard
      try {
        await page.waitForURL('**/dashboard', { timeout: 3000 });
        console.log('ℹ️  Store already setup, proceeding to configuration tests');
      } catch {
        console.log('📋 Completing store setup first...');
        
        const storeData = {
          name: 'Brechó Workflow E2E',
          email: 'workflow@example.com',
          phone: '(11) 55555-5555',
          documentType: 'CNPJ' as const,
          document: '98.765.432/0001-10',
          description: 'Loja para teste completo'
        };

        await storeSetupPage.fillStoreInformation(storeData);
        await storeSetupPage.submitForm();
        await page.waitForURL('**/dashboard', { timeout: 15000 });
      }

      // Step 3: Navigate to configuration
      await storeConfigPage.goto();
      await expect(storeConfigPage.loadingSpinner).not.toBeVisible({ timeout: 10000 });

      // Step 4: Make comprehensive updates
      const updates = {
        name: 'Brechó Workflow Atualizado',
        whatsapp: '(11) 44444-4444',
        pixKey: 'workflow@pix.com'
      };

      await storeConfigPage.updateStoreInformation(updates);

      const publicUpdates = {
        slug: `workflow-${Date.now()}`,
        publicDescription: 'Loja completa de workflow E2E',
        isActive: true
      };

      await storeConfigPage.updatePublicStorefront(publicUpdates);

      // Step 5: Save and verify
      await storeConfigPage.saveChanges();
      await expect(storeConfigPage.successMessage).toBeVisible({ timeout: 10000 });

      await page.screenshot({ path: 'test-results/workflow-complete.png' });

      console.log('✅ Complete workflow test passed');
    });
  });
});