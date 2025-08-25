// Test Runner - Executes all test files in the tests directory
const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const fs = require('fs');

const execAsync = util.promisify(exec);

const API_BASE = 'http://localhost:3001';

// Test runner configuration
const testFiles = [
    'auth.test.js',
    'auth-simple.test.js', 
    'auth-security.test.js',
    'address.test.js',
    'product.test.js',
    'partner.test.js',
    'database.test.js',
    'analytics.test.js',
    'pix-transactions.test.js',
    'promoter.test.js',
    'customers.test.js',
    'whatsapp.test.js'
];

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

// Overall test results
let overallResults = {
    totalFiles: 0,
    passedFiles: 0,
    failedFiles: 0,
    totalTests: 0,
    passedTests: 0,
    failedTests: 0,
    results: [],
    startTime: null,
    endTime: null,
    totalDuration: 0
};

function logSection(title) {
    console.log(`\n${colors.blue}${colors.bold}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.blue}${colors.bold} ${title}${colors.reset}`);
    console.log(`${colors.blue}${colors.bold}${'='.repeat(60)}${colors.reset}\n`);
}

function logResult(message, isSuccess = true) {
    const color = isSuccess ? colors.green : colors.red;
    const icon = isSuccess ? '✅' : '❌';
    console.log(`${color}${icon} ${message}${colors.reset}`);
}

async function runDatabaseSeed() {
    try {
        console.log(`${colors.yellow}🌱 Running database seed...${colors.reset}`);
        const startTime = Date.now();
        
        const { stdout, stderr } = await execAsync('npx prisma db seed', {
            cwd: path.join(__dirname, '..')
        });
        
        const duration = Date.now() - startTime;
        
        if (stderr && !stderr.includes('🌱')) {
            console.log(`${colors.yellow}⚠️  Seed warnings:${colors.reset}`);
            console.log(stderr);
        }
        
        console.log(stdout);
        logResult(`Database seeded successfully (${duration}ms)`);
        return true;
        
    } catch (error) {
        console.log(`${colors.red}❌ Database seed failed:${colors.reset}`);
        if (error.stdout) {
            console.log(error.stdout);
        }
        if (error.stderr) {
            console.log(`${colors.red}Error: ${error.stderr}${colors.reset}`);
        }
        logResult(`Seed failed: ${error.message}`, false);
        return false;
    }
}

async function checkApiHealth() {
    try {
        const { stdout } = await execAsync(`curl -s -w "%{http_code}" -o /dev/null ${API_BASE}/health`);
        const statusCode = parseInt(stdout);
        
        if (statusCode === 200) {
            logResult('API is running and healthy');
            return true;
        } else {
            logResult(`API returned status code: ${statusCode}`, false);
            return false;
        }
    } catch (error) {
        logResult(`API health check failed: ${error.message}`, false);
        return false;
    }
}

async function runTestFile(filename) {
    const filePath = path.join(__dirname, filename);
    
    console.log(`\n${colors.yellow}📁 Running: ${filename}${colors.reset}`);
    console.log(`${colors.yellow}${'─'.repeat(50)}${colors.reset}`);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
        logResult(`File not found: ${filename}`, false);
        return {
            filename,
            success: false,
            error: 'File not found',
            passed: 0,
            failed: 1,
            total: 1,
            duration: 0
        };
    }
    
    const startTime = Date.now();
    
    try {
        // Execute the test file
        const { stdout, stderr } = await execAsync(`node "${filePath}"`);
        const duration = Date.now() - startTime;
        
        // Parse test results from output
        const result = parseTestOutput(stdout, filename);
        result.duration = duration;
        
        if (stderr) {
            console.log(`${colors.yellow}⚠️  Warnings:${colors.reset}`);
            console.log(stderr);
        }
        
        console.log(stdout);
        
        // Summary for this file
        console.log(`\n${colors.blue}📊 ${filename} Summary:${colors.reset}`);
        logResult(`Duration: ${duration}ms`);
        logResult(`Tests Passed: ${result.passed}/${result.total}`);
        
        if (result.failed > 0) {
            logResult(`Tests Failed: ${result.failed}`, false);
        }
        
        return result;
        
    } catch (error) {
        const duration = Date.now() - startTime;
        
        // For test files that exit with non-zero but have output, parse the output
        if (error.stdout) {
            console.log(error.stdout);
            
            // Parse test results from the output even if exit code is non-zero
            const result = parseTestOutput(error.stdout, filename);
            result.duration = duration;
            result.success = result.failed === 0 && result.total > 0;
            
            if (error.stderr) {
                console.log(`${colors.yellow}⚠️  Warnings:${colors.reset}`);
                console.log(error.stderr);
            }
            
            // Summary for this file
            console.log(`\n${colors.blue}📊 ${filename} Summary:${colors.reset}`);
            logResult(`Duration: ${duration}ms`);
            logResult(`Tests Passed: ${result.passed}/${result.total}`);
            
            if (result.failed > 0) {
                logResult(`Tests Failed: ${result.failed}`, false);
            }
            
            return result;
        } else {
            console.log(`${colors.red}❌ Test execution failed:${colors.reset}`);
            console.log(`${colors.red}Error: ${error.message}${colors.reset}`);
            
            return {
                filename,
                success: false,
                error: error.message,
                passed: 0,
                failed: 1,
                total: 1,
                duration
            };
        }
    }
}

