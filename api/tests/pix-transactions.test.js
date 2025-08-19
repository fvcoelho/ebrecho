// PIX Transactions API Tests using curl and Node.js
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const API_BASE = 'http://localhost:3001';

// Test results
let testResults = {
    passed: 0,
    failed: 0,
    tests: []
};

// Global variables for test data
let adminToken = '';
let partnerToken = '';
let testTransactionId = '';
let testTransactionCode = '';
let testProductId = '';
let testPartnerId = '';

function logTest(name, status, message = '') {
    const result = { name, status, message };
    testResults.tests.push(result);
    
    if (status === 'PASS') {
        testResults.passed++;
        console.log(`✅ ${name}`);
    } else {
        testResults.failed++;
        console.log(`❌ ${name}: ${message}`);
    }
}

async function makeRequest(method, endpoint, data = null, headers = {}) {
    try {
        let curlCmd = `curl -s -w "\\n%{http_code}" -X ${method} "${API_BASE}${endpoint}"`;
        
        // Add headers
        Object.keys(headers).forEach(key => {
            curlCmd += ` -H "${key}: ${headers[key]}"`;
        });
        
        // Add data for POST/PUT/PATCH requests
        if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
            curlCmd += ` -H "Content-Type: application/json" -d '${JSON.stringify(data)}'`;
        }
        
        const { stdout } = await execAsync(curlCmd);
        const lines = stdout.trim().split('\n');
        const statusCode = parseInt(lines[lines.length - 1]);
        const responseBody = lines.slice(0, -1).join('\n');
        
        let response;
        try {
            response = JSON.parse(responseBody);
        } catch (e) {
            response = responseBody;
        }
        
        return { statusCode, response };
    } catch (error) {
        throw new Error(`Request failed: ${error.message}`);
    }
}

