// tests/renaming_speed_test.js
/**
 * Document Renaming Speed Test Script
 * Tests add_timestamp naming with expected filenames from SOP 3.csv
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Papa = require('papaparse');

// Suppress form-data deprecation warning
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('form-data')) return;
  console.warn(warning.name, warning.message);
});

const prisma = new PrismaClient();

const CONFIG = {
  SERVER_URL: 'http://localhost:3000',
  FASTAPI_URL: 'http://localhost:8000',
  SAMPLE_DOCS_DIR: path.join(__dirname, '..', 'src', 'app', 'backend', 'sample_files'),
  EXPECTED_FILENAMES_CSV: path.join(__dirname, 'SOP 3.csv'),
  TEST_DELAY_MS: 1000,
  NAMING_OPTIONS: ['add_timestamp']
};

const colors = {
  reset: '\x1b[0m', red: '\x1b[31m', green: '\x1b[32m', yellow: '\x1b[33m',
  blue: '\x1b[34m', magenta: '\x1b[35m', cyan: '\x1b[36m', white: '\x1b[37m', bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Load expected filenames from CSV file
 * @returns {Object} Mapping of original filename to expected filename
 */
function loadExpectedFilenamesFromCSV() {
  try {
    const csvPath = CONFIG.EXPECTED_FILENAMES_CSV;
    
    if (!fs.existsSync(csvPath)) {
      log(`⚠️ Warning: Expected filenames CSV not found at ${csvPath}`, 'yellow');
      return {};
    }

    const csvContent = fs.readFileSync(csvPath, 'utf8');
    
    const parsed = Papa.parse(csvContent, {
      header: true,
      dynamicTyping: true,
      skipEmptyLines: true,
      delimitersToGuess: [',', '\t', '|', ';']
    });

    // Build the mapping object from the CSV
    // Skip the first row (headers) and process the rest
    const mappingData = parsed.data.slice(1).filter(row => 
      row['_1'] && row['ADD DATE (YYYYMMDD_DOCUMENT-TYPE.pdf)']
    );

    const expectedFilenames = {};
    mappingData.forEach(row => {
      const original = row['_1']?.trim();
      const expected = row['ADD DATE (YYYYMMDD_DOCUMENT-TYPE.pdf)']?.trim();
      
      if (original && expected) {
        // Add .pdf extension if not present in expected
        const expectedWithExt = expected.endsWith('.pdf') ? expected : `${expected}.pdf`;
        // Add .pdf extension if not present in original
        const originalWithExt = original.endsWith('.pdf') ? original : `${original}.pdf`;
        
        expectedFilenames[originalWithExt] = expectedWithExt;
      }
    });

    log(`✅ Loaded ${Object.keys(expectedFilenames).length} expected filename mappings from CSV`, 'green');
    return expectedFilenames;
  } catch (error) {
    log(`❌ Error loading expected filenames from CSV: ${error.message}`, 'red');
    return {};
  }
}

class PerformanceTracker {
  constructor() {
    this.results = [];
    this.summary = { 
      totalTests: 0, 
      totalSuccessful: 0, 
      totalFailed: 0, 
      totalMatched: 0, 
      averageOverallSpeed: 0, 
      fastestUpload: Infinity, 
      slowestUpload: 0 
    };
  }

  addResult(result) {
    this.results.push(result);
    this.summary.totalTests++;
    if (result.success) {
      this.summary.totalSuccessful++;
      if (result.matchesExpected) this.summary.totalMatched++;
      if (result.overallSpeed < this.summary.fastestUpload) this.summary.fastestUpload = result.overallSpeed;
      if (result.overallSpeed > this.summary.slowestUpload) this.summary.slowestUpload = result.overallSpeed;
    } else {
      this.summary.totalFailed++;
    }
    const successfulResults = this.results.filter(r => r.success);
    this.summary.averageOverallSpeed = successfulResults.length > 0 
      ? successfulResults.reduce((acc, r) => acc + r.overallSpeed, 0) / successfulResults.length : 0;
  }

  generateReport() {
    const results = this.results.filter(r => r.success);
    const renamedCount = results.filter(r => r.wasRenamed).length;
    const matchedCount = results.filter(r => r.matchesExpected).length;
    const recommendations = [];
    
    if (matchedCount === 0 && results.length > 0) {
      recommendations.push('[Critical] No files matched expected naming - check RAG extraction logic');
    } else if (matchedCount < results.length * 0.5) {
      recommendations.push(`[Warning] Only ${matchedCount}/${results.length} files matched expected names`);
    } else if (matchedCount === results.length) {
      recommendations.push(`Perfect! All ${matchedCount} files matched expected naming!`);
    } else {
      recommendations.push(`Good! ${matchedCount}/${results.length} files matched expected naming`);
    }

    return { summary: this.summary, detailedResults: this.results, recommendations };
  }
}