function parseTestOutput(output, filename) {
    // Try to extract test results from the output
    let passed = 0;
    let failed = 0;
    let total = 0;
    
    // Look for patterns like "✅ Passed: X", "❌ Failed: Y", "📋 Total: Z" (English and Portuguese)
    const passedMatch = output.match(/✅ (?:Passed|Testes aprovados): (\d+)/) || output.match(/✅ Passed: (\d+)/);
    const failedMatch = output.match(/❌ (?:Failed|Testes falhados): (\d+)/) || output.match(/❌ Failed: (\d+)/);
    const totalMatch = output.match(/📋 (?:Total|Total de testes): (\d+)/) || output.match(/📝 Total de testes: (\d+)/);
    
    if (passedMatch) passed = parseInt(passedMatch[1]);
    if (failedMatch) failed = parseInt(failedMatch[1]);
    if (totalMatch) total = parseInt(totalMatch[1]);
    
    // If we can't parse the structured output, try counting ✅ and ❌ symbols
    if (total === 0) {
        // Count test result symbols, excluding summary sections
        const lines = output.split('\n');
        let testPassed = 0;
        let testFailed = 0;
        
        for (const line of lines) {
            // Skip summary sections (English and Portuguese)
            if (line.includes('Test Summary') || 
                line.includes('RESUMO DOS TESTES') ||
                line.includes('Passed:') || 
                line.includes('Failed:') ||
                line.includes('Total:') ||
                line.includes('Testes aprovados:') ||
                line.includes('Testes falhados:') ||
                line.includes('Total de testes:') ||
                line.includes('Success Rate:') ||
                line.includes('API está rodando') ||
                line.includes('Login do Partner') ||
                line.includes('Partner ID:') ||
                line.includes('Product ID:') ||
                line.includes('Total produtos:')) {
                continue;
            }
            
            // Count actual test results
            if (line.trim().startsWith('✅')) {
                testPassed++;
            } else if (line.trim().startsWith('❌') && !line.includes('Failed:')) {
                testFailed++;
            }
        }
        
        passed = testPassed;
        failed = testFailed;
        total = passed + failed;
    }
    
    return {
        filename,
        success: failed === 0 && total > 0,
        passed,
        failed,
        total,
        error: failed > 0 ? `${failed} tests failed` : null
    };
}

