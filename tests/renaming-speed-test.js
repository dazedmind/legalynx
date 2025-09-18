/**
 * Document Renaming Speed Test Script - Streamlined Version
 * Tests add_timestamp naming on ALL documents in sample_docs folder
 */

const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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

class PerformanceTracker {
  constructor() {
    this.results = [];
    this.summary = { totalTests: 0, totalSuccessful: 0, totalFailed: 0, averageOverallSpeed: 0, fastestUpload: Infinity, slowestUpload: 0 };
  }

  addResult(result) {
    this.results.push(result);
    this.summary.totalTests++;
    if (result.success) {
      this.summary.totalSuccessful++;
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
    const recommendations = [];
    
    if (renamedCount === 0 && results.length > 0) {
      recommendations.push('[Critical] No files were actually renamed - check add_timestamp configuration');
    } else if (renamedCount < results.length / 2) {
      recommendations.push(`[Warning] Only ${renamedCount}/${results.length} files were renamed`);
    } else {
      recommendations.push(`Excellent! ${renamedCount}/${results.length} files were successfully renamed`);
    }

    return { summary: this.summary, detailedResults: this.results, recommendations };
  }
}

function getSamplePDFs() {
  try {
    const files = fs.readdirSync(CONFIG.SAMPLE_DOCS_DIR).filter(file => file.toLowerCase().endsWith('.pdf'));
    if (files.length === 0) throw new Error('No PDF files found in sample_docs directory');
    log(`📁 Found ${files.length} sample PDF files`, 'blue');
    return files;
  } catch (error) {
    log(`❌ Error reading sample PDFs: ${error.message}`, 'red');
    throw error;
  }
}

function createTestToken(userId) {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
  return jwt.sign({ userId: userId, email: `speed-test-${userId.substring(0, 8)}@example.com` }, JWT_SECRET, { expiresIn: '2h' });
}

async function createTestUser() {
  const testId = crypto.randomBytes(4).toString('hex');
  const userId = `speed-test-user-${testId}`;
  const email = `speed-test-${testId}@example.com`;
  const hashedPassword = await bcrypt.hash('test-password-123', 10);
  
  try {
    const user = await prisma.user.create({
      data: { id: userId, email: email, password: hashedPassword, name: `Speed Test User ${testId}`, email_verified: true }
    });

    await prisma.subscription.create({
      data: { user_id: userId, plan_type: 'PREMIUM', token_limit: 1000000, tokens_used: 0, storage: 100000, 
              storage_used: 0, billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), days_remaining: 30, is_active: true }
    });

    await prisma.userSettings.create({
      data: { user_id: userId, auto_rename_files: true, file_naming_format: 'ADD_TIMESTAMP', file_naming_title: 'Test Document', file_client_name: 'Test Client' }
    });

    log(`✅ Created test user: ${email} with PREMIUM subscription`, 'green');
    return { user, token: createTestToken(userId) };
  } catch (error) {
    log(`❌ Error creating test user: ${error.message}`, 'red');
    throw error;
  }
}

async function uploadDocumentWithTiming(userId, pdfFileName, token, namingOption, testTitle, clientName) {
  const fetch = (await import('node-fetch')).default;
  const startTime = Date.now();
  
  try {
    const pdfPath = path.join(CONFIG.SAMPLE_DOCS_DIR, pdfFileName);
    const pdfBuffer = fs.readFileSync(pdfPath);
    const pdfStats = fs.statSync(pdfPath);
    
    const uploadStartTime = Date.now();
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('file', pdfBuffer, { filename: pdfFileName, contentType: 'application/pdf', knownLength: pdfStats.size });
    formData.append('naming_option', namingOption);
    formData.append('title', testTitle);
    formData.append('client_name', clientName);
    
    const uploadResponse = await fetch(`${CONFIG.FASTAPI_URL}/upload-pdf-ultra-fast`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, ...formData.getHeaders() },
      body: formData
    });
    
    const uploadEndTime = Date.now();
    if (!uploadResponse.ok) throw new Error(`Upload failed: ${uploadResponse.status}`);
    
    const result = await uploadResponse.json();
    const renameEndTime = Date.now();
    
    const uploadSpeed = (uploadEndTime - uploadStartTime) / 1000;
    const renameSpeed = (renameEndTime - uploadEndTime) / 1000;
    const overallSpeed = (renameEndTime - startTime) / 1000;
    
    const originalFilename = pdfFileName;
    const renamedFilename = result.filename || originalFilename;
    const wasRenamed = originalFilename !== renamedFilename && !renamedFilename.includes('_1');
    
    return {
      originalFilename, renamedFilename, wasRenamed, namingOption,
      fileSizeKB: (pdfStats.size / 1024).toFixed(1),
      uploadSpeed: parseFloat(uploadSpeed.toFixed(3)),
      renameSpeed: parseFloat(renameSpeed.toFixed(3)),
      overallSpeed: parseFloat(overallSpeed.toFixed(3)),
      success: true
    };
  } catch (error) {
    return {
      originalFilename: pdfFileName, renamedFilename: pdfFileName, wasRenamed: false, namingOption,
      fileSizeKB: 'unknown', uploadSpeed: 0, renameSpeed: 0, 
      overallSpeed: (Date.now() - startTime) / 1000, success: false, error: error.message
    };
  }
}

