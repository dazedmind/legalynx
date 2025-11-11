// SOP Test Script - Tests document Q&A based on SOP 1.csv
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const FormData = require('form-data');
const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// Suppress warnings
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  if (warning.name === 'DeprecationWarning' && warning.message.includes('form-data')) return;
  console.warn(warning.name, warning.message);
});

const prisma = new PrismaClient();

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';
const FASTAPI_URL = 'https://fastapi-production-d8c7.up.railway.app';
const SAMPLE_FILES_DIR = path.join(__dirname, '..', 'src', 'app', 'backend', 'sample_files');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  magenta: '\x1b[35m'
};

// Create JWT token for test user
function createTestToken(userId) {
  const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key';
  return jwt.sign({
    userId: userId,
    email: `sop-test-${userId.substring(0, 8)}@example.com`
  }, JWT_SECRET, { expiresIn: '4h' });
}

// Create test user with subscription and settings
async function createTestUser() {
  const testId = crypto.randomBytes(4).toString('hex');
  const userId = `sop-test-user-${testId}`;
  const email = `sop-test-${testId}@example.com`;
  const hashedPassword = await bcrypt.hash('test-password-123', 10);

  try {
    console.log(`${colors.yellow}👤 Creating test user...${colors.reset}`);

    const user = await prisma.user.create({
      data: {
        id: userId,
        email: email,
        password: hashedPassword,
        name: `SOP Test User ${testId}`,
        email_verified: true
      }
    });

    await prisma.subscription.create({
      data: {
        user_id: userId,
        plan_type: 'PREMIUM',
        token_limit: 10000000,
        tokens_used: 0,
        storage: 1000000,
        storage_used: 0,
        billing_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        days_remaining: 30,
        is_active: true
      }
    });

    await prisma.userSettings.create({
      data: {
        user_id: userId,
        auto_rename_files: false
      }
    });

    const token = createTestToken(userId);
    console.log(`${colors.green}✓ Test user created: ${email}${colors.reset}\n`);

    return { user, token };
  } catch (error) {
    console.log(`${colors.red}❌ Error creating test user: ${error.message}${colors.reset}`);
    throw error;
  }
}

// Cleanup test user and all associated data
async function cleanupTestUser(userId) {
  try {
    console.log(`\n${colors.yellow}🧹 Cleaning up test user and data...${colors.reset}`);

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

    console.log(`${colors.green}✓ Cleanup complete${colors.reset}`);
  } catch (error) {
    console.log(`${colors.yellow}⚠️ Cleanup warning: ${error.message}${colors.reset}`);
  }
}

// Read SOP 1.csv
function readSOPQuestions() {
  const filePath = path.join(__dirname, 'SOP 1.csv');
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  // Group questions by file
  const fileQuestions = {};

  data.forEach(row => {
    const fileName = row['File'];
    const questionIndex = row['Index'];
    const question = row['Questions'];

    if (!fileQuestions[fileName]) {
      fileQuestions[fileName] = [];
    }

    fileQuestions[fileName].push({
      index: questionIndex,
      question: question
    });
  });

  return fileQuestions;
}

// Upload document from sample_files using FastAPI
async function uploadDocument(fileName, token) {
  console.log(`${colors.yellow}📤 Uploading document from sample_files...${colors.reset}`);

  // Find the file in sample_files directory
  const files = fs.readdirSync(SAMPLE_FILES_DIR);
  const matchingFile = files.find(file =>
    file === fileName ||
    file.includes(fileName) ||
    fileName.includes(file.replace(/\.[^/.]+$/, ''))
  );

  if (!matchingFile) {
    throw new Error(`File not found in sample_files: ${fileName}`);
  }

  const filePath = path.join(SAMPLE_FILES_DIR, matchingFile);
  const pdfBuffer = fs.readFileSync(filePath);
  const pdfStats = fs.statSync(filePath);

  const formData = new FormData();
  formData.append('file', pdfBuffer, {
    filename: matchingFile,
    contentType: 'application/pdf',
    knownLength: pdfStats.size
  });

  const fetch = (await import('node-fetch')).default;
  const response = await fetch(`${FASTAPI_URL}/upload-pdf-ultra-fast`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      ...formData.getHeaders()
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  console.log(`${colors.green}✓ Document uploaded successfully (ID: ${result.document_id})${colors.reset}\n`);

  // Return in the same format as getDocumentByName
  return {
    id: result.document_id,
    originalFileName: result.filename
  };
}

// Get document ID by filename
async function getDocumentByName(fileName, token) {
  const fetch = (await import('node-fetch')).default;
  const response = await fetch(`${API_BASE_URL}/api/documents`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch documents: ${response.statusText}`);
  }

  const data = await response.json();
  const document = data.documents.find(doc =>
    doc.originalFileName === fileName ||
    doc.originalFileName.includes(fileName) ||
    fileName.includes(doc.originalFileName.replace(/\.[^/.]+$/, ''))
  );

  return document;
}

// Get or upload document
async function getOrUploadDocument(fileName, token) {
  // For test purposes, always upload directly
  // This avoids dependency on Next.js API being available
  const document = await uploadDocument(fileName, token);
  return document;
}

// Query document using FastAPI
async function askQuestion(documentId, question, token) {
  const fetch = (await import('node-fetch')).default;
  const startTime = Date.now();

  const response = await fetch(`${FASTAPI_URL}/query`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      document_id: documentId,
      query: question
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Query failed: ${response.statusText} - ${errorText}`);
  }

  const result = await response.json();
  const endTime = Date.now();
  const responseTime = endTime - startTime;

  return {
    answer: result.response || result.answer || 'No response',
    responseTime: responseTime,
    sourceNodes: result.source_nodes || []
  };
}

