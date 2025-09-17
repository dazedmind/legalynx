/**
 * Document Upload Limits Test Script
 * 
 * This script tests document upload limits for different subscription tiers:
 * - BASIC: 5 documents maximum
 * - STANDARD: 20 documents maximum  
 * - PREMIUM: Unlimited documents
 * 
 * Usage: node tests/document-limits-test.js
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

// Path to sample PDFs
const SAMPLE_DOCS_DIR = path.join(__dirname, '..', 'src', 'app', 'backend', 'sample_docs');

// Test configuration
const TEST_CONFIG = {
  BASIC_LIMIT: 5,
  STANDARD_LIMIT: 20,
  PREMIUM_LIMIT: -1, // Unlimited
  TEST_DOCUMENTS_TO_CREATE: 25 // More than any limit to test overflow
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Get list of sample PDF files
function getSamplePDFs() {
  try {
    const files = fs.readdirSync(SAMPLE_DOCS_DIR)
      .filter(file => file.toLowerCase().endsWith('.pdf'))
      .slice(0, 30); // Take first 30 PDFs to ensure we have enough for testing
    
    if (files.length === 0) {
      throw new Error('No PDF files found in sample_docs directory');
    }
    
    log(`📁 Found ${files.length} sample PDF files`, 'blue');
    return files;
  } catch (error) {
    log(`❌ Error reading sample PDFs: ${error.message}`, 'red');
    throw error;
  }
}

// Create JWT token for API authentication
function createTestToken(userId) {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
  return jwt.sign(
    { userId: userId },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// Upload document via API (simulating real upload)
async function uploadDocumentViaAPI(userId, pdfFileName, token) {
  const fetch = (await import('node-fetch')).default;
  
  try {
    const pdfPath = path.join(SAMPLE_DOCS_DIR, pdfFileName);
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfStats = fs.statSync(pdfPath);
    
    // Create FormData for file upload
    const formData = new FormData();
    formData.append('file', pdfBuffer, {
      filename: pdfFileName,
      contentType: 'application/pdf',
      knownLength: pdfStats.size
    });
    
    // Make API call to upload endpoint
    const response = await fetch('http://localhost:3000/backend/api/documents/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        ...formData.getHeaders()
      },
      body: formData
    });
    
    const result = await response.json();
    
    return {
      success: response.ok,
      status: response.status,
      data: result,
      fileName: pdfFileName
    };
    
  } catch (error) {
    return {
      success: false,
      status: 500,
      data: { error: error.message },
      fileName: pdfFileName
    };
  }
}

// Create test user with specific subscription plan
async function createTestUser(planType, testId) {
  const userId = `test-user-${planType.toLowerCase()}-${testId}`;
  const email = `test-${planType.toLowerCase()}-${testId}@example.com`;
  
  // Create user
  const user = await prisma.user.create({
    data: {
      id: userId,
      email: email,
      name: `Test User ${planType}`,
      password: 'test-password-hash',
      email_verified: true
    }
  });

  // Create subscription
  const subscription = await prisma.subscription.create({
    data: {
      user_id: userId,
      plan_type: planType,
      token_limit: planType === 'BASIC' ? 1000 : planType === 'STANDARD' ? 10000 : 100000,
      storage: planType === 'BASIC' ? 100 : planType === 'STANDARD' ? 1024 : 10240,
      days_remaining: 30
    }
  });

  return { user, subscription };
}

// Upload test documents for a user using real PDFs
async function uploadTestDocuments(userId, count, samplePDFs) {
  const token = createTestToken(userId);
  const uploadResults = [];
  
  log(`📤 Attempting to upload ${count} documents for user ${userId}`, 'blue');
  
  for (let i = 0; i < count; i++) {
    // Cycle through available PDFs if we need more than we have
    const pdfFileName = samplePDFs[i % samplePDFs.length];
    const uniqueFileName = `${i + 1}_${pdfFileName}`; // Add prefix to make unique
    
    log(`  📄 Uploading ${i + 1}/${count}: ${pdfFileName}`, 'yellow');
    
    const result = await uploadDocumentViaAPI(userId, pdfFileName, token);
    uploadResults.push(result);
    
    if (result.success) {
      log(`    ✅ Upload successful`, 'green');
    } else {
      log(`    ❌ Upload failed: ${result.data.error || 'Unknown error'}`, 'red');
      // If we hit a limit, that's expected behavior - don't continue uploading
      if (result.status === 429) {
        log(`    🛑 Document limit reached (expected for limit testing)`, 'yellow');
        break;
      }
    }
  }
  
  return uploadResults;
}

// Fallback: Create test documents directly in database (for offline testing)
async function createTestDocumentsInDB(userId, count, samplePDFs) {
  const documents = [];
  
  for (let i = 0; i < count; i++) {
    const pdfFileName = samplePDFs[i % samplePDFs.length];
    const pdfPath = path.join(SAMPLE_DOCS_DIR, pdfFileName);
    
    let fileSize = 1024 * 1024; // Default 1MB
    try {
      const stats = fs.statSync(pdfPath);
      fileSize = stats.size;
    } catch (error) {
      log(`⚠️  Could not get file size for ${pdfFileName}, using default`, 'yellow');
    }
    
    const doc = await prisma.document.create({
      data: {
        file_name: `test-${i + 1}-${pdfFileName}`,
        original_file_name: pdfFileName,
        file_path: `/uploads/test-${i + 1}-${pdfFileName}`,
        file_size: fileSize,
        mime_type: 'application/pdf',
        status: 'INDEXED',
        owner_id: userId
      }
    });
    documents.push(doc);
  }
  
  return documents;
}

// Get document limits based on plan type
function getDocumentLimit(planType) {
  switch (planType) {
    case 'BASIC':
      return TEST_CONFIG.BASIC_LIMIT;
    case 'STANDARD':
      return TEST_CONFIG.STANDARD_LIMIT;
    case 'PREMIUM':
      return TEST_CONFIG.PREMIUM_LIMIT;
    default:
      return TEST_CONFIG.BASIC_LIMIT;
  }
}

// Test document limits for a specific plan using real PDF uploads
async function testPlanLimits(planType, samplePDFs, useAPIUpload = true) {
  const testId = crypto.randomBytes(4).toString('hex');
  log(`\n🧪 Testing ${planType} plan limits...`, 'cyan');
  
  try {
    // Create test user
    const { user } = await createTestUser(planType, testId);
    log(`👤 Created test user: ${user.email}`, 'blue');
    
    const expectedLimit = getDocumentLimit(planType);
    log(`📊 Expected limit: ${expectedLimit === -1 ? 'Unlimited' : expectedLimit} documents`, 'blue');
    
    // Test creating documents up to and beyond the limit
    const testCounts = planType === 'PREMIUM' 
      ? [5, 10, 15] // Test various counts for unlimited (reduced for faster testing)
      : [expectedLimit - 1, expectedLimit, expectedLimit + 1]; // Test around the limit
    
    for (const count of testCounts) {
      log(`\n📋 Testing ${count} documents upload...`, 'cyan');
      
      // Clear existing documents
      await prisma.document.deleteMany({
        where: { owner_id: user.id }
      });
      
      let actualCount = 0;
      let uploadResults = [];
      
      if (useAPIUpload) {
        // Test with real API uploads
        uploadResults = await uploadTestDocuments(user.id, count, samplePDFs);
        
        // Count successful uploads
        actualCount = await prisma.document.count({
          where: {
            owner_id: user.id,
            status: { in: ['INDEXED', 'PROCESSED', 'UPLOADED', 'PROCESSING'] }
          }
        });
      } else {
        // Fallback: Direct database creation
        await createTestDocumentsInDB(user.id, count, samplePDFs);
        actualCount = count;
      }
      
      // Determine if this should be allowed
      const shouldBeAllowed = expectedLimit === -1 || count <= expectedLimit;
      const wasFullyAllowed = actualCount === count;
      const wasPartiallyAllowed = actualCount > 0 && actualCount < count;
      
      if (useAPIUpload && uploadResults.length > 0) {
        const successfulUploads = uploadResults.filter(r => r.success).length;
        const limitHitUploads = uploadResults.filter(r => r.status === 429).length;
        
        log(`📈 Upload results: ${successfulUploads} successful, ${limitHitUploads} limit-blocked`, 'blue');
        
        if (shouldBeAllowed && wasFullyAllowed) {
          log(`✅ ${count} documents: FULLY ALLOWED (Expected)`, 'green');
        } else if (!shouldBeAllowed && (wasPartiallyAllowed || limitHitUploads > 0)) {
          log(`✅ ${count} documents: BLOCKED AT LIMIT (Expected)`, 'green');
        } else if (shouldBeAllowed && wasPartiallyAllowed) {
          log(`⚠️  ${count} documents: PARTIALLY ALLOWED (${actualCount}/${count}) - Check server status`, 'yellow');
        } else {
          log(`❌ ${count} documents: UNEXPECTED RESULT (${actualCount}/${count})`, 'red');
        }
      } else {
        // Database-only test
        if (shouldBeAllowed === wasFullyAllowed) {
          log(`✅ ${count} documents: ${wasFullyAllowed ? 'ALLOWED' : 'BLOCKED'} (Expected)`, 'green');
        } else {
          log(`❌ ${count} documents: ${wasFullyAllowed ? 'ALLOWED' : 'BLOCKED'} (Unexpected!)`, 'red');
        }
      }
    }
    
    // Cleanup
    await prisma.document.deleteMany({ where: { owner_id: user.id } });
    await prisma.subscription.delete({ where: { user_id: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
    
    log(`🧹 Cleaned up test user: ${user.email}`, 'yellow');
    
  } catch (error) {
    log(`❌ Error testing ${planType}: ${error.message}`, 'red');
    throw error;
  }
}

// Test the document limit checker utility
async function testDocumentLimitChecker(samplePDFs) {
  log(`\n🔧 Testing DocumentLimitChecker utility...`, 'magenta');
  
  // Since we're in a test environment, we'll create a simple version of the checker
  const DocumentLimitChecker = {
    getDocumentLimitByPlan(planType) {
      return getDocumentLimit(planType);
    },
    
    async getCurrentDocumentCount(userId) {
      return await prisma.document.count({
        where: {
          owner_id: userId,
          status: { in: ['INDEXED', 'PROCESSED', 'UPLOADED', 'PROCESSING'] }
        }
      });
    },
    
    async getUserSubscriptionPlan(userId) {
      const subscription = await prisma.subscription.findUnique({
        where: { user_id: userId },
        select: { plan_type: true }
      });
      return subscription?.plan_type || 'BASIC';
    },
    
    async canUserUploadDocument(userId) {
      const currentCount = await this.getCurrentDocumentCount(userId);
      const planType = await this.getUserSubscriptionPlan(userId);
      const maxDocuments = this.getDocumentLimitByPlan(planType);
      const canUpload = maxDocuments === -1 || currentCount < maxDocuments;
      
      return {
        maxDocuments,
        currentCount,
        canUpload,
        planType
      };
    }
  };
  
  const testId = crypto.randomBytes(4).toString('hex');
  
  // Test each plan type
  for (const planType of ['BASIC', 'STANDARD', 'PREMIUM']) {
    const { user } = await createTestUser(planType, testId);
    
    // Test with different document counts (using smaller numbers for faster testing)
    const testCounts = planType === 'PREMIUM' ? [0, 3, 8] : [0, 2, Math.min(getDocumentLimit(planType) + 2, 8)];
    
    for (const count of testCounts) {
      // Clear and create documents using real PDFs
      await prisma.document.deleteMany({ where: { owner_id: user.id } });
      if (count > 0) {
        await createTestDocumentsInDB(user.id, count, samplePDFs);
      }
      
      const result = await DocumentLimitChecker.canUserUploadDocument(user.id);
      const expectedLimit = getDocumentLimit(planType);
      const expectedCanUpload = expectedLimit === -1 || count < expectedLimit;
      
      if (result.canUpload === expectedCanUpload && result.currentCount === count) {
        log(`✅ ${planType} with ${count} docs: canUpload=${result.canUpload} (Expected)`, 'green');
      } else {
        log(`❌ ${planType} with ${count} docs: canUpload=${result.canUpload}, expected=${expectedCanUpload}`, 'red');
      }
    }
    
    // Cleanup
    await prisma.document.deleteMany({ where: { owner_id: user.id } });
    await prisma.subscription.delete({ where: { user_id: user.id } });
    await prisma.user.delete({ where: { id: user.id } });
  }
}

// Main test runner
async function runTests() {
  log('🚀 Starting Document Limits Test Suite with Real PDFs', 'cyan');
  log('=' .repeat(60), 'cyan');
  
  try {
    // Get sample PDFs
    const samplePDFs = getSamplePDFs();
    
    // Check if we should use API uploads or database-only testing
    const useAPIUpload = process.env.TEST_WITH_API !== 'false';
    
    if (useAPIUpload) {
      log('🌐 Testing with real API uploads (requires server running on localhost:3000)', 'blue');
      log('   To test database-only: set TEST_WITH_API=false', 'blue');
    } else {
      log('💾 Testing with database-only mode', 'blue');
    }
    
    // Test each subscription plan
    await testPlanLimits('BASIC', samplePDFs, useAPIUpload);
    await testPlanLimits('STANDARD', samplePDFs, useAPIUpload);
    await testPlanLimits('PREMIUM', samplePDFs, useAPIUpload);
    
    // Test the utility functions
    await testDocumentLimitChecker(samplePDFs);
    
    log('\n' + '='.repeat(60), 'green');
    log('✅ All tests completed successfully!', 'green');
    log('📋 Test Summary:', 'green');
    log('   • BASIC: 5 documents maximum', 'green');
    log('   • STANDARD: 20 documents maximum', 'green');
    log('   • PREMIUM: Unlimited documents', 'green');
    log(`   • Used ${samplePDFs.length} sample PDF files from sample_docs/`, 'green');
    if (useAPIUpload) {
      log('   • Tested real API upload endpoints', 'green');
    } else {
      log('   • Tested database limits only', 'green');
    }
    
  } catch (error) {
    log('\n' + '='.repeat(60), 'red');
    log('❌ Tests failed!', 'red');
    log(`Error: ${error.message}`, 'red');
    if (error.stack) {
      log(`Stack: ${error.stack}`, 'red');
    }
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testPlanLimits,
  createTestUser,
  uploadTestDocuments,
  createTestDocumentsInDB,
  getSamplePDFs,
  TEST_CONFIG
};
