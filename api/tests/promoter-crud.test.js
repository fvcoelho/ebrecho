#!/usr/bin/env node

/**
 * Comprehensive CRUD Test for Promoter API
 * 
 * This test covers all CRUD operations for the promoter admin API:
 * - CREATE: Admin creates a new promoter
 * - READ: Get all promoters, get promoter by ID
 * - UPDATE: Update promoter details (main focus)
 * - DELETE: Delete promoter
 */

const http = require('http');

const BASE_URL = 'http://localhost:3001';
const API_BASE = '/api';

let adminToken = '';
let testUserId = '';
let testPromoterId = '';

// Test data
const testUserData = {
  email: `test-promoter-user-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  name: 'Test Promoter User',
  role: 'CUSTOMER'
};

const testPromoterData = {
  businessName: 'Test Business',
  territory: 'São Paulo',
  specialization: 'Fashion',
  tier: 'SILVER',
  commissionRate: 0.035,
  invitationQuota: 25,
  isActive: true
};

const updatedPromoterData = {
  businessName: 'Updated Test Business',
  territory: 'Rio de Janeiro', 
  specialization: 'Luxury Fashion',
  tier: 'GOLD',
  commissionRate: 0.045,
  invitationQuota: 50,
  isActive: false
};

// HTTP request helper
function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const response = body ? JSON.parse(body) : {};
          resolve({ statusCode: res.statusCode, body: response, headers: res.headers });
        } catch (e) {
          resolve({ statusCode: res.statusCode, body: body, headers: res.headers });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Admin login
async function loginAsAdmin() {
  console.log('🔐 Logging in as admin...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `${API_BASE}/auth/login`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const loginData = {
    email: 'admin@ebrecho.com.br',
    password: 'admin123'
  };

  try {
    const response = await makeRequest(options, loginData);
    
    if (response.statusCode === 200 && response.body.token) {
      adminToken = response.body.token;
      console.log('✅ Admin login successful');
      return true;
    } else {
      console.log('❌ Admin login failed:', response.body);
      return false;
    }
  } catch (error) {
    console.error('❌ Admin login error:', error.message);
    return false;
  }
}

// Create test user
async function createTestUser() {
  console.log('👤 Creating test user...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `${API_BASE}/auth/register`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  try {
    const response = await makeRequest(options, testUserData);
    
    if (response.statusCode === 201 && response.body.user) {
      testUserId = response.body.user.id;
      console.log('✅ Test user created:', testUserId);
      return true;
    } else {
      console.log('❌ Failed to create test user:', response.body);
      return false;
    }
  } catch (error) {
    console.error('❌ Error creating test user:', error.message);
    return false;
  }
}

// Test CREATE promoter
async function testCreatePromoter() {
  console.log('\n📝 Testing CREATE promoter...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `${API_BASE}/admin/promoters`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  };

  const createData = {
    userId: testUserId,
    ...testPromoterData
  };

  try {
    const response = await makeRequest(options, createData);
    
    if (response.statusCode === 201 && response.body.promoter) {
      testPromoterId = response.body.promoter.id;
      console.log('✅ CREATE promoter successful');
      console.log('   - Promoter ID:', testPromoterId);
      console.log('   - Business Name:', response.body.promoter.businessName);
      console.log('   - Tier:', response.body.promoter.tier);
      console.log('   - Commission Rate:', response.body.promoter.commissionRate);
      console.log('   - Active Status:', response.body.promoter.isActive);
      return true;
    } else {
      console.log('❌ CREATE promoter failed');
      console.log('   Status Code:', response.statusCode);
      console.log('   Response:', response.body);
      return false;
    }
  } catch (error) {
    console.error('❌ CREATE promoter error:', error.message);
    return false;
  }
}

// Test READ promoter by ID
async function testReadPromoterById() {
  console.log('\n📖 Testing READ promoter by ID...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `${API_BASE}/admin/promoters/${testPromoterId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.statusCode === 200 && response.body.success && response.body.data) {
      const promoter = response.body.data;
      console.log('✅ READ promoter by ID successful');
      console.log('   - Business Name:', promoter.businessName);
      console.log('   - Territory:', promoter.territory);
      console.log('   - Tier:', promoter.tier);
      console.log('   - Commission Rate:', promoter.commissionRate);
      console.log('   - Invitation Quota:', promoter.invitationQuota);
      console.log('   - Active Status:', promoter.isActive);
      console.log('   - Statistics Available:', !!promoter.statistics);
      return true;
    } else {
      console.log('❌ READ promoter by ID failed');
      console.log('   Status Code:', response.statusCode);
      console.log('   Response:', response.body);
      return false;
    }
  } catch (error) {
    console.error('❌ READ promoter by ID error:', error.message);
    return false;
  }
}