function generateHtmlReport() {
    const successRate = overallResults.totalTests > 0 
        ? ((overallResults.passedTests / overallResults.totalTests) * 100).toFixed(1)
        : 0;
    
    const allPassed = overallResults.failedFiles === 0 && overallResults.failedTests === 0;
    const timestamp = new Date().toISOString();
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>eBrecho API Test Results</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
            color: white;
            padding: 40px;
            text-align: center;
        }
        
        .header h1 {
            font-size: 2.5rem;
            margin-bottom: 10px;
            font-weight: 300;
        }
        
        .header .subtitle {
            font-size: 1.1rem;
            opacity: 0.9;
            margin-bottom: 20px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 8px 20px;
            border-radius: 50px;
            font-weight: 600;
            font-size: 1rem;
        }
        
        .status-success {
            background: #27ae60;
            color: white;
        }
        
        .status-warning {
            background: #f39c12;
            color: white;
        }
        
        .status-error {
            background: #e74c3c;
            color: white;
        }
        
        .summary {
            padding: 40px;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 30px;
        }
        
        .metric-card {
            background: #f8f9fa;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            border-left: 4px solid #3498db;
        }
        
        .metric-card.success {
            border-left-color: #27ae60;
        }
        
        .metric-card.warning {
            border-left-color: #f39c12;
        }
        
        .metric-card.error {
            border-left-color: #e74c3c;
        }
        
        .metric-number {
            font-size: 3rem;
            font-weight: 700;
            color: #2c3e50;
            margin-bottom: 10px;
        }
        
        .metric-label {
            font-size: 1.1rem;
            color: #7f8c8d;
            font-weight: 500;
        }
        
        .files-section {
            padding: 40px;
            background: #f8f9fa;
        }
        
        .section-title {
            font-size: 1.8rem;
            color: #2c3e50;
            margin-bottom: 30px;
            font-weight: 600;
        }
        
        .file-grid {
            display: grid;
            gap: 20px;
        }
        
        .file-card {
            background: white;
            border-radius: 12px;
            padding: 25px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
            border-left: 4px solid #3498db;
        }
        
        .file-card.success {
            border-left-color: #27ae60;
        }
        
        .file-card.error {
            border-left-color: #e74c3c;
        }
        
        .file-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .file-name {
            font-size: 1.2rem;
            font-weight: 600;
            color: #2c3e50;
        }
        
        .file-status {
            font-size: 1.5rem;
        }
        
        .file-stats {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
        }
        
        .stat {
            display: flex;
            flex-direction: column;
            align-items: center;
        }
        
        .stat-number {
            font-size: 1.5rem;
            font-weight: 700;
            margin-bottom: 5px;
        }
        
        .stat-label {
            font-size: 0.9rem;
            color: #7f8c8d;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .success-rate {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 20px;
            font-weight: 600;
            font-size: 0.9rem;
        }
        
        .rate-excellent {
            background: #d5f4e6;
            color: #27ae60;
        }
        
        .rate-good {
            background: #fef5e7;
            color: #f39c12;
        }
        
        .rate-poor {
            background: #fadbd8;
            color: #e74c3c;
        }
        
        .footer {
            padding: 30px 40px;
            background: #2c3e50;
            color: white;
            text-align: center;
            font-size: 0.9rem;
            opacity: 0.8;
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: #ecf0f1;
            border-radius: 4px;
            overflow: hidden;
            margin: 15px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #27ae60 0%, #2ecc71 100%);
            transition: width 0.3s ease;
        }
        
        @media (max-width: 768px) {
            .summary {
                grid-template-columns: 1fr;
                padding: 20px;
            }
            
            .files-section {
                padding: 20px;
            }
            
            .header {
                padding: 20px;
            }
            
            .header h1 {
                font-size: 2rem;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 eBrecho API Test Results</h1>
            <div class="subtitle">Comprehensive API Test Suite Report</div>
            <div class="status-badge ${allPassed ? 'status-success' : 'status-error'}">
                ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${successRate}%"></div>
            </div>
            <div style="margin-top: 10px; font-size: 1.1rem;">
                Success Rate: ${successRate}%
            </div>
        </div>
        
        <div class="summary">
            <div class="metric-card">
                <div class="metric-number">${overallResults.totalFiles}</div>
                <div class="metric-label">Test Files</div>
            </div>
            
            <div class="metric-card success">
                <div class="metric-number">${overallResults.passedTests}</div>
                <div class="metric-label">Tests Passed</div>
            </div>
            
            <div class="metric-card ${overallResults.failedTests > 0 ? 'error' : 'success'}">
                <div class="metric-number">${overallResults.failedTests}</div>
                <div class="metric-label">Tests Failed</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-number">${overallResults.totalDuration}ms</div>
                <div class="metric-label">Total Duration</div>
            </div>
        </div>
        
        <div class="files-section">
            <h2 class="section-title">📁 Test File Results</h2>
            <div class="file-grid">
                ${overallResults.results.map(result => {
                    const fileRate = result.total > 0 ? ((result.passed / result.total) * 100).toFixed(1) : 0;
                    const rateClass = fileRate >= 90 ? 'rate-excellent' : fileRate >= 70 ? 'rate-good' : 'rate-poor';
                    
                    return `
                    <div class="file-card ${result.success ? 'success' : 'error'}">
                        <div class="file-header">
                            <div class="file-name">${result.filename}</div>
                            <div class="file-status">${result.success ? '✅' : '❌'}</div>
                        </div>
                        <div class="file-stats">
                            <div class="stat">
                                <div class="stat-number" style="color: #27ae60">${result.passed}</div>
                                <div class="stat-label">Passed</div>
                            </div>
                            <div class="stat">
                                <div class="stat-number" style="color: #e74c3c">${result.failed}</div>
                                <div class="stat-label">Failed</div>
                            </div>
                            <div class="stat">
                                <div class="stat-number" style="color: #3498db">${result.total}</div>
                                <div class="stat-label">Total</div>
                            </div>
                            <div class="stat">
                                <div class="stat-number" style="color: #9b59b6">${result.duration}ms</div>
                                <div class="stat-label">Duration</div>
                            </div>
                            <div class="stat">
                                <div class="success-rate ${rateClass}">${fileRate}%</div>
                                <div class="stat-label">Success Rate</div>
                            </div>
                        </div>
                    </div>
                    `;
                }).join('')}
            </div>
        </div>
        
        <div class="footer">
            Generated on ${timestamp} | eBrecho API Test Suite v1.0
        </div>
    </div>
</body>
</html>`;

    return html;
}

function printOverallSummary() {
    logSection('🎯 OVERALL TEST SUMMARY');
    
    console.log(`${colors.bold}Test Files:${colors.reset}`);
    logResult(`Total Files: ${overallResults.totalFiles}`);
    logResult(`Passed Files: ${overallResults.passedFiles}`);
    if (overallResults.failedFiles > 0) {
        logResult(`Failed Files: ${overallResults.failedFiles}`, false);
    }
    
    console.log(`\n${colors.bold}Individual Tests:${colors.reset}`);
    logResult(`Total Tests: ${overallResults.totalTests}`);
    logResult(`Passed Tests: ${overallResults.passedTests}`);
    if (overallResults.failedTests > 0) {
        logResult(`Failed Tests: ${overallResults.failedTests}`, false);
    }
    
    const successRate = overallResults.totalTests > 0 
        ? ((overallResults.passedTests / overallResults.totalTests) * 100).toFixed(1)
        : 0;
    
    console.log(`\n${colors.bold}Success Rate: ${successRate}%${colors.reset}`);
    
    // File breakdown
    if (overallResults.results.length > 0) {
        console.log(`\n${colors.bold}File Breakdown:${colors.reset}`);
        overallResults.results.forEach(result => {
            const status = result.success ? '✅' : '❌';
            const fileRate = result.total > 0 
                ? ((result.passed / result.total) * 100).toFixed(1)
                : 0;
            console.log(`${status} ${result.filename}: ${result.passed}/${result.total} (${fileRate}%) - ${result.duration}ms`);
        });
    }
    
    // Overall status
    const allPassed = overallResults.failedFiles === 0 && overallResults.failedTests === 0;
    console.log(`\n${colors.bold}Overall Status: ${allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}${colors.reset}`);
    
    // Generate and save HTML report
    try {
        const htmlReport = generateHtmlReport();
        const reportPath = path.join(__dirname, 'test-results.html');
        fs.writeFileSync(reportPath, htmlReport, 'utf8');
        console.log(`\n${colors.bold}📄 HTML Report Generated:${colors.reset}`);
        logResult(`Report saved to: ${reportPath}`);
        logResult(`Open in browser: file://${reportPath}`);
    } catch (error) {
        console.log(`${colors.red}❌ Failed to generate HTML report: ${error.message}${colors.reset}`);
    }
}

