#!/usr/bin/env node

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

console.log('\n🔐 WhatsApp Verify Token Generator');
console.log('==================================\n');

/**
 * Generate a cryptographically secure random token
 */
function generateSecureToken(length = 64) {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Generate multiple token options
 */
function generateTokenOptions() {
  const tokens = {
    short: generateSecureToken(16),    // 32 characters
    medium: generateSecureToken(32),   // 64 characters  
    long: generateSecureToken(64),     // 128 characters
    uuid: crypto.randomUUID(),         // UUID format
    custom: generateCustomToken()      // Custom format
  };

  return tokens;
}

/**
 * Generate a custom formatted token
 */
function generateCustomToken() {
  const timestamp = Date.now().toString(36);
  const random1 = crypto.randomBytes(8).toString('hex');
  const random2 = crypto.randomBytes(8).toString('hex');
  return `ebrecho_${timestamp}_${random1}_${random2}`;
}

/**
 * Update environment file
 */
function updateEnvFile(token) {
  const envPath = path.join(__dirname, '..', '.env');
  const envExamplePath = path.join(__dirname, '..', '.env.example');
  
  const envLine = `WHATSAPP_VERIFY_TOKEN=${token}`;
  
  try {
    // Check if .env exists
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      if (envContent.includes('WHATSAPP_VERIFY_TOKEN=')) {
        // Replace existing token
        envContent = envContent.replace(
          /WHATSAPP_VERIFY_TOKEN=.*/g, 
          envLine
        );
      } else {
        // Add new token
        envContent += `\n# WhatsApp Cloud API\n${envLine}\n`;
      }
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Updated .env file with new token');
    } else {
      // Create new .env file
      const newEnvContent = `# WhatsApp Cloud API
${envLine}
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here
WHATSAPP_API_VERSION=v22.0
`;
      fs.writeFileSync(envPath, newEnvContent);
      console.log('✅ Created new .env file with WhatsApp configuration');
    }

    // Update .env.example if it exists
    if (fs.existsSync(envExamplePath)) {
      let exampleContent = fs.readFileSync(envExamplePath, 'utf8');
      
      if (!exampleContent.includes('WHATSAPP_VERIFY_TOKEN=')) {
        exampleContent += `\n# WhatsApp Cloud API
WHATSAPP_VERIFY_TOKEN=your_secure_verify_token_here
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here
WHATSAPP_API_VERSION=v22.0
`;
        fs.writeFileSync(envExamplePath, exampleContent);
        console.log('✅ Updated .env.example file');
      }
    }

  } catch (error) {
    console.error('❌ Error updating environment files:', error.message);
  }
}

/**
 * Main function
 */
function main() {
  const args = process.argv.slice(2);
  const options = generateTokenOptions();

  if (args.includes('--help') || args.includes('-h')) {
    console.log('Usage: node generate-whatsapp-token.js [options]');
    console.log('');
    console.log('Options:');
    console.log('  --short     Generate 32-character token');
    console.log('  --medium    Generate 64-character token (default)');
    console.log('  --long      Generate 128-character token');
    console.log('  --uuid      Generate UUID-format token');
    console.log('  --custom    Generate custom eBrecho-formatted token');
    console.log('  --update    Update .env file with generated token');
    console.log('  --help, -h  Show this help message');
    console.log('');
    return;
  }

  console.log('Generated WHATSAPP_VERIFY_TOKEN options:\n');

  // Show all options
  console.log('🔹 Short (32 chars):');
  console.log(`   ${options.short}\n`);

  console.log('🔹 Medium (64 chars) - Recommended:');
  console.log(`   ${options.medium}\n`);

  console.log('🔹 Long (128 chars):');
  console.log(`   ${options.long}\n`);

  console.log('🔹 UUID Format:');
  console.log(`   ${options.uuid}\n`);

  console.log('🔹 Custom eBrecho Format:');
  console.log(`   ${options.custom}\n`);

  // Determine which token to use
  let selectedToken = options.medium; // Default

  if (args.includes('--short')) selectedToken = options.short;
  else if (args.includes('--long')) selectedToken = options.long;
  else if (args.includes('--uuid')) selectedToken = options.uuid;
  else if (args.includes('--custom')) selectedToken = options.custom;

  console.log('🎯 Selected Token:');
  console.log(`   ${selectedToken}\n`);

  // Update environment file if requested
  if (args.includes('--update')) {
    updateEnvFile(selectedToken);
  }

  console.log('📋 Setup Instructions:');
  console.log('1. Copy the selected token above');
  console.log('2. Add to your .env file:');
  console.log(`   WHATSAPP_VERIFY_TOKEN=${selectedToken}`);
  console.log('3. Use the same token in Meta Developer Console webhook configuration');
  console.log('4. Keep this token secret and secure!');
  console.log('');

  console.log('🔐 Security Notes:');
  console.log('✅ Token is cryptographically secure');
  console.log('✅ Generated using crypto.randomBytes()');
  console.log('✅ Unique for each generation');
  console.log('✅ Suitable for production use');
  console.log('');

  console.log('🛠️  Meta Developer Console Setup:');
  console.log('1. Go to developers.facebook.com/apps');
  console.log('2. Select your app → WhatsApp → Configuration');
  console.log('3. In Webhook section, enter:');
  console.log('   - Callback URL: https://your-domain.com/api/whatsapp/webhook');
  console.log(`   - Verify Token: ${selectedToken}`);
  console.log('4. Subscribe to webhook fields: messages, message_template_status_update');
  console.log('');
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateSecureToken,
  generateTokenOptions,
  generateCustomToken
};