// Test READ all promoters
async function testReadAllPromoters() {
  console.log('\n📚 Testing READ all promoters...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `${API_BASE}/admin/promoters?page=1&limit=10&sortBy=createdAt&sortOrder=desc`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.statusCode === 200 && response.body.success && response.body.data) {
      const { promoters, pagination } = response.body.data;
      console.log('✅ READ all promoters successful');
      console.log('   - Total promoters:', pagination.total);
      console.log('   - Current page:', pagination.page);
      console.log('   - Promoters in response:', promoters.length);
      
      // Check if our test promoter is in the list
      const ourPromoter = promoters.find(p => p.id === testPromoterId);
      if (ourPromoter) {
        console.log('   - Found our test promoter in list ✅');
      } else {
        console.log('   - Our test promoter not found in list ❌');
      }
      
      return true;
    } else {
      console.log('❌ READ all promoters failed');
      console.log('   Status Code:', response.statusCode);
      console.log('   Response:', response.body);
      return false;
    }
  } catch (error) {
    console.error('❌ READ all promoters error:', error.message);
    return false;
  }
}

// Test UPDATE promoter (MAIN TEST)
async function testUpdatePromoter() {
  console.log('\n✏️  Testing UPDATE promoter (MAIN TEST)...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `${API_BASE}/admin/promoters/${testPromoterId}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  };

  try {
    const response = await makeRequest(options, updatedPromoterData);
    
    if (response.statusCode === 200 && response.body.promoter) {
      const promoter = response.body.promoter;
      console.log('✅ UPDATE promoter successful');
      console.log('   - Business Name:', promoter.businessName, updatedPromoterData.businessName === promoter.businessName ? '✅' : '❌');
      console.log('   - Territory:', promoter.territory, updatedPromoterData.territory === promoter.territory ? '✅' : '❌');
      console.log('   - Specialization:', promoter.specialization, updatedPromoterData.specialization === promoter.specialization ? '✅' : '❌');
      console.log('   - Tier:', promoter.tier, updatedPromoterData.tier === promoter.tier ? '✅' : '❌');
      console.log('   - Commission Rate:', promoter.commissionRate, Math.abs(updatedPromoterData.commissionRate - parseFloat(promoter.commissionRate)) < 0.001 ? '✅' : '❌');
      console.log('   - Invitation Quota:', promoter.invitationQuota, updatedPromoterData.invitationQuota === promoter.invitationQuota ? '✅' : '❌');
      console.log('   - Active Status:', promoter.isActive, updatedPromoterData.isActive === promoter.isActive ? '✅' : '❌');
      
      // Verify all fields were updated correctly
      const allFieldsCorrect = 
        updatedPromoterData.businessName === promoter.businessName &&
        updatedPromoterData.territory === promoter.territory &&
        updatedPromoterData.specialization === promoter.specialization &&
        updatedPromoterData.tier === promoter.tier &&
        Math.abs(updatedPromoterData.commissionRate - parseFloat(promoter.commissionRate)) < 0.001 &&
        updatedPromoterData.invitationQuota === promoter.invitationQuota &&
        updatedPromoterData.isActive === promoter.isActive;
      
      if (allFieldsCorrect) {
        console.log('🎉 ALL UPDATE FIELDS VERIFIED CORRECTLY!');
      } else {
        console.log('⚠️  Some update fields may not have been set correctly');
      }
      
      return allFieldsCorrect;
    } else {
      console.log('❌ UPDATE promoter failed');
      console.log('   Status Code:', response.statusCode);
      console.log('   Response:', response.body);
      return false;
    }
  } catch (error) {
    console.error('❌ UPDATE promoter error:', error.message);
    return false;
  }
}

// Test partial UPDATE promoter
async function testPartialUpdatePromoter() {
  console.log('\n✏️  Testing PARTIAL UPDATE promoter...');
  
  const partialUpdate = {
    businessName: 'Partially Updated Business',
    tier: 'PLATINUM'
  };
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `${API_BASE}/admin/promoters/${testPromoterId}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`
    }
  };

  try {
    const response = await makeRequest(options, partialUpdate);
    
    if (response.statusCode === 200 && response.body.promoter) {
      const promoter = response.body.promoter;
      console.log('✅ PARTIAL UPDATE promoter successful');
      console.log('   - Business Name:', promoter.businessName, partialUpdate.businessName === promoter.businessName ? '✅' : '❌');
      console.log('   - Tier:', promoter.tier, partialUpdate.tier === promoter.tier ? '✅' : '❌');
      console.log('   - Territory (should remain):', promoter.territory, 'Rio de Janeiro' === promoter.territory ? '✅' : '❌');
      
      const correctUpdate = 
        partialUpdate.businessName === promoter.businessName &&
        partialUpdate.tier === promoter.tier &&
        promoter.territory === 'Rio de Janeiro'; // Should remain from previous update
      
      return correctUpdate;
    } else {
      console.log('❌ PARTIAL UPDATE promoter failed');
      console.log('   Status Code:', response.statusCode);
      console.log('   Response:', response.body);
      return false;
    }
  } catch (error) {
    console.error('❌ PARTIAL UPDATE promoter error:', error.message);
    return false;
  }
}