async function runPixTransactionTests() {
    console.log('💳 Starting PIX Transactions API Tests\\n');
    
    // Generate unique test data
    const timestamp = Date.now();
    testTransactionCode = `TEST-PIX-${timestamp}`;
    
    // Test 1: Login as admin to get token
    try {
        const loginData = {
            email: 'admin@ebrecho.com.br',
            password: 'admin123'
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/auth/login', loginData);
        
        if (statusCode === 200 && response.success && response.data.user.role === 'ADMIN') {
            logTest('Login Admin for PIX Tests', 'PASS');
            adminToken = response.data.token;
        } else {
            logTest('Login Admin for PIX Tests', 'FAIL', `Expected 200, got ${statusCode}`);
            return;
        }
    } catch (error) {
        logTest('Login Admin for PIX Tests', 'FAIL', error.message);
        return;
    }
    
    // Test 2: Login as partner to get partner token and ID
    try {
        const loginData = {
            email: 'maria@brechodamaria.com',
            password: 'senha123'
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/auth/login', loginData);
        
        if (statusCode === 200 && response.success && response.data.user.role === 'PARTNER_ADMIN') {
            logTest('Login Partner for PIX Tests', 'PASS');
            partnerToken = response.data.token;
            testPartnerId = response.data.user.partnerId;
        } else {
            logTest('Login Partner for PIX Tests', 'FAIL', `Expected 200, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Login Partner for PIX Tests', 'FAIL', error.message);
    }
    
    // Test 3: Get a product to use in transactions
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/products?limit=1', null, {
            'Authorization': `Bearer ${partnerToken}`
        });
        
        if (statusCode === 200 && response.success && response.data.products && response.data.products.length > 0) {
            logTest('Get Test Product', 'PASS');
            testProductId = response.data.products[0].id;
        } else {
            logTest('Get Test Product', 'FAIL', `No products found for testing`);
            return;
        }
    } catch (error) {
        logTest('Get Test Product', 'FAIL', error.message);
        return;
    }
    
    // Test 4: Create a PIX transaction (as partner)
    try {
        const transactionData = {
            transactionCode: testTransactionCode,
            productId: testProductId,
            pixKey: 'maria@brechodamaria.com',
            amount: 89.90,
            merchantName: 'Brechó da Maria',
            merchantCity: 'São Paulo',
            pixPayload: '00020126580014br.gov.bcb.pix0136maria@brechodamaria.com0220PIX Transaction Test5204000053039865802BR5918Brecho da Maria6009Sao Paulo62070503***6304ABCD',
            customerEmail: 'cliente@example.com',
            customerPhone: '11999887766',
            expiresIn: 30
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/pix-transactions', transactionData, {
            'Authorization': `Bearer ${partnerToken}`
        });
        
        if (statusCode === 201 && response.success && response.data.transactionCode === testTransactionCode) {
            logTest('Create PIX Transaction', 'PASS');
            testTransactionId = response.data.id;
        } else {
            logTest('Create PIX Transaction', 'FAIL', `Expected 201, got ${statusCode}: ${JSON.stringify(response)}`);
        }
    } catch (error) {
        logTest('Create PIX Transaction', 'FAIL', error.message);
    }
    
    // Test 5: Create PIX transaction with missing required fields
    try {
        const transactionData = {
            transactionCode: `INVALID-${timestamp}`,
            // Missing productId, pixKey, amount, etc.
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/pix-transactions', transactionData, {
            'Authorization': `Bearer ${partnerToken}`
        });
        
        if (statusCode === 422 && !response.success) {
            logTest('Create PIX Transaction Invalid Data', 'PASS');
        } else {
            logTest('Create PIX Transaction Invalid Data', 'FAIL', `Expected 422, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Create PIX Transaction Invalid Data', 'FAIL', error.message);
    }
    
    // Test 6: Create PIX transaction with duplicate transaction code
    try {
        const transactionData = {
            transactionCode: testTransactionCode, // Same as previous transaction
            productId: testProductId,
            pixKey: 'test@example.com',
            amount: 50.00,
            merchantName: 'Test Merchant',
            merchantCity: 'Test City',
            pixPayload: 'test-payload-duplicate'
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/pix-transactions', transactionData, {
            'Authorization': `Bearer ${partnerToken}`
        });
        
        if (statusCode === 409 && !response.success) {
            logTest('Create PIX Transaction Duplicate Code', 'PASS');
        } else {
            logTest('Create PIX Transaction Duplicate Code', 'FAIL', `Expected 409, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Create PIX Transaction Duplicate Code', 'FAIL', error.message);
    }
    
    // Test 7: Get PIX transaction by ID (as partner)
    if (testTransactionId) {
        try {
            const { statusCode, response } = await makeRequest('GET', `/api/pix-transactions/${testTransactionId}`, null, {
                'Authorization': `Bearer ${partnerToken}`
            });
            
            if (statusCode === 200 && response.success && response.data.id === testTransactionId) {
                logTest('Get PIX Transaction by ID', 'PASS');
            } else {
                logTest('Get PIX Transaction by ID', 'FAIL', `Expected 200, got ${statusCode}: ${JSON.stringify(response)}`);
            }
        } catch (error) {
            logTest('Get PIX Transaction by ID', 'FAIL', error.message);
        }
    }
    
    // Test 8: Get PIX transaction by transaction code
    try {
        const { statusCode, response } = await makeRequest('GET', `/api/pix-transactions/by-code/${testTransactionCode}`, null, {
            'Authorization': `Bearer ${partnerToken}`
        });
        
        if (statusCode === 200 && response.success && response.data.transactionCode === testTransactionCode) {
            logTest('Get PIX Transaction by Code', 'PASS');
        } else {
            logTest('Get PIX Transaction by Code', 'FAIL', `Expected 200, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Get PIX Transaction by Code', 'FAIL', error.message);
    }
    
    // Test 9: Get PIX transaction without authentication
    if (testTransactionId) {
        try {
            const { statusCode, response } = await makeRequest('GET', `/api/pix-transactions/${testTransactionId}`);
            
            if (statusCode === 401 && !response.success) {
                logTest('Get PIX Transaction No Auth', 'PASS');
            } else {
                logTest('Get PIX Transaction No Auth', 'FAIL', `Expected 401, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Get PIX Transaction No Auth', 'FAIL', error.message);
        }
    }
    
    // Test 10: List all PIX transactions for partner
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/pix-transactions', null, {
            'Authorization': `Bearer ${partnerToken}`
        });
        
        if (statusCode === 200 && response.success && Array.isArray(response.data.transactions)) {
            logTest('List PIX Transactions', 'PASS');
        } else {
            logTest('List PIX Transactions', 'FAIL', `Expected 200 with transactions array, got ${statusCode}`);
        }
    } catch (error) {
        logTest('List PIX Transactions', 'FAIL', error.message);
    }
    
    // Test 11: List PIX transactions with pagination
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/pix-transactions?page=1&limit=10', null, {
            'Authorization': `Bearer ${partnerToken}`
        });
        
        if (statusCode === 200 && response.success) {
            logTest('List PIX Transactions with Pagination', 'PASS');
        } else {
            logTest('List PIX Transactions with Pagination', 'FAIL', `Expected 200, got ${statusCode}`);
        }
    } catch (error) {
        logTest('List PIX Transactions with Pagination', 'FAIL', error.message);
    }
    
    // Test 12: Filter PIX transactions by status
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/pix-transactions?status=PENDING', null, {
            'Authorization': `Bearer ${partnerToken}`
        });
        
        if (statusCode === 200 && response.success) {
            logTest('Filter PIX Transactions by Status', 'PASS');
        } else {
            logTest('Filter PIX Transactions by Status', 'FAIL', `Expected 200, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Filter PIX Transactions by Status', 'FAIL', error.message);
    }
    
    // Test 13: Update PIX transaction status (mark as paid)
    if (testTransactionId) {
        try {
            const updateData = {
                status: 'PAID'
            };
            
            const { statusCode, response } = await makeRequest('PATCH', `/api/pix-transactions/${testTransactionId}/status`, updateData, {
                'Authorization': `Bearer ${partnerToken}`
            });
            
            if (statusCode === 200 && response.success) {
                logTest('Update PIX Transaction Status', 'PASS');
            } else {
                logTest('Update PIX Transaction Status', 'FAIL', `Expected 200, got ${statusCode}: ${JSON.stringify(response)}`);
            }
        } catch (error) {
            logTest('Update PIX Transaction Status', 'FAIL', error.message);
        }
    }
    
    // Test 14: Update PIX transaction status with invalid status
    if (testTransactionId) {
        try {
            const updateData = {
                status: 'INVALID_STATUS'
            };
            
            const { statusCode, response } = await makeRequest('PATCH', `/api/pix-transactions/${testTransactionId}/status`, updateData, {
                'Authorization': `Bearer ${partnerToken}`
            });
            
            if (statusCode === 422 && !response.success) {
                logTest('Update PIX Transaction Invalid Status', 'PASS');
            } else {
                logTest('Update PIX Transaction Invalid Status', 'FAIL', `Expected 422, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Update PIX Transaction Invalid Status', 'FAIL', error.message);
        }
    }
    
    // Test 15: Cancel PIX transaction
    if (testTransactionId) {
        // First create another transaction to cancel
        try {
            const cancelTransactionData = {
                transactionCode: `CANCEL-TEST-${timestamp}`,
                productId: testProductId,
                pixKey: 'cancel@test.com',
                amount: 25.00,
                merchantName: 'Test Merchant',
                merchantCity: 'Test City',
                pixPayload: 'cancel-test-payload'
            };
            
            const createResponse = await makeRequest('POST', '/api/pix-transactions', cancelTransactionData, {
                'Authorization': `Bearer ${partnerToken}`
            });
            
            if (createResponse.statusCode === 201 && createResponse.response.success) {
                const cancelTransactionId = createResponse.response.data.id;
                
                // Now cancel it
                const updateData = {
                    status: 'CANCELLED'
                };
                
                const { statusCode, response } = await makeRequest('PATCH', `/api/pix-transactions/${cancelTransactionId}/status`, updateData, {
                    'Authorization': `Bearer ${partnerToken}`
                });
                
                if (statusCode === 200 && response.success) {
                    logTest('Cancel PIX Transaction', 'PASS');
                } else {
                    logTest('Cancel PIX Transaction', 'FAIL', `Expected 200, got ${statusCode}`);
                }
            } else {
                logTest('Cancel PIX Transaction', 'FAIL', 'Could not create transaction to cancel');
            }
        } catch (error) {
            logTest('Cancel PIX Transaction', 'FAIL', error.message);
        }
    }
    
    // Test 16: Admin can view all PIX transactions
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/pix-transactions?includeAllPartners=true', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        
        if (statusCode === 200 && response.success) {
            logTest('Admin View All PIX Transactions', 'PASS');
        } else {
            logTest('Admin View All PIX Transactions', 'FAIL', `Expected 200, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Admin View All PIX Transactions', 'FAIL', error.message);
    }
    
    // Test 17: Partner cannot access other partner's transactions
    try {
        // Try to get transactions for a different partner
        const { statusCode, response } = await makeRequest('GET', '/api/pix-transactions?partnerId=different-partner-id', null, {
            'Authorization': `Bearer ${partnerToken}`
        });
        
        if (statusCode === 403 || (statusCode === 200 && response.data.transactions.length === 0)) {
            logTest('Partner Cannot Access Other Transactions', 'PASS');
        } else {
            logTest('Partner Cannot Access Other Transactions', 'FAIL', `Expected 403 or empty results, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Partner Cannot Access Other Transactions', 'FAIL', error.message);
    }
    
    // Test 18: Get PIX transaction statistics
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/pix-transactions/statistics', null, {
            'Authorization': `Bearer ${partnerToken}`
        });
        
        if (statusCode === 200 && response.success) {
            logTest('Get PIX Transaction Statistics', 'PASS');
        } else {
            logTest('Get PIX Transaction Statistics', 'FAIL', `Expected 200, got ${statusCode}: ${JSON.stringify(response)}`);
        }
    } catch (error) {
        logTest('Get PIX Transaction Statistics', 'FAIL', error.message);
    }
    
    // Test 19: Create PIX transaction with negative amount
    try {
        const transactionData = {
            transactionCode: `NEGATIVE-${timestamp}`,
            productId: testProductId,
            pixKey: 'test@negative.com',
            amount: -10.00, // Negative amount
            merchantName: 'Test Merchant',
            merchantCity: 'Test City',
            pixPayload: 'negative-test-payload'
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/pix-transactions', transactionData, {
            'Authorization': `Bearer ${partnerToken}`
        });
        
        if (statusCode === 422 && !response.success) {
            logTest('Create PIX Transaction Negative Amount', 'PASS');
        } else {
            logTest('Create PIX Transaction Negative Amount', 'FAIL', `Expected 422, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Create PIX Transaction Negative Amount', 'FAIL', error.message);
    }
    
    // Test 20: Create PIX transaction with very large amount
    try {
        const transactionData = {
            transactionCode: `LARGE-${timestamp}`,
            productId: testProductId,
            pixKey: 'test@large.com',
            amount: 999999.99, // Very large amount
            merchantName: 'Test Merchant',
            merchantCity: 'Test City',
            pixPayload: 'large-amount-test-payload'
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/pix-transactions', transactionData, {
            'Authorization': `Bearer ${partnerToken}`
        });
        
        if (statusCode === 201 && response.success) {
            logTest('Create PIX Transaction Large Amount', 'PASS');
        } else {
            logTest('Create PIX Transaction Large Amount', 'FAIL', `Expected 201, got ${statusCode}: ${JSON.stringify(response)}`);
        }
    } catch (error) {
        logTest('Create PIX Transaction Large Amount', 'FAIL', error.message);
    }
    
    // Print summary
    console.log('\\n📊 PIX Transaction Test Summary:');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`📋 Total: ${testResults.tests.length}`);
    console.log(`🎯 Success Rate: ${((testResults.passed / testResults.tests.length) * 100).toFixed(1)}%`);
    
    if (testResults.failed > 0) {
        console.log('\\n❌ Failed Tests:');
        testResults.tests
            .filter(test => test.status === 'FAIL')
            .forEach(test => console.log(`   • ${test.name}: ${test.message}`));
    }
    
    return testResults;
}

// Check if API is running and run tests
async function main() {
    try {
        await makeRequest('GET', '/health');
        await runPixTransactionTests();
    } catch (error) {
        console.log('❌ API is not running. Please start the API server first.');
        console.log('   Run: cd api && npm run dev');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { runPixTransactionTests, makeRequest };