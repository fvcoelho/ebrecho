// Customer Management API Tests using curl and Node.js
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
let customerToken = '';
let testCustomerId = '';
let testCustomerAddressId = '';

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

async function runCustomerTests() {
    console.log('👥 Starting Customer Management API Tests\\n');
    
    // Generate unique test data
    const timestamp = Date.now();
    const testEmail = `customer.test.${timestamp}@example.com`;
    const testCpf = `12345678${timestamp.toString().slice(-3)}`;
    
    // Test 1: Login as admin to get token
    try {
        const loginData = {
            email: 'admin@ebrecho.com.br',
            password: 'admin123'
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/auth/login', loginData);
        
        if (statusCode === 200 && response.success && response.data.user.role === 'ADMIN') {
            logTest('Login Admin for Customer Tests', 'PASS');
            adminToken = response.data.token;
        } else {
            logTest('Login Admin for Customer Tests', 'FAIL', `Expected 200, got ${statusCode}`);
            return;
        }
    } catch (error) {
        logTest('Login Admin for Customer Tests', 'FAIL', error.message);
        return;
    }
    
    // Test 2: Login as partner to get partner token
    try {
        const loginData = {
            email: 'maria@brechodamaria.com',
            password: 'senha123'
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/auth/login', loginData);
        
        if (statusCode === 200 && response.success && response.data.user.role === 'PARTNER_ADMIN') {
            logTest('Login Partner for Customer Tests', 'PASS');
            partnerToken = response.data.token;
        } else {
            logTest('Login Partner for Customer Tests', 'FAIL', `Expected 200, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Login Partner for Customer Tests', 'FAIL', error.message);
    }
    
    // Test 3: Create a new customer (as admin)
    try {
        const customerData = {
            email: testEmail,
            name: 'Test Customer',
            phone: '11999887766',
            cpf: testCpf,
            dateOfBirth: '1990-01-15',
            preferredPayment: 'PIX'
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/customers', customerData, {
            'Authorization': `Bearer ${adminToken}`
        });
        
        if (statusCode === 201 && response.success) {
            logTest('Create Customer', 'PASS');
            testCustomerId = response.data.id;
        } else {
            logTest('Create Customer', 'FAIL', `Expected 201, got ${statusCode}: ${JSON.stringify(response)}`);
        }
    } catch (error) {
        logTest('Create Customer', 'FAIL', error.message);
    }
    
    // Test 4: Create customer with duplicate email
    try {
        const customerData = {
            email: testEmail, // Same email as above
            name: 'Duplicate Customer',
            cpf: `99999999${timestamp.toString().slice(-3)}`
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/customers', customerData, {
            'Authorization': `Bearer ${adminToken}`
        });
        
        if (statusCode === 409 && !response.success) {
            logTest('Create Customer Duplicate Email', 'PASS');
        } else {
            logTest('Create Customer Duplicate Email', 'FAIL', `Expected 409, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Create Customer Duplicate Email', 'FAIL', error.message);
    }
    
    // Test 5: Create customer with duplicate CPF
    try {
        const customerData = {
            email: `unique.${timestamp}@example.com`,
            name: 'Duplicate CPF Customer',
            cpf: testCpf // Same CPF as first customer
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/customers', customerData, {
            'Authorization': `Bearer ${adminToken}`
        });
        
        if (statusCode === 409 && !response.success) {
            logTest('Create Customer Duplicate CPF', 'PASS');
        } else {
            logTest('Create Customer Duplicate CPF', 'FAIL', `Expected 409, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Create Customer Duplicate CPF', 'FAIL', error.message);
    }
    
    // Test 6: Create customer with invalid data
    try {
        const customerData = {
            email: 'invalid-email',
            name: '', // Empty name
            phone: '123', // Invalid phone
            cpf: '123' // Invalid CPF
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/customers', customerData, {
            'Authorization': `Bearer ${adminToken}`
        });
        
        if (statusCode === 422 && !response.success) {
            logTest('Create Customer Invalid Data', 'PASS');
        } else {
            logTest('Create Customer Invalid Data', 'FAIL', `Expected 422, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Create Customer Invalid Data', 'FAIL', error.message);
    }
    
    // Test 7: Get all customers (as admin)
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/customers', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        
        if (statusCode === 200 && response.success && Array.isArray(response.data.customers)) {
            logTest('Get All Customers', 'PASS');
        } else {
            logTest('Get All Customers', 'FAIL', `Expected 200 with customers array, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Get All Customers', 'FAIL', error.message);
    }
    
    // Test 8: Get customers with pagination
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/customers?page=1&limit=10', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        
        if (statusCode === 200 && response.success) {
            logTest('Get Customers with Pagination', 'PASS');
        } else {
            logTest('Get Customers with Pagination', 'FAIL', `Expected 200, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Get Customers with Pagination', 'FAIL', error.message);
    }
    
    // Test 9: Search customers by name
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/customers?search=Test%20Customer', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        
        if (statusCode === 200 && response.success) {
            logTest('Search Customers by Name', 'PASS');
        } else {
            logTest('Search Customers by Name', 'FAIL', `Expected 200, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Search Customers by Name', 'FAIL', error.message);
    }
    
    // Test 10: Filter customers by preferred payment method
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/customers?preferredPayment=PIX', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        
        if (statusCode === 200 && response.success) {
            logTest('Filter Customers by Payment Method', 'PASS');
        } else {
            logTest('Filter Customers by Payment Method', 'FAIL', `Expected 200, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Filter Customers by Payment Method', 'FAIL', error.message);
    }
    
    // Test 11: Get customer by ID
    if (testCustomerId) {
        try {
            const { statusCode, response } = await makeRequest('GET', `/api/customers/${testCustomerId}`, null, {
                'Authorization': `Bearer ${adminToken}`
            });
            
            if (statusCode === 200 && response.success && response.data.id === testCustomerId) {
                logTest('Get Customer by ID', 'PASS');
            } else {
                logTest('Get Customer by ID', 'FAIL', `Expected 200, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Get Customer by ID', 'FAIL', error.message);
        }
    }
    
    // Test 12: Get non-existent customer
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/customers/nonexistent-id', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        
        if (statusCode === 404 && !response.success) {
            logTest('Get Non-existent Customer', 'PASS');
        } else {
            logTest('Get Non-existent Customer', 'FAIL', `Expected 404, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Get Non-existent Customer', 'FAIL', error.message);
    }
    
    // Test 13: Update customer information
    if (testCustomerId) {
        try {
            const updateData = {
                name: 'Updated Test Customer',
                phone: '11888776655',
                preferredPayment: 'CREDIT_CARD'
            };
            
            const { statusCode, response } = await makeRequest('PUT', `/api/customers/${testCustomerId}`, updateData, {
                'Authorization': `Bearer ${adminToken}`
            });
            
            if (statusCode === 200 && response.success) {
                logTest('Update Customer Information', 'PASS');
            } else {
                logTest('Update Customer Information', 'FAIL', `Expected 200, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Update Customer Information', 'FAIL', error.message);
        }
    }
    
    // Test 14: Update customer with invalid email
    if (testCustomerId) {
        try {
            const updateData = {
                email: 'invalid-email-format'
            };
            
            const { statusCode, response } = await makeRequest('PUT', `/api/customers/${testCustomerId}`, updateData, {
                'Authorization': `Bearer ${adminToken}`
            });
            
            if (statusCode === 422 && !response.success) {
                logTest('Update Customer Invalid Email', 'PASS');
            } else {
                logTest('Update Customer Invalid Email', 'FAIL', `Expected 422, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Update Customer Invalid Email', 'FAIL', error.message);
        }
    }
    
    // Test 15: Add customer address
    if (testCustomerId) {
        try {
            const addressData = {
                nickname: 'Home',
                street: 'Rua das Flores',
                number: '123',
                complement: 'Apto 45',
                neighborhood: 'Centro',
                city: 'São Paulo',
                state: 'SP',
                zipCode: '01234-567',
                isDefault: true
            };
            
            const { statusCode, response } = await makeRequest('POST', `/api/customers/${testCustomerId}/addresses`, addressData, {
                'Authorization': `Bearer ${adminToken}`
            });
            
            if (statusCode === 201 && response.success) {
                logTest('Add Customer Address', 'PASS');
                testCustomerAddressId = response.data.id;
            } else {
                logTest('Add Customer Address', 'FAIL', `Expected 201, got ${statusCode}: ${JSON.stringify(response)}`);
            }
        } catch (error) {
            logTest('Add Customer Address', 'FAIL', error.message);
        }
    }
    
    // Test 16: Get customer addresses
    if (testCustomerId) {
        try {
            const { statusCode, response } = await makeRequest('GET', `/api/customers/${testCustomerId}/addresses`, null, {
                'Authorization': `Bearer ${adminToken}`
            });
            
            if (statusCode === 200 && response.success && Array.isArray(response.data)) {
                logTest('Get Customer Addresses', 'PASS');
            } else {
                logTest('Get Customer Addresses', 'FAIL', `Expected 200 with addresses array, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Get Customer Addresses', 'FAIL', error.message);
        }
    }
    
    // Test 17: Update customer address
    if (testCustomerAddressId) {
        try {
            const updateData = {
                nickname: 'Work',
                street: 'Avenida Paulista',
                number: '1000',
                isDefault: false
            };
            
            const { statusCode, response } = await makeRequest('PUT', `/api/customers/addresses/${testCustomerAddressId}`, updateData, {
                'Authorization': `Bearer ${adminToken}`
            });
            
            if (statusCode === 200 && response.success) {
                logTest('Update Customer Address', 'PASS');
            } else {
                logTest('Update Customer Address', 'FAIL', `Expected 200, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Update Customer Address', 'FAIL', error.message);
        }
    }
    
    // Test 18: Delete customer address
    if (testCustomerAddressId) {
        try {
            const { statusCode, response } = await makeRequest('DELETE', `/api/customers/addresses/${testCustomerAddressId}`, null, {
                'Authorization': `Bearer ${adminToken}`
            });
            
            if (statusCode === 200 && response.success) {
                logTest('Delete Customer Address', 'PASS');
            } else {
                logTest('Delete Customer Address', 'FAIL', `Expected 200, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Delete Customer Address', 'FAIL', error.message);
        }
    }
    
    // Test 19: Partner cannot access customer management
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/customers', null, {
            'Authorization': `Bearer ${partnerToken}`
        });
        
        if (statusCode === 403 && !response.success) {
            logTest('Partner Cannot Access Customers', 'PASS');
        } else {
            logTest('Partner Cannot Access Customers', 'FAIL', `Expected 403, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Partner Cannot Access Customers', 'FAIL', error.message);
    }
    
    // Test 20: Access customer management without auth
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/customers');
        
        if (statusCode === 401 && !response.success) {
            logTest('Customer Management No Auth', 'PASS');
        } else {
            logTest('Customer Management No Auth', 'FAIL', `Expected 401, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Customer Management No Auth', 'FAIL', error.message);
    }
    
    // Test 21: Register as customer and access profile
    try {
        const customerRegData = {
            email: `customer.reg.${timestamp}@example.com`,
            password: 'customer123',
            name: 'Self-Registered Customer'
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/auth/register', customerRegData);
        
        if (statusCode === 201 && response.success) {
            customerToken = response.data.token;
            logTest('Customer Self Registration', 'PASS');
        } else {
            logTest('Customer Self Registration', 'FAIL', `Expected 201, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Customer Self Registration', 'FAIL', error.message);
    }
    
    // Test 22: Customer can view own profile
    if (customerToken) {
        try {
            const { statusCode, response } = await makeRequest('GET', '/api/auth/me', null, {
                'Authorization': `Bearer ${customerToken}`
            });
            
            if (statusCode === 200 && response.success && response.data.role === 'CUSTOMER') {
                logTest('Customer View Own Profile', 'PASS');
            } else {
                logTest('Customer View Own Profile', 'FAIL', `Expected 200, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Customer View Own Profile', 'FAIL', error.message);
        }
    }
    
    // Test 23: Customer can update own profile
    if (customerToken) {
        try {
            const updateData = {
                name: 'Updated Self-Registered Customer'
            };
            
            const { statusCode, response } = await makeRequest('PUT', '/api/auth/me', updateData, {
                'Authorization': `Bearer ${customerToken}`
            });
            
            if (statusCode === 200 && response.success) {
                logTest('Customer Update Own Profile', 'PASS');
            } else {
                logTest('Customer Update Own Profile', 'FAIL', `Expected 200, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Customer Update Own Profile', 'FAIL', error.message);
        }
    }
    
    // Test 24: Get customer statistics (admin only)
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/customers/statistics', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        
        if (statusCode === 200 && response.success) {
            logTest('Get Customer Statistics', 'PASS');
        } else {
            logTest('Get Customer Statistics', 'FAIL', `Expected 200, got ${statusCode}: ${JSON.stringify(response)}`);
        }
    } catch (error) {
        logTest('Get Customer Statistics', 'FAIL', error.message);
    }
    
    // Test 25: Deactivate customer account
    if (testCustomerId) {
        try {
            const updateData = {
                isActive: false
            };
            
            const { statusCode, response } = await makeRequest('PATCH', `/api/customers/${testCustomerId}/status`, updateData, {
                'Authorization': `Bearer ${adminToken}`
            });
            
            if (statusCode === 200 && response.success) {
                logTest('Deactivate Customer Account', 'PASS');
            } else {
                logTest('Deactivate Customer Account', 'FAIL', `Expected 200, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Deactivate Customer Account', 'FAIL', error.message);
        }
    }
    
    // Print summary
    console.log('\\n📊 Customer Management Test Summary:');
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
        await runCustomerTests();
    } catch (error) {
        console.log('❌ API is not running. Please start the API server first.');
        console.log('   Run: cd api && npm run dev');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { runCustomerTests, makeRequest };