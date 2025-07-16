#!/usr/bin/env node

/**
 * LegalynX System Test Script
 * Run with: node test-system.js
 * 
 * Tests:
 * 1. Database Connection
 * 2. Environment Variables
 * 3. API Endpoints
 * 4. RAG System (if running)
 * 5. Email Service
 * 6. File System
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// ANSI color codes for pretty output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m'
};

// Test results storage
const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    tests: []
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(testName, status, details = '') {
    const statusColor = status === 'PASS' ? 'green' : status === 'FAIL' ? 'red' : 'yellow';
    const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
    
    log(`${icon} ${testName}: ${status}`, statusColor);
    if (details) log(`   ${details}`, 'cyan');
    
    results.tests.push({ testName, status, details });
    if (status === 'PASS') results.passed++;
    else if (status === 'FAIL') results.failed++;
    else results.warnings++;
}

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const isHttps = url.startsWith('https');
        const client = isHttps ? https : http;
        
        const req = client.request(url, {
            method: options.method || 'GET',
            headers: options.headers || {},
            timeout: 10000,
            ...options
        }, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = data ? JSON.parse(data) : {};
                    resolve({ status: res.statusCode, data: parsed, raw: data });
                } catch (e) {
                    resolve({ status: res.statusCode, data: null, raw: data });
                }
            });
        });
        
        req.on('error', reject);
        req.on('timeout', () => reject(new Error('Request timeout')));
        
        if (options.body) {
            req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
        }
        
        req.end();
    });
}

// Test 1: Environment Variables
async function testEnvironmentVariables() {
    log('\n🔧 Testing Environment Variables...', 'bold');
    
    const requiredEnvVars = [
        'DATABASE_URL',
        'JWT_SECRET',
        'GROQ_API_KEY',
        'SENDGRID_API_KEY',
        'EMAIL_FROM'
    ];
    
    const optionalEnvVars = [
        'GOOGLE_CLIENT_ID',
        'GOOGLE_CLIENT_SECRET',
        'NEXTAUTH_URL',
        'NEXTAUTH_SECRET'
    ];
    
    // Load .env.local if it exists
    const envPath = path.join(process.cwd(), '.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach(line => {
            const [key, value] = line.split('=');
            if (key && value && !process.env[key]) {
                process.env[key] = value;
            }
        });
        logTest('Environment file loaded', 'PASS', '.env.local found and loaded');
    } else {
        logTest('Environment file', 'WARN', '.env.local not found, using system env vars');
    }
    
    // Check required variables
    for (const envVar of requiredEnvVars) {
        if (process.env[envVar]) {
            const value = process.env[envVar];
            const maskedValue = envVar.includes('SECRET') || envVar.includes('KEY') || envVar.includes('URL') 
                ? `${value.substring(0, 10)}...` 
                : value;
            logTest(`${envVar}`, 'PASS', `Set: ${maskedValue}`);
        } else {
            logTest(`${envVar}`, 'FAIL', 'Missing required environment variable');
        }
    }
    
    // Check optional variables
    for (const envVar of optionalEnvVars) {
        if (process.env[envVar]) {
            logTest(`${envVar} (optional)`, 'PASS', 'Set');
        } else {
            logTest(`${envVar} (optional)`, 'WARN', 'Not set');
        }
    }
}

// Test 2: Database Connection
async function testDatabaseConnection() {
    log('\n🗄️  Testing Database Connection...', 'bold');
    
    try {
        // Try to import Prisma
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        
        // Test connection
        await prisma.$connect();
        logTest('Prisma Connection', 'PASS', 'Connected successfully');
        
        // Test a simple query
        const userCount = await prisma.user.count();
        logTest('Database Query', 'PASS', `Found ${userCount} users in database`);
        
        // Test tables exist
        const tables = await prisma.$queryRaw`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `;
        
        const expectedTables = ['users', 'documents', 'chat_sessions', 'chat_messages', 'security_logs', 'verification_tokens'];
        const existingTables = tables.map(t => t.table_name);
        
        for (const table of expectedTables) {
            if (existingTables.includes(table)) {
                logTest(`Table: ${table}`, 'PASS', 'Exists');
            } else {
                logTest(`Table: ${table}`, 'FAIL', 'Missing');
            }
        }
        
        await prisma.$disconnect();
        
    } catch (error) {
        logTest('Database Connection', 'FAIL', error.message);
    }
}

// Test 3: File System
async function testFileSystem() {
    log('\n📁 Testing File System...', 'bold');
    
    const directories = [
        'uploads',
        'sample_docs',
        'src/app/backend',
        'src/app/frontend',
        'prisma'
    ];
    
    for (const dir of directories) {
        if (fs.existsSync(dir)) {
            logTest(`Directory: ${dir}`, 'PASS', 'Exists');
        } else {
            logTest(`Directory: ${dir}`, 'WARN', 'Missing - will be created when needed');
        }
    }
    
    // Test write permissions
    try {
        const testFile = 'test-write-permission.tmp';
        fs.writeFileSync(testFile, 'test');
        fs.unlinkSync(testFile);
        logTest('Write Permissions', 'PASS', 'Can write to current directory');
    } catch (error) {
        logTest('Write Permissions', 'FAIL', error.message);
    }
}

// Test 4: Next.js API Endpoints
async function testNextjsApi() {
    log('\n🌐 Testing Next.js API Endpoints...', 'bold');
    
    const baseUrl = 'http://localhost:3000';
    const endpoints = [
        { path: '/backend/api/register', method: 'POST', expectStatus: [400, 422] }, // Should fail without data
        { path: '/backend/api/login', method: 'POST', expectStatus: [400] }, // Should fail without data
        { path: '/backend/api/documents', method: 'GET', expectStatus: [401] }, // Should fail without auth
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await makeRequest(`${baseUrl}${endpoint.path}`, {
                method: endpoint.method,
                headers: { 'Content-Type': 'application/json' },
                body: endpoint.method === 'POST' ? '{}' : undefined
            });
            
            if (endpoint.expectStatus.includes(response.status)) {
                logTest(`API: ${endpoint.method} ${endpoint.path}`, 'PASS', `Status: ${response.status}`);
            } else {
                logTest(`API: ${endpoint.method} ${endpoint.path}`, 'WARN', `Unexpected status: ${response.status}`);
            }
        } catch (error) {
            logTest(`API: ${endpoint.method} ${endpoint.path}`, 'FAIL', `Not reachable: ${error.message}`);
        }
    }
}

// Test 5: RAG System
async function testRagSystem() {
    log('\n🤖 Testing RAG System...', 'bold');
    
    const ragUrl = 'http://localhost:8000';
    const endpoints = [
        { path: '/health', expectStatus: [200] },
        { path: '/status', expectStatus: [200] },
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await makeRequest(`${ragUrl}${endpoint.path}`);
            
            if (endpoint.expectStatus.includes(response.status)) {
                logTest(`RAG: ${endpoint.path}`, 'PASS', `Status: ${response.status}`);
                if (endpoint.path === '/status' && response.data) {
                    logTest('RAG Status Details', 'PASS', 
                        `Ready: ${response.data.pdf_loaded}, Index: ${response.data.index_ready}`);
                }
            } else {
                logTest(`RAG: ${endpoint.path}`, 'WARN', `Status: ${response.status}`);
            }
        } catch (error) {
            logTest(`RAG: ${endpoint.path}`, 'FAIL', `Not reachable: ${error.message}`);
        }
    }
}

// Test 6: Groq API
async function testGroqApi() {
    log('\n🧠 Testing Groq API...', 'bold');
    
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
        logTest('Groq API Key', 'FAIL', 'GROQ_API_KEY not set');
        return;
    }
    
    try {
        const response = await makeRequest('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama3-8b-8192',
                messages: [{ role: 'user', content: 'Hello' }],
                max_tokens: 10
            })
        });
        
        if (response.status === 200) {
            logTest('Groq API', 'PASS', 'API key valid and working');
        } else {
            logTest('Groq API', 'FAIL', `Status: ${response.status}`);
        }
    } catch (error) {
        logTest('Groq API', 'FAIL', error.message);
    }
}

// Test 7: SendGrid Email
async function testSendGrid() {
    log('\n📧 Testing SendGrid...', 'bold');
    
    const apiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.EMAIL_FROM;
    
    if (!apiKey || !fromEmail) {
        logTest('SendGrid Config', 'FAIL', 'SENDGRID_API_KEY or EMAIL_FROM not set');
        return;
    }
    
    try {
        // Test API key validity by checking sender verification
        const response = await makeRequest('https://api.sendgrid.com/v3/verified_senders', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 200) {
            logTest('SendGrid API', 'PASS', 'API key valid');
            logTest('SendGrid From Email', 'PASS', `Using: ${fromEmail}`);
        } else {
            logTest('SendGrid API', 'WARN', `Status: ${response.status} - Check API key`);
        }
    } catch (error) {
        logTest('SendGrid API', 'FAIL', error.message);
    }
}

// Test 8: Dependencies
async function testDependencies() {
    log('\n📦 Testing Dependencies...', 'bold');
    
    const criticalDeps = [
        '@prisma/client',
        'next',
        'react',
        'bcryptjs',
        'jsonwebtoken',
        '@sendgrid/mail'
    ];
    
    for (const dep of criticalDeps) {
        try {
            require(dep);
            logTest(`Dependency: ${dep}`, 'PASS', 'Installed');
        } catch (error) {
            logTest(`Dependency: ${dep}`, 'FAIL', 'Not installed or broken');
        }
    }
}

// Main test runner
async function runAllTests() {
    log('🚀 LegalynX System Health Check', 'bold');
    log('===============================\n', 'bold');
    
    const startTime = Date.now();
    
    await testEnvironmentVariables();
    await testDependencies();
    await testFileSystem();
    await testDatabaseConnection();
    await testGroqApi();
    await testSendGrid();
    await testNextjsApi();
    await testRagSystem();
    
    const endTime = Date.now();
    const duration = ((endTime - startTime) / 1000).toFixed(2);
    
    // Summary
    log('\n📊 Test Summary', 'bold');
    log('===============', 'bold');
    log(`✅ Passed: ${results.passed}`, 'green');
    log(`❌ Failed: ${results.failed}`, 'red');
    log(`⚠️  Warnings: ${results.warnings}`, 'yellow');
    log(`⏱️  Duration: ${duration}s`, 'cyan');
    
    // Recommendations
    log('\n💡 Recommendations:', 'bold');
    
    if (results.failed > 0) {
        log('- Fix failing tests before deploying to production', 'red');
    }
    
    if (results.warnings > 0) {
        log('- Review warnings for potential issues', 'yellow');
    }
    
    if (results.failed === 0 && results.warnings <= 3) {
        log('- System looks healthy! 🎉', 'green');
    }
    
    // Exit with appropriate code
    process.exit(results.failed > 0 ? 1 : 0);
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    log('\n\n⏹️  Test interrupted by user', 'yellow');
    process.exit(130);
});

process.on('unhandledRejection', (reason, promise) => {
    log(`\n❌ Unhandled Rejection: ${reason}`, 'red');
    process.exit(1);
});

// Run tests
runAllTests().catch((error) => {
    log(`\n💥 Test runner crashed: ${error.message}`, 'red');
    process.exit(1);
});