function getSamplePDFs() {
  try {
    const files = fs.readdirSync(CONFIG.SAMPLE_DOCS_DIR).filter(file => file.toLowerCase().endsWith('.pdf'));
    if (files.length === 0) throw new Error('No PDF files found in sample_files directory');
    log(`📁 Found ${files.length} sample PDF files`, 'blue');
    return files;
  } catch (error) {
    log(`❌ Error reading sample PDFs: ${error.message}`, 'red');
    throw error;
  }
}

function createTestToken(userId) {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
  return jwt.sign({ 
    userId: userId, 
    email: `speed-test-${userId.substring(0, 8)}@example.com` 
  }, JWT_SECRET, { expiresIn: '2h' });
}

async function createTestUser() {
  const testId = crypto.randomBytes(4).toString('hex');
  const userId = `speed-test-user-${testId}`;
  const email = `speed-test-${testId}@example.com`;
  const hashedPassword = await bcrypt.hash('test-password-123', 10);
  
  try {
    const user = await prisma.user.create({
      data: { 
        id: userId, 
        email: email, 
        password: hashedPassword, 
        name: `Speed Test User ${testId}`, 
        email_verified: true 
      }
    });

    await prisma.subscription.create({
      data: { 
        user_id: userId, 
        plan_type: 'PREMIUM', 
        token_limit: 1000000, 
        tokens_used: 0, 
        storage: 100000, 
        storage_used: 0, 
        billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
        days_remaining: 30, 
        is_active: true 
      }
    });

    await prisma.userSettings.create({
      data: { 
        user_id: userId, 
        auto_rename_files: true, 
        file_naming_format: 'ADD_TIMESTAMP' 
      }
    });

    log(`✅ Created test user: ${email}`, 'green');
    return { user, token: createTestToken(userId) };
  } catch (error) {
    log(`❌ Error creating test user: ${error.message}`, 'red');
    throw error;
  }
}

async function uploadDocumentWithTiming(userId, pdfFileName, token, namingOption, testTitle, clientName, expectedFilenames) {
  const fetch = (await import('node-fetch')).default;
  const startTime = Date.now();
  
  try {
    const pdfPath = path.join(CONFIG.SAMPLE_DOCS_DIR, pdfFileName);
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfStats = fs.statSync(pdfPath);
    
    const uploadStartTime = Date.now();
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', pdfBuffer, { 
      filename: pdfFileName, 
      contentType: 'application/pdf', 
      knownLength: pdfStats.size 
    });
    formData.append('naming_option', namingOption);
    formData.append('title', testTitle);
    formData.append('client_name', clientName);
    
    const uploadResponse = await fetch(`${CONFIG.FASTAPI_URL}/upload-pdf-ultra-fast`, {
      method: 'POST',
      headers: { 
        'Authorization': `Bearer ${token}`, 
        ...formData.getHeaders() 
      },
      body: formData
    });
    
    const uploadEndTime = Date.now();
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }
    
    const result = await uploadResponse.json();
    const overallSpeed = (Date.now() - startTime) / 1000;
    
    const originalFilename = pdfFileName;
    const renamedFilename = result.filename || originalFilename;
    const expectedFilename = expectedFilenames[originalFilename] || null;
    const wasRenamed = originalFilename !== renamedFilename && !renamedFilename.includes('_1');
    const matchesExpected = expectedFilename && renamedFilename === expectedFilename;
    
    return {
      originalFilename, 
      renamedFilename, 
      expectedFilename, 
      wasRenamed, 
      matchesExpected, 
      namingOption,
      fileSizeKB: (pdfStats.size / 1024).toFixed(1),
      overallSpeed: parseFloat(overallSpeed.toFixed(2)),
      success: true
    };
  } catch (error) {
    return {
      originalFilename: pdfFileName, 
      renamedFilename: pdfFileName, 
      expectedFilename: expectedFilenames[pdfFileName] || null,
      wasRenamed: false, 
      matchesExpected: false, 
      namingOption,
      fileSizeKB: 'unknown', 
      overallSpeed: (Date.now() - startTime) / 1000, 
      success: false, 
      error: error.message
    };
  }
}

