// Analytics API Tests using curl and Node.js
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
let testSessionId = '';
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
        
        // Add data for POST/PUT requests
        if (data && (method === 'POST' || method === 'PUT')) {
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

async function runAnalyticsTests() {
    console.log('📊 Starting Analytics API Tests\\n');
    
    // Generate unique test data
    const timestamp = Date.now();
    testSessionId = `test-session-${timestamp}`;
    
    // Test 1: Login as admin to get token
    try {
        const loginData = {
            email: 'admin@ebrecho.com.br',
            password: 'admin123'
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/auth/login', loginData);
        
        if (statusCode === 200 && response.success && response.data.user.role === 'ADMIN') {
            logTest('Login Admin for Analytics Tests', 'PASS');
            adminToken = response.data.token;
        } else {
            logTest('Login Admin for Analytics Tests', 'FAIL', `Expected 200, got ${statusCode}`);
            return;
        }
    } catch (error) {
        logTest('Login Admin for Analytics Tests', 'FAIL', error.message);
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
            logTest('Login Partner for Analytics Tests', 'PASS');
            partnerToken = response.data.token;
            testPartnerId = response.data.user.partnerId;
        } else {
            logTest('Login Partner for Analytics Tests', 'FAIL', `Expected 200, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Login Partner for Analytics Tests', 'FAIL', error.message);
    }
    
    // Test 3: Create a new user session (no auth required)
    try {
        const sessionData = {
            sessionId: testSessionId,
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            referrer: 'https://google.com',
            landingPage: '/produtos',
            partnerId: testPartnerId
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/analytics/sessions', sessionData);
        
        if (statusCode === 201 && response.success) {
            logTest('Create User Session', 'PASS');
        } else {
            logTest('Create User Session', 'FAIL', `Expected 201, got ${statusCode}: ${JSON.stringify(response)}`);
        }
    } catch (error) {
        logTest('Create User Session', 'FAIL', error.message);
    }
    
    // Test 4: Create session with missing required fields
    try {
        const sessionData = {
            // Missing sessionId
            ipAddress: '192.168.1.101'
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/analytics/sessions', sessionData);
        
        if (statusCode === 422 && !response.success) {
            logTest('Create Session Invalid Data', 'PASS');
        } else {
            logTest('Create Session Invalid Data', 'FAIL', `Expected 422, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Create Session Invalid Data', 'FAIL', error.message);
    }
    
    // Test 5: Get session details (with auth)
    try {
        const { statusCode, response } = await makeRequest('GET', `/api/analytics/sessions/${testSessionId}`, null, {
            'Authorization': `Bearer ${adminToken}`
        });
        
        if (statusCode === 200 && response.success) {
            logTest('Get Session Details', 'PASS');
        } else {
            logTest('Get Session Details', 'FAIL', `Expected 200, got ${statusCode}: ${JSON.stringify(response)}`);
        }
    } catch (error) {
        logTest('Get Session Details', 'FAIL', error.message);
    }
    
    // Test 6: Get session details without auth
    try {
        const { statusCode, response } = await makeRequest('GET', `/api/analytics/sessions/${testSessionId}`);
        
        if (statusCode === 401 && !response.success) {
            logTest('Get Session No Auth', 'PASS');
        } else {
            logTest('Get Session No Auth', 'FAIL', `Expected 401, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Get Session No Auth', 'FAIL', error.message);
    }
    
    // Test 7: Update session information
    try {
        const updateData = {
            city: 'São Paulo',
            country: 'Brazil',
            device: 'Desktop',
            browser: 'Chrome'
        };
        
        const { statusCode, response } = await makeRequest('PUT', `/api/analytics/sessions/${testSessionId}`, updateData);
        
        if (statusCode === 200 && response.success) {
            logTest('Update Session Information', 'PASS');
        } else {
            logTest('Update Session Information', 'FAIL', `Expected 200, got ${statusCode}: ${JSON.stringify(response)}`);
        }
    } catch (error) {
        logTest('Update Session Information', 'FAIL', error.message);
    }
    
    // Test 8: Track a page view
    try {
        const pageViewData = {
            sessionId: testSessionId,
            page: '/produtos/vintage-dress',
            title: 'Vestido Vintage - eBrecho',
            timeSpent: 45,
            partnerId: testPartnerId
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/analytics/page-views', pageViewData);
        
        if (statusCode === 201 && response.success) {
            logTest('Track Page View', 'PASS');
        } else {
            logTest('Track Page View', 'FAIL', `Expected 201, got ${statusCode}: ${JSON.stringify(response)}`);
        }
    } catch (error) {
        logTest('Track Page View', 'FAIL', error.message);
    }
    
    // Test 9: Track page view with missing required fields
    try {
        const pageViewData = {
            // Missing sessionId and page
            title: 'Some Page'
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/analytics/page-views', pageViewData);
        
        if (statusCode === 422 && !response.success) {
            logTest('Track Page View Invalid Data', 'PASS');
        } else {
            logTest('Track Page View Invalid Data', 'FAIL', `Expected 422, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Track Page View Invalid Data', 'FAIL', error.message);
    }
    
    // Test 10: Track user activity
    try {
        const activityData = {
            sessionId: testSessionId,
            page: '/produtos/vintage-dress',
            elementId: 'add-to-cart-btn',
            elementText: 'Adicionar ao Carrinho',
            elementType: 'button',
            partnerId: testPartnerId
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/analytics/activities', activityData);
        
        if (statusCode === 201 && response.success) {
            logTest('Track User Activity', 'PASS');
        } else {
            logTest('Track User Activity', 'FAIL', `Expected 201, got ${statusCode}: ${JSON.stringify(response)}`);
        }
    } catch (error) {
        logTest('Track User Activity', 'FAIL', error.message);
    }
    
    // Test 11: Track multiple activities
    try {
        const activities = [
            {
                sessionId: testSessionId,
                page: '/produtos/vintage-dress',
                elementId: 'product-image',
                elementText: '',
                elementType: 'image'
            },
            {
                sessionId: testSessionId,
                page: '/produtos/vintage-dress',
                elementId: 'size-selector',
                elementText: 'Tamanho M',
                elementType: 'select'
            }
        ];
        
        let passedActivities = 0;
        for (const activity of activities) {
            const { statusCode, response } = await makeRequest('POST', '/api/analytics/activities', activity);
            if (statusCode === 201 && response.success) {
                passedActivities++;
            }
        }
        
        if (passedActivities === activities.length) {
            logTest('Track Multiple Activities', 'PASS');
        } else {
            logTest('Track Multiple Activities', 'FAIL', `Only ${passedActivities}/${activities.length} activities tracked`);
        }
    } catch (error) {
        logTest('Track Multiple Activities', 'FAIL', error.message);
    }
    
    // Test 12: Get recent user activities (with auth)
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/analytics/activities/recent', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        
        if (statusCode === 200 && response.success) {
            logTest('Get Recent Activities', 'PASS');
        } else {
            logTest('Get Recent Activities', 'FAIL', `Expected 200, got ${statusCode}: ${JSON.stringify(response)}`);
        }
    } catch (error) {
        logTest('Get Recent Activities', 'FAIL', error.message);
    }
    
    // Test 13: Get recent activities with pagination
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/analytics/activities/recent?page=1&limit=10', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        
        if (statusCode === 200 && response.success) {
            logTest('Get Recent Activities with Pagination', 'PASS');
        } else {
            logTest('Get Recent Activities with Pagination', 'FAIL', `Expected 200, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Get Recent Activities with Pagination', 'FAIL', error.message);
    }
    
    // Test 14: Get recent activities without auth
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/analytics/activities/recent');
        
        if (statusCode === 401 && !response.success) {
            logTest('Get Recent Activities No Auth', 'PASS');
        } else {
            logTest('Get Recent Activities No Auth', 'FAIL', `Expected 401, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Get Recent Activities No Auth', 'FAIL', error.message);
    }
    
    // Test 15: Get recent page views (with auth)
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/analytics/page-views/recent', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        
        if (statusCode === 200 && response.success) {
            logTest('Get Recent Page Views', 'PASS');
        } else {
            logTest('Get Recent Page Views', 'FAIL', `Expected 200, got ${statusCode}: ${JSON.stringify(response)}`);
        }
    } catch (error) {
        logTest('Get Recent Page Views', 'FAIL', error.message);
    }
    
    // Test 16: Get recent page views with partner filter
    if (testPartnerId) {
        try {
            const { statusCode, response } = await makeRequest('GET', `/api/analytics/page-views/recent?partnerId=${testPartnerId}`, null, {
                'Authorization': `Bearer ${adminToken}`
            });
            
            if (statusCode === 200 && response.success) {
                logTest('Get Recent Page Views by Partner', 'PASS');
            } else {
                logTest('Get Recent Page Views by Partner', 'FAIL', `Expected 200, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Get Recent Page Views by Partner', 'FAIL', error.message);
        }
    }
    
    // Test 17: Get recent sessions (with auth)
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/analytics/sessions/recent', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        
        if (statusCode === 200 && response.success) {
            logTest('Get Recent Sessions', 'PASS');
        } else {
            logTest('Get Recent Sessions', 'FAIL', `Expected 200, got ${statusCode}: ${JSON.stringify(response)}`);
        }
    } catch (error) {
        logTest('Get Recent Sessions', 'FAIL', error.message);
    }
    
    // Test 18: Partner can only access their own analytics
    if (partnerToken && testPartnerId) {
        try {
            const { statusCode, response } = await makeRequest('GET', '/api/analytics/activities/recent', null, {
                'Authorization': `Bearer ${partnerToken}`
            });
            
            if (statusCode === 200 && response.success) {
                logTest('Partner Access Own Analytics', 'PASS');
            } else {
                logTest('Partner Access Own Analytics', 'FAIL', `Expected 200, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Partner Access Own Analytics', 'FAIL', error.message);
        }
    }
    
    // Test 19: Test date range filtering
    try {
        const startDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
        const endDate = new Date().toISOString(); // now
        
        const { statusCode, response } = await makeRequest('GET', `/api/analytics/activities/recent?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`, null, {
            'Authorization': `Bearer ${adminToken}`
        });
        
        if (statusCode === 200 && response.success) {
            logTest('Get Activities with Date Range', 'PASS');
        } else {
            logTest('Get Activities with Date Range', 'FAIL', `Expected 200, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Get Activities with Date Range', 'FAIL', error.message);
    }
    
    // Test 20: Test ordering options
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/analytics/activities/recent?orderBy=createdAt&orderDirection=asc', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        
        if (statusCode === 200 && response.success) {
            logTest('Get Activities with Custom Ordering', 'PASS');
        } else {
            logTest('Get Activities with Custom Ordering', 'FAIL', `Expected 200, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Get Activities with Custom Ordering', 'FAIL', error.message);
    }
    
    // Print summary
    console.log('\\n📊 Analytics Test Summary:');
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
        await runAnalyticsTests();
    } catch (error) {
        console.log('❌ API is not running. Please start the API server first.');
        console.log('   Run: cd api && npm run dev');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { runAnalyticsTests, makeRequest };