// Format response time
function formatTime(ms) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

// Main test function
async function runTests() {
  console.log(`${colors.bright}${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}           SOP Q&A TEST - DOCUMENT VALIDATION SUITE             ${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}\n`);

  let testUser = null;

  try {
    // Create test user
    testUser = await createTestUser();
    const { user, token } = testUser;

    const fileQuestions = readSOPQuestions();
    const results = [];

    let totalFiles = Object.keys(fileQuestions).length;
    let currentFileNum = 0;

    for (const [fileName, questions] of Object.entries(fileQuestions)) {
      currentFileNum++;

      console.log(`${colors.bright}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
      console.log(`${colors.bright}📄 File [${currentFileNum}/${totalFiles}]: ${colors.green}${fileName}${colors.reset}`);
      console.log(`${colors.bright}${colors.blue}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);

      try {
        // Get or upload document
        console.log(`${colors.yellow}🔍 Searching for document...${colors.reset}`);
        const document = await getOrUploadDocument(fileName, token);

        if (!document) {
          console.log(`${colors.red}❌ Document not found and could not be uploaded: ${fileName}${colors.reset}\n`);
          results.push({
            file: fileName,
            status: 'NOT_FOUND',
            questions: []
          });
          continue;
        }

        console.log(`${colors.green}✓ Document ready: ${document.originalFileName} (ID: ${document.id})${colors.reset}\n`);

        const questionResults = [];

        // Ask each question
        for (const { index, question } of questions) {
          console.log(`${colors.cyan}❓ Question ${index}/10:${colors.reset}`);
          console.log(`   ${question}\n`);

          try {
            const { answer, responseTime } = await askQuestion(document.id, question, token);

          console.log(`${colors.magenta}💡 Answer:${colors.reset}`);
          // Word wrap answer at 80 characters
          const words = answer.split(' ');
          let line = '   ';
          for (const word of words) {
            if (line.length + word.length > 77) {
              console.log(line);
              line = '   ' + word + ' ';
            } else {
              line += word + ' ';
            }
          }
          if (line.trim()) console.log(line);

          console.log(`${colors.green}⏱️  Response time: ${formatTime(responseTime)}${colors.reset}\n`);

          questionResults.push({
            index,
            question,
            answer,
            responseTime,
            status: 'SUCCESS'
          });

          } catch (error) {
            console.log(`${colors.red}❌ Error: ${error.message}${colors.reset}\n`);
            questionResults.push({
              index,
              question,
              error: error.message,
              status: 'ERROR'
            });
          }
        }

        results.push({
          file: fileName,
          documentId: document.id,
          status: 'SUCCESS',
          questions: questionResults
        });

        // Calculate average response time
        const avgTime = questionResults
          .filter(q => q.responseTime)
          .reduce((sum, q) => sum + q.responseTime, 0) / questionResults.length;

        console.log(`${colors.bright}${colors.green}✓ Completed ${fileName}${colors.reset}`);
        console.log(`${colors.bright}  Average response time: ${formatTime(avgTime)}${colors.reset}\n`);

      } catch (error) {
        console.log(`${colors.red}❌ Error processing file: ${error.message}${colors.reset}\n`);
        results.push({
          file: fileName,
          status: 'ERROR',
          error: error.message,
          questions: []
        });
      }
    }
 
  // Print summary
  console.log(`${colors.bright}${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}                          TEST SUMMARY                           ${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}════════════════════════════════════════════════════════════════${colors.reset}\n`);

  const successfulFiles = results.filter(r => r.status === 'SUCCESS').length;
  const totalQuestions = results.reduce((sum, r) => sum + r.questions.length, 0);
  const successfulQuestions = results.reduce((sum, r) =>
    sum + r.questions.filter(q => q.status === 'SUCCESS').length, 0
  );

  console.log(`${colors.bright}Files processed:${colors.reset} ${successfulFiles}/${totalFiles}`);
  console.log(`${colors.bright}Questions answered:${colors.reset} ${successfulQuestions}/${totalQuestions}`);

  const allResponseTimes = results
    .flatMap(r => r.questions)
    .filter(q => q.responseTime)
    .map(q => q.responseTime);

  if (allResponseTimes.length > 0) {
    const avgResponseTime = allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length;
    const minResponseTime = Math.min(...allResponseTimes);
    const maxResponseTime = Math.max(...allResponseTimes);

    console.log(`${colors.bright}Average response time:${colors.reset} ${formatTime(avgResponseTime)}`);
    console.log(`${colors.bright}Min response time:${colors.reset} ${formatTime(minResponseTime)}`);
    console.log(`${colors.bright}Max response time:${colors.reset} ${formatTime(maxResponseTime)}`);
  }

    console.log('');

    // Save results to JSON
    const outputPath = path.join(__dirname, 'sop-test-results.json');
    fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
    console.log(`${colors.green}✓ Results saved to: ${outputPath}${colors.reset}\n`);

  } catch (error) {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    console.error(error.stack);
    process.exit(1);
  } finally {
    // Cleanup test user
    if (testUser) {
      await cleanupTestUser(testUser.user.id);
    }
    await prisma.$disconnect();
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(error => {
    console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
    process.exit(1);
  });
}
