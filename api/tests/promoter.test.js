// Promoter System API Tests using curl and Node.js
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
let promoterToken = '';
let testPromoterId = '';
let testPartnerId = '';
let testInvitationId = '';
let testInvitationCode = '';
let testEventId = '';

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

async function runPromoterTests() {
    console.log('🎯 Starting Promoter System API Tests\\n');
    
    // Generate unique test data
    const timestamp = Date.now();
    const testEmail = `promoter.test.${timestamp}@example.com`;
    const testBusinessName = `Test Business ${timestamp}`;
    testInvitationCode = `INV-${timestamp}`;
    
    // Test 1: Login as admin to get token
    try {
        const loginData = {
            email: 'admin@ebrecho.com.br',
            password: 'admin123'
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/auth/login', loginData);
        
        if (statusCode === 200 && response.success && response.data.user.role === 'ADMIN') {
            logTest('Login Admin for Promoter Tests', 'PASS');
            adminToken = response.data.token;
        } else {
            logTest('Login Admin for Promoter Tests', 'FAIL', `Expected 200, got ${statusCode}`);
            return;
        }
    } catch (error) {
        logTest('Login Admin for Promoter Tests', 'FAIL', error.message);
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
            logTest('Login Partner for Promoter Tests', 'PASS');
            partnerToken = response.data.token;
            testPartnerId = response.data.user.partnerId;
        } else {
            logTest('Login Partner for Promoter Tests', 'FAIL', `Expected 200, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Login Partner for Promoter Tests', 'FAIL', error.message);
    }
    
    // Test 3: Register a new user to become a promoter
    try {
        const userData = {
            email: testEmail,
            password: 'promoter123',
            name: 'Test Promoter User',
            role: 'PROMOTER'
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/auth/register', userData);
        
        if (statusCode === 201 && response.success) {
            logTest('Register Promoter User', 'PASS');
            promoterToken = response.data.token;
        } else {
            logTest('Register Promoter User', 'FAIL', `Expected 201, got ${statusCode}: ${JSON.stringify(response)}`);
        }
    } catch (error) {
        logTest('Register Promoter User', 'FAIL', error.message);
    }
    
    // Test 4: Create a promoter profile
    try {
        const promoterData = {
            businessName: testBusinessName,
            commissionRate: 0.0250,
            invitationQuota: 20,
            territory: 'São Paulo',
            specialization: 'Fashion'
        };
        
        const { statusCode, response } = await makeRequest('POST', '/api/promoter/profile', promoterData, {
            'Authorization': `Bearer ${promoterToken}`
        });
        
        if (statusCode === 201 && response.success) {
            logTest('Create Promoter Profile', 'PASS');
            testPromoterId = response.data.id;
        } else {
            logTest('Create Promoter Profile', 'FAIL', `Expected 201, got ${statusCode}: ${JSON.stringify(response)}`);
        }
    } catch (error) {
        logTest('Create Promoter Profile', 'FAIL', error.message);
    }
    
    // Test 5: Get promoter profile
    if (testPromoterId) {
        try {
            const { statusCode, response } = await makeRequest('GET', '/api/promoter/profile', null, {
                'Authorization': `Bearer ${promoterToken}`
            });
            
            if (statusCode === 200 && response.success && response.data.businessName === testBusinessName) {
                logTest('Get Promoter Profile', 'PASS');
            } else {
                logTest('Get Promoter Profile', 'FAIL', `Expected 200, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Get Promoter Profile', 'FAIL', error.message);
        }
    }
    
    // Test 6: Update promoter profile
    if (testPromoterId) {
        try {
            const updateData = {
                businessName: `${testBusinessName} Updated`,
                territory: 'Rio de Janeiro',
                specialization: 'Vintage Fashion'
            };
            
            const { statusCode, response } = await makeRequest('PUT', '/api/promoter/profile', updateData, {
                'Authorization': `Bearer ${promoterToken}`
            });
            
            if (statusCode === 200 && response.success) {
                logTest('Update Promoter Profile', 'PASS');
            } else {
                logTest('Update Promoter Profile', 'FAIL', `Expected 200, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Update Promoter Profile', 'FAIL', error.message);
        }
    }
    
    // Test 7: Create a partner invitation
    if (testPromoterId) {
        try {
            const invitationData = {
                invitationCode: testInvitationCode,
                targetEmail: `partner.invite.${timestamp}@example.com`,
                targetPhone: '11999887766',
                targetName: 'Test Partner Invite',
                targetBusinessName: 'Test Partner Business',
                personalizedMessage: 'Join our platform and grow your business!',
                invitationType: 'DIRECT',
                expiresIn: 7 // days
            };
            
            const { statusCode, response } = await makeRequest('POST', '/api/promoter/invitations', invitationData, {
                'Authorization': `Bearer ${promoterToken}`
            });
            
            if (statusCode === 201 && response.success) {
                logTest('Create Partner Invitation', 'PASS');
                testInvitationId = response.data.id;
            } else {
                logTest('Create Partner Invitation', 'FAIL', `Expected 201, got ${statusCode}: ${JSON.stringify(response)}`);
            }
        } catch (error) {
            logTest('Create Partner Invitation', 'FAIL', error.message);
        }
    }
    
    // Test 8: Create invitation with duplicate code
    if (testPromoterId) {
        try {
            const invitationData = {
                invitationCode: testInvitationCode, // Same code as above
                targetEmail: `duplicate.invite.${timestamp}@example.com`,
                targetName: 'Duplicate Test',
                invitationType: 'DIRECT'
            };
            
            const { statusCode, response } = await makeRequest('POST', '/api/promoter/invitations', invitationData, {
                'Authorization': `Bearer ${promoterToken}`
            });
            
            if (statusCode === 409 && !response.success) {
                logTest('Create Invitation Duplicate Code', 'PASS');
            } else {
                logTest('Create Invitation Duplicate Code', 'FAIL', `Expected 409, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Create Invitation Duplicate Code', 'FAIL', error.message);
        }
    }
    
    // Test 9: List promoter invitations
    if (testPromoterId) {
        try {
            const { statusCode, response } = await makeRequest('GET', '/api/promoter/invitations', null, {
                'Authorization': `Bearer ${promoterToken}`
            });
            
            if (statusCode === 200 && response.success && Array.isArray(response.data.invitations)) {
                logTest('List Promoter Invitations', 'PASS');
            } else {
                logTest('List Promoter Invitations', 'FAIL', `Expected 200 with invitations array, got ${statusCode}`);
            }
        } catch (error) {
            logTest('List Promoter Invitations', 'FAIL', error.message);
        }
    }
    
    // Test 10: Get invitation by ID
    if (testInvitationId) {
        try {
            const { statusCode, response } = await makeRequest('GET', `/api/promoter/invitations/${testInvitationId}`, null, {
                'Authorization': `Bearer ${promoterToken}`
            });
            
            if (statusCode === 200 && response.success) {
                logTest('Get Invitation by ID', 'PASS');
            } else {
                logTest('Get Invitation by ID', 'FAIL', `Expected 200, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Get Invitation by ID', 'FAIL', error.message);
        }
    }
    
    // Test 11: Update invitation status
    if (testInvitationId) {
        try {
            const updateData = {
                status: 'SENT'
            };
            
            const { statusCode, response } = await makeRequest('PATCH', `/api/promoter/invitations/${testInvitationId}/status`, updateData, {
                'Authorization': `Bearer ${promoterToken}`
            });
            
            if (statusCode === 200 && response.success) {
                logTest('Update Invitation Status', 'PASS');
            } else {
                logTest('Update Invitation Status', 'FAIL', `Expected 200, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Update Invitation Status', 'FAIL', error.message);
        }
    }
    
    // Test 12: Create a promotional event
    if (testPromoterId) {
        try {
            const eventData = {
                name: `Test Event ${timestamp}`,
                description: 'A test promotional event',
                eventType: 'FLASH_SALE',
                startDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // Tomorrow
                endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // Next week
                isPublic: true,
                targetCategories: ['Vestidos', 'Camisas'],
                targetRegions: ['São Paulo', 'Rio de Janeiro'],
                discountPercentage: 20.00,
                maxParticipants: 50,
                participationFee: 0.00
            };
            
            const { statusCode, response } = await makeRequest('POST', '/api/promoter/events', eventData, {
                'Authorization': `Bearer ${promoterToken}`
            });
            
            if (statusCode === 201 && response.success) {
                logTest('Create Promotional Event', 'PASS');
                testEventId = response.data.id;
            } else {
                logTest('Create Promotional Event', 'FAIL', `Expected 201, got ${statusCode}: ${JSON.stringify(response)}`);
            }
        } catch (error) {
            logTest('Create Promotional Event', 'FAIL', error.message);
        }
    }
    
    // Test 13: List promoter events
    if (testPromoterId) {
        try {
            const { statusCode, response } = await makeRequest('GET', '/api/promoter/events', null, {
                'Authorization': `Bearer ${promoterToken}`
            });
            
            if (statusCode === 200 && response.success && Array.isArray(response.data.events)) {
                logTest('List Promoter Events', 'PASS');
            } else {
                logTest('List Promoter Events', 'FAIL', `Expected 200 with events array, got ${statusCode}`);
            }
        } catch (error) {
            logTest('List Promoter Events', 'FAIL', error.message);
        }
    }
    
    // Test 14: Get event by ID
    if (testEventId) {
        try {
            const { statusCode, response } = await makeRequest('GET', `/api/promoter/events/${testEventId}`, null, {
                'Authorization': `Bearer ${promoterToken}`
            });
            
            if (statusCode === 200 && response.success) {
                logTest('Get Event by ID', 'PASS');
            } else {
                logTest('Get Event by ID', 'FAIL', `Expected 200, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Get Event by ID', 'FAIL', error.message);
        }
    }
    
    // Test 15: Update event
    if (testEventId) {
        try {
            const updateData = {
                name: `Updated Test Event ${timestamp}`,
                description: 'An updated test promotional event',
                discountPercentage: 25.00
            };
            
            const { statusCode, response } = await makeRequest('PUT', `/api/promoter/events/${testEventId}`, updateData, {
                'Authorization': `Bearer ${promoterToken}`
            });
            
            if (statusCode === 200 && response.success) {
                logTest('Update Event', 'PASS');
            } else {
                logTest('Update Event', 'FAIL', `Expected 200, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Update Event', 'FAIL', error.message);
        }
    }
    
    // Test 16: Invite partner to event
    if (testEventId && testPartnerId) {
        try {
            const inviteData = {
                partnerId: testPartnerId,
                personalizedMessage: 'Join our exclusive flash sale event!'
            };
            
            const { statusCode, response } = await makeRequest('POST', `/api/promoter/events/${testEventId}/participants`, inviteData, {
                'Authorization': `Bearer ${promoterToken}`
            });
            
            if (statusCode === 201 && response.success) {
                logTest('Invite Partner to Event', 'PASS');
            } else {
                logTest('Invite Partner to Event', 'FAIL', `Expected 201, got ${statusCode}: ${JSON.stringify(response)}`);
            }
        } catch (error) {
            logTest('Invite Partner to Event', 'FAIL', error.message);
        }
    }
    
    // Test 17: List event participants
    if (testEventId) {
        try {
            const { statusCode, response } = await makeRequest('GET', `/api/promoter/events/${testEventId}/participants`, null, {
                'Authorization': `Bearer ${promoterToken}`
            });
            
            if (statusCode === 200 && response.success) {
                logTest('List Event Participants', 'PASS');
            } else {
                logTest('List Event Participants', 'FAIL', `Expected 200, got ${statusCode}`);
            }
        } catch (error) {
            logTest('List Event Participants', 'FAIL', error.message);
        }
    }
    
    // Test 18: Get promoter commissions
    if (testPromoterId) {
        try {
            const { statusCode, response } = await makeRequest('GET', '/api/promoter/commissions', null, {
                'Authorization': `Bearer ${promoterToken}`
            });
            
            if (statusCode === 200 && response.success) {
                logTest('Get Promoter Commissions', 'PASS');
            } else {
                logTest('Get Promoter Commissions', 'FAIL', `Expected 200, got ${statusCode}: ${JSON.stringify(response)}`);
            }
        } catch (error) {
            logTest('Get Promoter Commissions', 'FAIL', error.message);
        }
    }
    
    // Test 19: Get commission statistics
    if (testPromoterId) {
        try {
            const { statusCode, response } = await makeRequest('GET', '/api/promoter/commissions/statistics', null, {
                'Authorization': `Bearer ${promoterToken}`
            });
            
            if (statusCode === 200 && response.success) {
                logTest('Get Commission Statistics', 'PASS');
            } else {
                logTest('Get Commission Statistics', 'FAIL', `Expected 200, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Get Commission Statistics', 'FAIL', error.message);
        }
    }
    
    // Test 20: Admin can view all promoters
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/admin/promoters', null, {
            'Authorization': `Bearer ${adminToken}`
        });
        
        if (statusCode === 200 && response.success) {
            logTest('Admin View All Promoters', 'PASS');
        } else {
            logTest('Admin View All Promoters', 'FAIL', `Expected 200, got ${statusCode}: ${JSON.stringify(response)}`);
        }
    } catch (error) {
        logTest('Admin View All Promoters', 'FAIL', error.message);
    }
    
    // Test 21: Admin can approve/reject promoter
    if (testPromoterId) {
        try {
            const approvalData = {
                status: 'APPROVED',
                approvedAt: new Date().toISOString()
            };
            
            const { statusCode, response } = await makeRequest('PATCH', `/api/admin/promoters/${testPromoterId}/approval`, approvalData, {
                'Authorization': `Bearer ${adminToken}`
            });
            
            if (statusCode === 200 && response.success) {
                logTest('Admin Approve Promoter', 'PASS');
            } else {
                logTest('Admin Approve Promoter', 'FAIL', `Expected 200, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Admin Approve Promoter', 'FAIL', error.message);
        }
    }
    
    // Test 22: Partner cannot access promoter endpoints
    try {
        const { statusCode, response } = await makeRequest('GET', '/api/promoter/profile', null, {
            'Authorization': `Bearer ${partnerToken}`
        });
        
        if (statusCode === 403 && !response.success) {
            logTest('Partner Cannot Access Promoter Endpoints', 'PASS');
        } else {
            logTest('Partner Cannot Access Promoter Endpoints', 'FAIL', `Expected 403, got ${statusCode}`);
        }
    } catch (error) {
        logTest('Partner Cannot Access Promoter Endpoints', 'FAIL', error.message);
    }
    
    // Test 23: Promoter dashboard statistics
    if (testPromoterId) {
        try {
            const { statusCode, response } = await makeRequest('GET', '/api/promoter/dashboard/statistics', null, {
                'Authorization': `Bearer ${promoterToken}`
            });
            
            if (statusCode === 200 && response.success) {
                logTest('Get Promoter Dashboard Statistics', 'PASS');
            } else {
                logTest('Get Promoter Dashboard Statistics', 'FAIL', `Expected 200, got ${statusCode}`);
            }
        } catch (error) {
            logTest('Get Promoter Dashboard Statistics', 'FAIL', error.message);
        }
    }
    
    // Test 24: Create bulk invitations
    if (testPromoterId) {
        try {
            const bulkData = {
                invitations: [
                    {
                        targetEmail: `bulk1.${timestamp}@example.com`,
                        targetName: 'Bulk Invite 1',
                        targetBusinessName: 'Bulk Business 1'
                    },
                    {
                        targetEmail: `bulk2.${timestamp}@example.com`,
                        targetName: 'Bulk Invite 2',
                        targetBusinessName: 'Bulk Business 2'
                    }
                ],
                invitationType: 'BULK',
                personalizedMessage: 'Bulk invitation to join our platform'
            };
            
            const { statusCode, response } = await makeRequest('POST', '/api/promoter/invitations/bulk', bulkData, {
                'Authorization': `Bearer ${promoterToken}`
            });
            
            if (statusCode === 201 && response.success) {
                logTest('Create Bulk Invitations', 'PASS');
            } else {
                logTest('Create Bulk Invitations', 'FAIL', `Expected 201, got ${statusCode}: ${JSON.stringify(response)}`);
            }
        } catch (error) {
            logTest('Create Bulk Invitations', 'FAIL', error.message);
        }
    }
    
    // Test 25: Promoter cannot exceed invitation quota
    if (testPromoterId) {
        try {
            // Try to create more invitations than the quota allows
            const invitationData = {
                invitationCode: `QUOTA-${timestamp}`,
                targetEmail: `quota.test.${timestamp}@example.com`,
                targetName: 'Quota Test',
                invitationType: 'DIRECT'
            };
            
            // Create invitations up to the quota limit
            let quotaExceeded = false;
            for (let i = 0; i < 25; i++) { // Try to exceed the quota of 20
                const response = await makeRequest('POST', '/api/promoter/invitations', {
                    ...invitationData,
                    invitationCode: `QUOTA-${timestamp}-${i}`,
                    targetEmail: `quota.test.${timestamp}.${i}@example.com`
                }, {
                    'Authorization': `Bearer ${promoterToken}`
                });
                
                if (response.statusCode === 422 || response.statusCode === 400) {
                    quotaExceeded = true;
                    break;
                }
            }
            
            if (quotaExceeded) {
                logTest('Promoter Quota Enforcement', 'PASS');
            } else {
                logTest('Promoter Quota Enforcement', 'FAIL', 'Quota was not enforced');
            }
        } catch (error) {
            logTest('Promoter Quota Enforcement', 'FAIL', error.message);
        }
    }
    
    // Print summary
    console.log('\\n📊 Promoter System Test Summary:');
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
        await runPromoterTests();
    } catch (error) {
        console.log('❌ API is not running. Please start the API server first.');
        console.log('   Run: cd api && npm run dev');
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { runPromoterTests, makeRequest };