async function testTimestampNaming(samplePDFs, user, token, expectedFilenames) {
  const tracker = new PerformanceTracker();
  log('\n🧪 Testing ADD_TIMESTAMP naming on all documents...', 'bold');
  // log('\n🧪 Testing ADD_CLIENT_NAME naming on all documents...', 'bold');
  log('=' .repeat(100), 'cyan');
  
  for (let i = 0; i < samplePDFs.length; i++) {
    const pdfFile = samplePDFs[i];
    const testTitle = `${pdfFile.replace('.pdf', '').replace(/[^a-zA-Z0-9]/g, ' ').trim()}`;
    const clientName = `TestClient`;
    
    log(`\n📄 Processing ${i + 1}/${samplePDFs.length}: ${pdfFile}`, 'cyan');
    
    try {
      const result = await uploadDocumentWithTiming(
        user.id, 
        pdfFile, 
        token, 
        'add_timestamp', 
        testTitle, 
        clientName, 
        expectedFilenames
      );
      tracker.addResult(result);
      
      log(`📤 Uploading document...`, 'yellow');
      log(`✅ Upload completed in ${result.overallSpeed}s`, 'green');
      log(`   📋 Original: ${result.originalFilename}`, 'white');
      log(`   🎯 Expected: ${result.expectedFilename || 'N/A'}`, 'green');
      log(`   ✅ Actual:   ${result.renamedFilename}`, result.matchesExpected ? 'green' : 'green');
      log(`   ⚡ Speed: ${result.overallSpeed}s`, 'magenta');
      
      // if (result.expectedFilename) {
      //   if (result.matchesExpected) {
      //     log(`   ✓ Match: YES`, 'green');
      //   } else {
      //     log(`   ✗ Match: NO - naming doesn't match expected`, 'red');
      //   }
      // } else {
      //   log(`   ℹ No expected filename defined for this file`, 'blue');
      // }
      
      if (i < samplePDFs.length - 1) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.TEST_DELAY_MS));
      }
    } catch (error) {
      log(`❌ Test failed for ${pdfFile}: ${error.message}`, 'red');
      tracker.addResult({
        originalFilename: pdfFile, 
        renamedFilename: pdfFile, 
        expectedFilename: expectedFilenames[pdfFile] || null,
        wasRenamed: false, 
        matchesExpected: false, 
        namingOption: 'add_timestamp',
        fileSizeKB: 'unknown', 
        overallSpeed: 0, 
        success: false, 
        error: error.message
      });
    }
  }
  
  log(`\n✅ Completed testing all ${samplePDFs.length} documents`, 'green');
  return tracker;
}

async function cleanupTestUser(userId) {
  try {
    await prisma.chatMessage.deleteMany({ where: { session: { user_id: userId } } });
    await prisma.chatSession.deleteMany({ where: { user_id: userId } });
    await prisma.document.deleteMany({ where: { owner_id: userId } });
    await prisma.folder.deleteMany({ where: { owner_id: userId } });
    await prisma.securityLog.deleteMany({ where: { user_id: userId } });
    await prisma.tokenUsageLog.deleteMany({ where: { user_id: userId } });
    await prisma.verificationToken.deleteMany({ where: { user_id: userId } });
    await prisma.passwordResetToken.deleteMany({ where: { user_id: userId } });
    await prisma.session.deleteMany({ where: { userId: userId } });
    await prisma.userSettings.deleteMany({ where: { user_id: userId } });
    await prisma.subscription.deleteMany({ where: { user_id: userId } });
    await prisma.user.delete({ where: { id: userId } });
    log(`✅ Cleaned up test user: ${userId}`, 'green');
  } catch (error) {
    log(`⚠️ Cleanup failed: ${error.message}`, 'yellow');
  }
}

async function runRenamingSpeedTests() {
  log('🚀 Starting Document Renaming Speed Test Suite', 'cyan');
  let testUser = null;
  
  try {
    // Load expected filenames from CSV
    const expectedFilenames = loadExpectedFilenamesFromCSV();
    
    const samplePDFs = getSamplePDFs();
    testUser = await createTestUser();
    
    log(`\n🎯 Test Configuration:`, 'blue');
    log(`   Sample documents: ${samplePDFs.length} PDF files`, 'white');
    log(`   Expected filenames loaded: ${Object.keys(expectedFilenames).length}`, 'white');
    log(`   Naming option: add_timestamp`, 'white');
      
    const tracker = await testTimestampNaming(samplePDFs, testUser.user, testUser.token, expectedFilenames);
    const report = tracker.generateReport();
    
    log('\n📊 DOCUMENT RENAMING SPEED TEST REPORT', 'bold');
    log('=' .repeat(100), 'cyan');
    log(`   Total tests: ${report.summary.totalTests}`, 'white');
    log(`   Successful: ${report.summary.totalSuccessful}`, 'green');
    log(`   Failed: ${report.summary.totalFailed}`, 'red');
    log(`   Matched expected: ${report.summary.totalMatched}/${report.summary.totalSuccessful}`, report.summary.totalMatched > 0 ? 'green' : 'yellow');
    log(`   Average speed: ${report.summary.averageOverallSpeed.toFixed(2)}s`, 'white');
    log(`   Fastest: ${report.summary.fastestUpload.toFixed(2)}s`, 'green');
    log(`   Slowest: ${report.summary.slowestUpload.toFixed(2)}s`, 'red');
    
    log('\n💡 Recommendations:', 'yellow');
    report.recommendations.forEach(rec => log(`   • ${rec}`, 'yellow'));
    
    log('\n✅ All tests completed!', 'green');
  } catch (error) {
    log(`\n❌ Tests failed: ${error.message}`, 'red');
    process.exit(1);
  } finally {
    if (testUser) await cleanupTestUser(testUser.user.id);
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  runRenamingSpeedTests().catch(console.error);
}

module.exports = { runRenamingSpeedTests, CONFIG, loadExpectedFilenamesFromCSV };