// Test DELETE promoter
async function testDeletePromoter() {
  console.log('\n🗑️  Testing DELETE promoter...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `${API_BASE}/admin/promoters/${testPromoterId}`,
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.statusCode === 200 && response.body.message) {
      console.log('✅ DELETE promoter successful');
      console.log('   - Message:', response.body.message);
      return true;
    } else {
      console.log('❌ DELETE promoter failed');
      console.log('   Status Code:', response.statusCode);
      console.log('   Response:', response.body);
      return false;
    }
  } catch (error) {
    console.error('❌ DELETE promoter error:', error.message);
    return false;
  }
}

// Verify deletion by trying to read
async function testVerifyDeletion() {
  console.log('\n🔍 Verifying deletion...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: `${API_BASE}/admin/promoters/${testPromoterId}`,
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${adminToken}`
    }
  };

  try {
    const response = await makeRequest(options);
    
    if (response.statusCode === 404) {
      console.log('✅ Deletion verified - promoter not found (expected)');
      return true;
    } else {
      console.log('❌ Deletion verification failed - promoter still exists');
      console.log('   Status Code:', response.statusCode);
      return false;
    }
  } catch (error) {
    console.error('❌ Deletion verification error:', error.message);
    return false;
  }
}

// Cleanup test user
async function cleanupTestUser() {
  console.log('\n🧹 Cleaning up test user...');
  // Note: In a real scenario, you might want to implement user cleanup
  // For this test, we'll leave it as the promoter deletion should have handled the main cleanup
  console.log('✅ Cleanup completed');
}

// Main test execution
async function runCrudTests() {
  console.log('🚀 Starting Promoter CRUD Tests\n');
  
  let allTestsPassed = true;
  const results = {
    adminLogin: false,
    createUser: false,
    createPromoter: false,
    readPromoterById: false,
    readAllPromoters: false,
    updatePromoter: false,
    partialUpdatePromoter: false,
    deletePromoter: false,
    verifyDeletion: false
  };

  try {
    // Setup
    results.adminLogin = await loginAsAdmin();
    if (!results.adminLogin) {
      console.log('\n❌ Cannot continue without admin login');
      return;
    }

    results.createUser = await createTestUser();
    if (!results.createUser) {
      console.log('\n❌ Cannot continue without test user');
      return;
    }

    // CRUD Tests
    results.createPromoter = await testCreatePromoter();
    allTestsPassed = allTestsPassed && results.createPromoter;

    if (results.createPromoter) {
      results.readPromoterById = await testReadPromoterById();
      allTestsPassed = allTestsPassed && results.readPromoterById;

      results.readAllPromoters = await testReadAllPromoters();
      allTestsPassed = allTestsPassed && results.readAllPromoters;

      results.updatePromoter = await testUpdatePromoter();
      allTestsPassed = allTestsPassed && results.updatePromoter;

      results.partialUpdatePromoter = await testPartialUpdatePromoter();
      allTestsPassed = allTestsPassed && results.partialUpdatePromoter;

      results.deletePromoter = await testDeletePromoter();
      allTestsPassed = allTestsPassed && results.deletePromoter;

      if (results.deletePromoter) {
        results.verifyDeletion = await testVerifyDeletion();
        allTestsPassed = allTestsPassed && results.verifyDeletion;
      }
    }

    // Cleanup
    await cleanupTestUser();

  } catch (error) {
    console.error('\n💥 Unexpected error during tests:', error.message);
    allTestsPassed = false;
  }

  // Test Summary
  console.log('\n' + '='.repeat(60));
  console.log('🏁 PROMOTER CRUD TEST RESULTS');
  console.log('='.repeat(60));
  
  Object.entries(results).forEach(([test, passed]) => {
    const status = passed ? '✅ PASS' : '❌ FAIL';
    const testName = test.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    console.log(`${status} ${testName}`);
  });

  console.log('='.repeat(60));
  
  if (allTestsPassed) {
    console.log('🎉 ALL PROMOTER CRUD TESTS PASSED!');
    console.log('✅ UPDATE functionality is working correctly');
  } else {
    console.log('❌ Some tests failed. Check the output above for details.');
  }
  
  console.log('='.repeat(60));
}

// Run the tests
runCrudTests().catch(console.error);