function generateExpectedTimestampFilename(originalFilename, title) {
  const fileExt = path.extname(originalFilename);
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const cleanTitle = title.replace(/[^\w]/g, '_').substring(0, 30);
  return `${dateStr}_${cleanTitle}${fileExt}`;
}

async function testTimestampNaming(samplePDFs, user, token) {
  const tracker = new PerformanceTracker();
  log('\n🧪 Testing ADD_TIMESTAMP naming on all documents...', 'bold');
  
  for (let i = 0; i < samplePDFs.length; i++) {
    const pdfFile = samplePDFs[i];
    const testTitle = `${pdfFile.replace('.pdf', '').replace(/[^a-zA-Z0-9]/g, ' ').trim()}`;
    const clientName = `Client${String.fromCharCode(65 + (i % 26))}`;
    const expectedFilename = generateExpectedTimestampFilename(pdfFile, testTitle);
    
    log(`\n📄 Processing ${i + 1}/${samplePDFs.length}: ${pdfFile}`, 'cyan');
    
    try {
      const result = await uploadDocumentWithTiming(user.id, pdfFile, token, 'add_timestamp', testTitle, clientName);
      result.expectedFilename = expectedFilename;
      result.rawFilename = pdfFile;
      tracker.addResult(result);
      
      log(`📤 Uploading document`, 'yellow');
      log(`✅ Upload completed in ${result.overallSpeed.toFixed(2)}s`, 'green');
      log(`   📋 Original: ${result.originalFilename}`, 'cyan');
      log(`   🎯 Expected file name: ${result.expectedFilename}`, 'yellow');
      log(`   ✅ Actual file name: ${result.renamedFilename}`, result.wasRenamed ? 'green' : 'red');
      log(`   ⚡ Upload speed: ${result.uploadSpeed.toFixed(2)}s`, 'magenta');
      log(`   ⚡ Rename speed: ${result.renameSpeed.toFixed(2)}s`, 'magenta');
      log(`   ⚡ Overall speed: ${result.overallSpeed.toFixed(2)}s`, 'magenta');
      
      if (i < samplePDFs.length - 1) await new Promise(resolve => setTimeout(resolve, CONFIG.TEST_DELAY_MS));
    } catch (error) {
      log(`❌ Test failed for ${pdfFile}: ${error.message}`, 'red');
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
    const samplePDFs = getSamplePDFs();
    testUser = await createTestUser();
    
    log(`\n🎯 Test Configuration:`, 'blue');
    log(`   Sample documents: ${samplePDFs.length} (ALL PDF files)`, 'white');
    log(`   Naming option: add_timestamp (with title only)`, 'white');
    
    const tracker = await testTimestampNaming(samplePDFs, testUser.user, testUser.token);
    const report = tracker.generateReport();
    
    log('\n📊 DOCUMENT RENAMING SPEED TEST REPORT', 'bold');
    log(`   Total tests: ${report.summary.totalTests}`, 'white');
    log(`   Successful: ${report.summary.totalSuccessful}`, 'green');
    log(`   Failed: ${report.summary.totalFailed}`, 'red');
    log(`   Average speed: ${report.summary.averageOverallSpeed.toFixed(2)}s`, 'white');
    
    const actuallyRenamed = report.detailedResults.filter(r => r.success && r.wasRenamed).length;
    log(`   Files renamed: ${actuallyRenamed}/${report.summary.totalSuccessful}`, actuallyRenamed > 0 ? 'green' : 'yellow');
    
    report.recommendations.forEach(rec => log(`   • ${rec}`, 'yellow'));
    
    log('\n✅ All tests completed successfully!', 'green');
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

module.exports = { runRenamingSpeedTests, CONFIG };