async function runAllTests() {
    overallResults.startTime = Date.now();
    
    logSection('🚀 EBRECHO API TEST SUITE');
    
    console.log(`${colors.yellow}Testing API at: ${API_BASE}${colors.reset}`);
    console.log(`${colors.yellow}Test files to run: ${testFiles.length}${colors.reset}`);
    console.log(`${colors.yellow}Test files: ${testFiles.join(', ')}${colors.reset}\n`);
    
    // Check API health first
    logSection('🏥 API HEALTH CHECK');
    const isApiHealthy = await checkApiHealth();
    
    if (!isApiHealthy) {
        console.log(`\n${colors.red}❌ API is not available. Please start the API server first.${colors.reset}`);
        console.log(`${colors.yellow}Run: cd api && npm run dev${colors.reset}`);
        process.exit(1);
    }
    
    // Run database seed before tests
    logSection('🌱 DATABASE SETUP');
    const seedSuccess = await runDatabaseSeed();
    
    if (!seedSuccess) {
        console.log(`\n${colors.red}❌ Database seed failed. Tests may not run correctly.${colors.reset}`);
        console.log(`${colors.yellow}Please check database connection and schema.${colors.reset}`);
        // Continue anyway as some tests might still work
    }
    
    // Run each test file
    logSection('🧪 RUNNING TESTS');
    
    for (const filename of testFiles) {
        const result = await runTestFile(filename);
        
        // Update overall results
        overallResults.totalFiles++;
        overallResults.totalTests += result.total;
        overallResults.passedTests += result.passed;
        overallResults.failedTests += result.failed;
        overallResults.results.push(result);
        
        if (result.success) {
            overallResults.passedFiles++;
        } else {
            overallResults.failedFiles++;
        }
        
        // Small delay between tests
        if (testFiles.indexOf(filename) < testFiles.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
    
    // Calculate total duration
    overallResults.endTime = Date.now();
    overallResults.totalDuration = overallResults.endTime - overallResults.startTime;
    
    // Print overall summary
    printOverallSummary();
    
    // Exit with appropriate code
    const exitCode = overallResults.failedFiles > 0 || overallResults.failedTests > 0 ? 1 : 0;
    process.exit(exitCode);
}

// Handle script execution
if (require.main === module) {
    runAllTests().catch(error => {
        console.error(`${colors.red}❌ Test runner failed: ${error.message}${colors.reset}`);
        process.exit(1);
    });
}

module.exports = { runAllTests, runTestFile };